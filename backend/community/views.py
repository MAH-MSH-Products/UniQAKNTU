from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema, OpenApiParameter

from community.models import StudentOpinion, OpinionVote, OpinionStatus
from community.services.leaderboard_service import LeaderboardService, VALID_PERIODS
from community.services.opinion_service import OpinionService
from community.serializers import (
    StudentOpinionSerializer,
    StudentOpinionCreateSerializer,
    OpinionVoteInputSerializer,
    OpinionVoteResponseSerializer,
    LeaderboardResponseSerializer,
)


class LeaderboardView(APIView):
    """
    Sub-module 4: Retrieves top 10 students based on total study hours and total tests.
    Data is served directly from the Redis cache for < 50ms latency.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Community Leaderboard",
        description="Retrieves the top 10 students ranking for the given period (day, week, month, three_months). Data is served from cache.",
        parameters=[
            OpenApiParameter(
                name="period",
                description="Ranking timeframe: day, week, month, three_months",
                required=False,
                type=str,
                default="week",
            ),
        ],
        responses={200: LeaderboardResponseSerializer},
    )
    def get(self, request):
        period = request.query_params.get('period', 'week').lower()
        if period not in VALID_PERIODS:
            period = 'week'

        leaderboard_data = LeaderboardService.get_leaderboard(period=period)
        serializer = LeaderboardResponseSerializer(leaderboard_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OpinionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class OpinionListCreateView(APIView):
    """
    Sub-module 4: List approved community opinions or submit new opinion to moderation queue.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List Approved Opinions",
        description="List approved student opinions. Supports sorting by 'recent' or 'top' (likes minus dislikes).",
        parameters=[
            OpenApiParameter(
                name="sort",
                description="Sorting order: 'recent' (default) or 'top'",
                required=False,
                type=str,
                default="recent",
            ),
            OpenApiParameter(
                name="page",
                description="Page number",
                required=False,
                type=int,
            ),
        ],
        responses={200: StudentOpinionSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        sort_order = request.query_params.get('sort', 'recent').lower()

        # Non-staff users can ONLY view APPROVED opinions
        if getattr(user, 'is_staff', False) or (hasattr(user, 'is_admin') and user.is_admin()):
            queryset = StudentOpinion.objects.all()
        else:
            queryset = StudentOpinion.objects.filter(status=OpinionStatus.APPROVED)

        if sort_order == 'top':
            queryset = queryset.annotate(
                score=F('likes') - F('dislikes')
            ).order_by('-score', '-created_at', '-id')
        else:
            queryset = queryset.order_by('-created_at', '-id')

        queryset = queryset.select_related('author')

        paginator = OpinionPagination()
        page = paginator.paginate_queryset(queryset, request)

        if page is not None:
            # Prefetch current user's votes for all opinions in the page slice
            opinion_ids = [op.id for op in page]
            user_votes = dict(
                OpinionVote.objects.filter(
                    opinion_id__in=opinion_ids,
                    user=user
                ).values_list('opinion_id', 'vote_type')
            )
            for op in page:
                op.user_vote = user_votes.get(op.id, 0)

            serializer = StudentOpinionSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)

        serializer = StudentOpinionSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Submit New Opinion",
        description="Submits a new student opinion to the moderation queue with default status PENDING.",
        request=StudentOpinionCreateSerializer,
        responses={
            201: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "status": {"type": "string"},
                },
            }
        },
    )
    def post(self, request):
        serializer = StudentOpinionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        opinion = OpinionService.submit_opinion(
            author=request.user,
            text=serializer.validated_data['text'],
            is_anonymous=serializer.validated_data.get('is_anonymous', False),
        )

        return Response(
            {
                "message": _("Opinion submitted successfully and is pending approval."),
                "status": opinion.status,
            },
            status=status.HTTP_201_CREATED,
        )


class OpinionVoteView(APIView):
    """
    Sub-module 4: Cast or toggle like/dislike vote on an opinion atomically.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Vote on Opinion",
        description="Cast, toggle, or switch like (+1) or dislike (-1) vote atomically.",
        request=OpinionVoteInputSerializer,
        responses={200: OpinionVoteResponseSerializer},
    )
    def post(self, request, pk):
        opinion = get_object_or_404(StudentOpinion, pk=pk)

        serializer = OpinionVoteInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        vote_value = serializer.validated_data['value']
        vote_result = OpinionService.cast_vote(
            opinion=opinion,
            user=request.user,
            value=vote_value,
        )

        return Response(vote_result, status=status.HTTP_200_OK)

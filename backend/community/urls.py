from django.urls import path
from community.views import (
    LeaderboardView,
    OpinionListCreateView,
    OpinionVoteView,
    AdminOpinionListView,
    AdminOpinionModerateView,
)

app_name = 'community'

urlpatterns = [
    # Sub-module 4: Community & Leaderboard
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('opinions/', OpinionListCreateView.as_view(), name='opinions-list-create'),
    path('opinions/<uuid:pk>/vote/', OpinionVoteView.as_view(), name='opinion-vote'),
    path('admin/opinions/', AdminOpinionListView.as_view(), name='admin-opinions-list'),
    path('admin/opinions/<uuid:pk>/moderate/', AdminOpinionModerateView.as_view(), name='admin-opinion-moderate'),
]


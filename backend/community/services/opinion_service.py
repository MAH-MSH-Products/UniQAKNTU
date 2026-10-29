from django.db import transaction
from django.db.models import F
from django.db.models.functions import Greatest
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from community.models import StudentOpinion, OpinionVote, OpinionStatus


class OpinionService:
    """
    Sub-module 4: Service for Student Opinion moderation queue and atomic voting.
    """

    @classmethod
    def submit_opinion(cls, author, text: str, is_anonymous: bool = False) -> StudentOpinion:
        """
        Submits a new opinion to the moderation queue (status='PENDING').
        """
        if not text or not text.strip():
            raise ValidationError(_('Opinion text cannot be empty.'))

        return StudentOpinion.objects.create(
            author=author,
            text=text.strip(),
            is_anonymous=is_anonymous,
            status=OpinionStatus.PENDING,
        )

    @classmethod
    def cast_vote(cls, opinion: StudentOpinion, user, value: int) -> dict:
        """
        Atomic voting logic with race condition prevention using F() expressions and database transactions.
        - Sending 1 when already liked removes like (sets to 0).
        - Sending -1 when already disliked removes dislike (sets to 0).
        - Sending 1 when neutral adds like (sets to 1).
        - Sending -1 when neutral adds dislike (sets to -1).
        - Sending 1 when disliked switches to like (sets to 1).
        - Sending -1 when liked switches to dislike (sets to -1).
        """
        if value not in (1, -1):
            raise ValidationError(_('Vote value must be 1 (Like) or -1 (Dislike).'))

        with transaction.atomic():
            existing_vote = (
                OpinionVote.objects.select_for_update()
                .filter(opinion=opinion, user=user)
                .first()
            )

            if existing_vote is None:
                # 1. New vote
                OpinionVote.objects.create(
                    opinion=opinion,
                    user=user,
                    vote_type=value
                )
                if value == 1:
                    StudentOpinion.objects.filter(id=opinion.id).update(
                        likes=F('likes') + 1
                    )
                else:
                    StudentOpinion.objects.filter(id=opinion.id).update(
                        dislikes=F('dislikes') + 1
                    )
                user_vote = value

            elif existing_vote.vote_type == value:
                # 2. Toggle off (remove vote)
                existing_vote.delete()
                if value == 1:
                    StudentOpinion.objects.filter(id=opinion.id).update(
                        likes=Greatest(F('likes') - 1, 0)
                    )
                else:
                    StudentOpinion.objects.filter(id=opinion.id).update(
                        dislikes=Greatest(F('dislikes') - 1, 0)
                    )
                user_vote = 0

            else:
                # 3. Switch vote (e.g., like -> dislike or dislike -> like)
                existing_vote.vote_type = value
                existing_vote.save(update_fields=['vote_type', 'updated_at'])

                if value == 1:  # switched from -1 to 1
                    StudentOpinion.objects.filter(id=opinion.id).update(
                        likes=F('likes') + 1,
                        dislikes=Greatest(F('dislikes') - 1, 0)
                    )
                else:  # switched from 1 to -1
                    StudentOpinion.objects.filter(id=opinion.id).update(
                        likes=Greatest(F('likes') - 1, 0),
                        dislikes=F('dislikes') + 1
                    )
                user_vote = value

        opinion.refresh_from_db()
        return {
            "likes": opinion.likes,
            "dislikes": opinion.dislikes,
            "user_vote": user_vote,
        }

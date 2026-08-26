from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Vote

def update_score(instance):
    obj = instance.content_object
    if obj and hasattr(obj, 'score'):
        # Calculate score
        votes = obj.votes.all()
        score = sum(vote.value for vote in votes)
        obj.score = score
        # Using update to avoid triggering signals/history for a simple score update
        obj.__class__.objects.filter(pk=obj.pk).update(score=score)

@receiver(post_save, sender=Vote)
def vote_saved(sender, instance, **kwargs):
    update_score(instance)

@receiver(post_delete, sender=Vote)
def vote_deleted(sender, instance, **kwargs):
    update_score(instance)

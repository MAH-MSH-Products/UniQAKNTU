from celery import shared_task
import logging
from community.services.leaderboard_service import LeaderboardService, VALID_PERIODS

logger = logging.getLogger(__name__)


@shared_task(name='community.tasks.update_all_leaderboards')
def update_all_leaderboards():
    """
    Sub-module 4: Periodic Celery task that precalculates and updates
    leaderboards for day, week, month, and three_months in Redis every 1 hour.
    """
    logger.info("Starting scheduled leaderboard precomputation...")
    results = {}
    for period in VALID_PERIODS.keys():
        try:
            data = LeaderboardService.calculate_and_cache_leaderboard(period)
            results[period] = len(data.get('results', []))
            logger.info(f"Leaderboard for '{period}' cached with {results[period]} entries.")
        except Exception as e:
            logger.error(f"Failed to precompute leaderboard for '{period}': {e}", exc_info=True)
            results[period] = f"Error: {str(e)}"

    return results

from django.urls import path
from planner.views import WeeklyPerformanceView

app_name = 'planner'

urlpatterns = [
    path('weekly-performance/', WeeklyPerformanceView.as_view(), name='weekly-performance'),
]

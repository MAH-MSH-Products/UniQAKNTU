# Widgets Serializers (serializers.py) Documentation

## Purpose
`backend/widgets/serializers.py` serializes aggregated data for the dashboard and sidebar widgets, including recent answers, popular courses, and latest exams.

## Key Components

### 1. `WidgetAnswerSerializer`
- Serializes recent answers with question title, course name, author, and localized creation date.
- Fields: `id`, `title`, `course`, `author`, `date`.
- Uses `core.utils.format_localized_date` to dynamically produce Jalali date strings for Persian requests and Gregorian date strings for English requests.

### 2. `WidgetCourseSerializer`
- Serializes courses and source materials with question count and localized creation date.
- Fields: `id`, `title`, `date`, `questions_count`.

## Integration
Consumed by `WidgetViewSet` in `backend/widgets/views.py` and rendered in the frontend sidebar widget panel (`WidgetsPanel.jsx`).

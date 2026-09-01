from rest_framework import serializers
import jdatetime
from django.utils import timezone

class JalaliDateField(serializers.DateField):
    """
    A DRF field that accepts and returns Jalali date strings (e.g. '1403-05-31'),
    but converts to/from Gregorian datetime.date objects for Django.
    """
    def to_representation(self, value):
        if not value:
            return None
        j_date = jdatetime.date.fromgregorian(date=value)
        return j_date.strftime("%Y-%m-%d")

    def to_internal_value(self, data):
        if not data:
            return None
        try:
            j_date = jdatetime.date.strptime(data, "%Y-%m-%d")
            return j_date.togregorian()
        except ValueError:
            self.fail('invalid')

class JalaliDateTimeField(serializers.DateTimeField):
    """
    A DRF field that accepts and returns Jalali datetime strings (e.g. '1403-05-31T12:00:00Z'),
    but converts to/from aware Gregorian datetime.datetime objects for Django.
    """
    def to_representation(self, value):
        if not value:
            return None
        # Convert to local time or keep UTC? Usually we keep UTC or whatever DRF does.
        j_datetime = jdatetime.datetime.fromgregorian(datetime=value)
        return j_datetime.strftime("%Y-%m-%dT%H:%M:%SZ")

    def to_internal_value(self, data):
        if not data:
            return None
        try:
            # simple parse, assuming exact format
            j_datetime = jdatetime.datetime.strptime(data, "%Y-%m-%dT%H:%M:%SZ")
            g_datetime = j_datetime.togregorian()
            return timezone.make_aware(g_datetime, timezone.utc)
        except ValueError:
            self.fail('invalid')


def format_localized_date(dt, lang=None):
    """
    Formats a date or datetime object according to the active language:
    - If language starts with 'fa': Jalali format ('YYYY/MM/DD')
    - Otherwise (e.g., 'en'): Gregorian format ('YYYY/MM/DD')
    """
    if not dt:
        return None
    from django.utils.translation import get_language
    current_lang = lang or get_language() or 'en'
    
    if current_lang.startswith('fa'):
        jdate = jdatetime.datetime.fromgregorian(datetime=dt) if hasattr(dt, 'hour') else jdatetime.date.fromgregorian(date=dt)
        return jdate.strftime('%Y/%m/%d')
    else:
        return dt.strftime('%Y/%m/%d')


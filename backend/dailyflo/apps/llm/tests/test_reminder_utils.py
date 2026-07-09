"""Tests for LLM reminder id normalisation."""

from django.test import SimpleTestCase

from apps.llm.services.reminder_utils import (
    extract_alert_ids_from_metadata,
    normalise_alert_ids,
    reminders_from_alert_ids,
)


class ReminderUtilsTests(SimpleTestCase):
    def test_normalise_alert_ids_dedupes_and_sorts_end_requires_duration(self):
        result = normalise_alert_ids(
            ['15-min', 'start', 'end', 'before-30'],
            duration=60,
            has_scheduled_time=True,
        )
        self.assertEqual(result, ['15-min', 'start', 'end', 'before-30'])

    def test_normalise_alert_ids_strips_end_without_duration(self):
        result = normalise_alert_ids(
            ['start', 'end'],
            duration=0,
            has_scheduled_time=True,
        )
        self.assertEqual(result, ['start'])

    def test_normalise_alert_ids_empty_for_all_day(self):
        result = normalise_alert_ids(
            ['15-min'],
            duration=0,
            has_scheduled_time=False,
        )
        self.assertEqual(result, [])

    def test_normalise_alert_ids_none_when_field_absent(self):
        self.assertIsNone(normalise_alert_ids(None, has_scheduled_time=True))

    def test_reminders_from_alert_ids_shape(self):
        rows = reminders_from_alert_ids(['start', 'before-45'])
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]['id'], 'start')
        self.assertEqual(rows[0]['type'], 'custom')
        self.assertTrue(rows[0]['isEnabled'])

    def test_extract_alert_ids_from_metadata(self):
        metadata = {
            'reminders': [
                {'id': '15-min', 'type': 'custom', 'isEnabled': True},
                {'id': 'end', 'type': 'custom', 'isEnabled': False},
            ]
        }
        self.assertEqual(extract_alert_ids_from_metadata(metadata), ['15-min'])

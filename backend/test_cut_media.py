import unittest

from backend.cut_media import plan_cuts
from backend.speech_policy import speech_events, contains_profanity


class CutPlanTest(unittest.TestCase):
    def test_merge_clamp_and_timeline(self):
        plan = plan_cuts(10, [
            {"start": 0, "end": 1, "reason": "nudity"},
            {"start": 1.5, "end": 2, "reason": "kissing"},
            {"start": 9.5, "end": 11, "reason": "swearing"},
        ])
        self.assertEqual(len(plan["removed_intervals"]), 2)
        self.assertEqual(plan["removed_intervals"][0]["reasons"], ["kissing", "nudity"])
        self.assertAlmostEqual(plan["output_duration"] + plan["removed_seconds"], 10)
        self.assertEqual(plan["kept_intervals"][0]["output_start"], 0)

    def test_no_findings_and_all_removed(self):
        self.assertEqual(plan_cuts(10, [])["output_duration"], 10)
        self.assertEqual(plan_cuts(10, [{"start": 0, "end": 10, "reason": "nudity"}])["kept_intervals"], [])

    def test_invalid_timestamps_fail(self):
        for start, end in [(float("nan"), 2), (1, float("inf")), (4, 2)]:
            with self.assertRaises(ValueError):
                plan_cuts(10, [{"start": start, "end": end, "reason": "kissing"}])

    def test_short_edges_removed(self):
        plan = plan_cuts(10, [{"start": .1, "end": 9.9, "reason": "kissing"}], padding=0)
        self.assertEqual(plan["kept_intervals"], [])

    def test_whole_tokens(self):
        self.assertFalse(contains_profanity("A classic cocktail glass"))
        self.assertTrue(contains_profanity("That is bullshit!"))

    def test_later_segments_and_word_boundaries(self):
        transcript = {"segments": [
            {"start": 0, "end": 1, "text": "hello"},
            {"start": 8, "end": 10, "text": "oh shit",
             "words": [{"word": "oh", "start": 8, "end": 8.5},
                       {"word": "shit", "start": 8.5, "end": 9}]},
            {"start": 12, "end": 14, "text": "damn"},
        ]}
        self.assertEqual(speech_events(transcript), [
            {"start": 8.5, "end": 9, "reason": "swearing"},
            {"start": 12, "end": 14, "reason": "swearing"},
        ])


if __name__ == "__main__":
    unittest.main()

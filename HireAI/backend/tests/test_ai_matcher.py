import math
import unittest
from unittest.mock import Mock, patch

from services.ai_matcher import (
    _extract_experience_years,
    _skill_is_match,
    _to_float,
    calculate_match,
)


class FakeEmbeddingModel:
    def __init__(self):
        self.encode = Mock(side_effect=self._encode)
        self.encoded_batches = []

    def _encode(self, texts):
        self.encoded_batches.append(list(texts))
        return [[1.0, 0.0] for _ in texts]


class SkillMatchingTests(unittest.TestCase):
    def test_similar_skill_names_are_not_matched_by_substring(self):
        with patch("services.ai_matcher._get_model") as get_model:
            self.assertFalse(_skill_is_match("sql", "nosql"))
            self.assertFalse(_skill_is_match("java", "javascript"))
            self.assertFalse(_skill_is_match("c", "c++"))

        get_model.assert_not_called()

    def test_whole_skill_phrases_match_without_embedding(self):
        with patch("services.ai_matcher._get_model") as get_model:
            self.assertTrue(_skill_is_match("sql", "sql server"))
            self.assertTrue(_skill_is_match("python", "python programming"))

        get_model.assert_not_called()

    def test_semantic_fallback_handles_distinct_skill_labels(self):
        model = FakeEmbeddingModel()
        with patch("services.ai_matcher._get_model", return_value=model):
            self.assertTrue(_skill_is_match("gcp", "google cloud platform"))

        model.encode.assert_called_once_with(
            ["gcp", "google cloud platform"]
        )


class ExperienceParsingTests(unittest.TestCase):
    def test_negative_and_non_finite_experience_do_not_count_as_years(self):
        self.assertEqual(
            _extract_experience_years({"experience": "-2 years"}),
            0.0,
        )
        self.assertEqual(
            _extract_experience_years({"experience_years": -2}),
            0.0,
        )
        self.assertEqual(
            _extract_experience_years({"experience_years": math.inf}),
            0.0,
        )
        self.assertIsNone(_to_float("nan"))

    def test_supported_experience_strings_still_parse(self):
        self.assertEqual(
            _extract_experience_years({"experience": "8.5 years"}),
            8.5,
        )
        self.assertEqual(
            _extract_experience_years({"experience": "7+ yrs"}),
            7.0,
        )


class CalculateMatchTests(unittest.TestCase):
    def test_target_job_title_is_not_added_to_candidate_text_and_encoding_is_batched(
        self,
    ):
        model = FakeEmbeddingModel()
        candidate = {
            "current_role": "Data Analyst",
            "applied_role": "Senior Data Engineer",
            "skills": ["Python", "Python", "SQL"],
            "experience_years": 8,
        }
        job = {
            "title": "Senior Data Engineer",
            "mandatory_skills": ["Python"],
            "required_skills": ["SQL"],
            "min_exp": 5,
            "description": "Build production data pipelines",
        }

        with patch("services.ai_matcher._get_model", return_value=model):
            result = calculate_match(candidate, job)

        self.assertEqual(result["score"], 100)
        self.assertEqual(len(model.encoded_batches), 1)
        encoded_texts = model.encoded_batches[0]
        candidate_text = next(
            text for text in encoded_texts if text.startswith("Data Analyst")
        )
        self.assertNotIn("Senior Data Engineer", candidate_text)
        self.assertEqual(encoded_texts.count("python"), 1)
        self.assertEqual(encoded_texts.count("sql"), 1)

    def test_substring_false_positive_is_reported_as_missing_mandatory_skill(
        self,
    ):
        model = FakeEmbeddingModel()
        candidate = {
            "current_role": "Database Engineer",
            "skills": ["NoSQL"],
            "experience_years": 5,
        }
        job = {
            "title": "SQL Engineer",
            "mandatory_skills": ["SQL"],
            "required_skills": [],
            "min_exp": 5,
        }

        with patch("services.ai_matcher._get_model", return_value=model):
            result = calculate_match(candidate, job)

        self.assertEqual(result["missing_skills"], ["sql"])
        self.assertEqual(result["category"], "Low Match")
        self.assertEqual(result["score"], 20)
        self.assertEqual(len(model.encoded_batches), 1)


if __name__ == "__main__":
    unittest.main()

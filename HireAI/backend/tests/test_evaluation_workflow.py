import unittest
from types import SimpleNamespace
from unittest.mock import patch

from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token

from routes.candidates import candidates
from routes.interviews import interviews
from utils.auth_helpers import (
    format_interview_evaluation_note,
    get_required_interview_round,
)


class EvaluationCursor:
    def __init__(self, scheduled_round=None, current_stage="Shortlisted"):
        self.scheduled_round = scheduled_round
        self.current_stage = current_stage
        self.current_result = None
        self.updates = []
        self.completed_interviews = []

    def execute(self, query, parameters=None):
        if "SELECT current_status" in query:
            self.current_result = (self.current_stage,)
        elif "SELECT TOP 1 interview_id, interview_round" in query:
            self.current_result = (
                (42, self.scheduled_round)
                if self.scheduled_round
                else None
            )
        elif query.lstrip().startswith("UPDATE dbo.Interviews"):
            self.completed_interviews.append((query, parameters))
            self.current_result = None
        elif "INFORMATION_SCHEMA.COLUMNS" in query:
            self.current_result = (1,)
        elif "FROM dbo.Candidates" in query and query.lstrip().startswith("SELECT"):
            self.current_result = SimpleNamespace(
                candidate_id=7,
                full_name="Morgan Lee",
                email="morgan@example.com",
                phone=None,
                current_role="Engineer",
                applied_role="Data Engineer",
                location="Hyderabad",
                experience_years=6,
                current_ctc=None,
                current_status=self.current_stage,
                ai_score=78,
                created_at=None,
                notice_period=None,
                skills="Python, SQL",
                interview_notes="L1: Previously recorded feedback",
            )
        elif query.lstrip().startswith("UPDATE dbo.Candidates"):
            self.updates.append((query, parameters))
            self.current_stage = parameters[0]
            self.current_result = None
        else:
            self.current_result = None

    def fetchone(self):
        return self.current_result


class EvaluationConnection:
    def __init__(self, cursor):
        self.fake_cursor = cursor
        self.committed = False
        self.closed = False

    def cursor(self):
        return self.fake_cursor

    def commit(self):
        self.committed = True

    def rollback(self):
        pass

    def close(self):
        self.closed = True


class CompletedInterviewCursor:
    def __init__(self):
        self.current_result = None

    def execute(self, query, parameters=None):
        if "SELECT interview_id, is_completed" in query:
            self.current_result = (42, True)
        else:
            self.current_result = None

    def fetchone(self):
        return self.current_result


class InterviewScheduleCursor:
    def __init__(self):
        self.current_result = None
        self.insert_parameters = None

    def execute(self, query, parameters=None):
        if "SELECT current_status, job_id" in query:
            self.current_result = ("Shortlisted", 11)
        elif "SELECT TOP 1 interview_id" in query:
            self.current_result = None
        elif query.lstrip().startswith("INSERT INTO dbo.Interviews"):
            self.insert_parameters = parameters
            self.current_result = (42,)
        elif "FROM dbo.Interviews" in query:
            self.current_result = SimpleNamespace(
                interview_id=42,
                candidate_name="Morgan Lee",
                role_name="Data Engineer",
                interview_round="L1 Interview",
                scheduled_at=self.insert_parameters[3],
                notes=None,
                is_completed=False,
                candidate_id=7,
                candidate_interview_notes=None,
            )

    def fetchone(self):
        return self.current_result


class EvaluationWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["JWT_SECRET_KEY"] = "evaluation-workflow-test-secret-key"
        JWTManager(self.app)
        self.app.register_blueprint(candidates)
        self.app.register_blueprint(interviews)
        self.client = self.app.test_client()
        with self.app.app_context():
            self.token = create_access_token(identity="1")

    def test_scheduling_first_round_creates_interview_record(self):
        cursor = InterviewScheduleCursor()
        connection = EvaluationConnection(cursor)
        payload = {
            "candidate_id": 7,
            "interview_round": "L1 Interview",
            "interview_date": "2027-01-15",
            "interview_time": "10:30",
            "duration": 60,
        }

        with patch("routes.interviews.ensure_schema"), patch(
            "routes.interviews.get_connection",
            return_value=connection,
        ):
            response = self.client.post(
                "/api/interviews",
                headers={"Authorization": f"Bearer {self.token}"},
                json=payload,
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["round"], "L1 Interview")
        self.assertFalse(response.get_json()["is_completed"])
        self.assertEqual(
            cursor.insert_parameters[:3],
            (7, 11, "L1 Interview"),
        )
        self.assertTrue(connection.committed)

    def test_completed_interview_cannot_be_rescheduled(self):
        connection = EvaluationConnection(CompletedInterviewCursor())
        with patch("routes.interviews.ensure_schema"), patch(
            "routes.interviews.get_connection",
            return_value=connection,
        ):
            response = self.client.patch(
                "/api/interviews/42/schedule",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "interview_date": "2027-01-15",
                    "interview_time": "10:30",
                },
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.get_json()["error"],
            "Completed interviews cannot be rescheduled",
        )

    def _patch_stage(self, connection, payload):
        with patch("routes.candidates.ensure_schema"), patch(
            "routes.candidates.get_connection",
            return_value=connection,
        ):
            return self.client.patch(
                "/api/candidates/7/stage",
                headers={"Authorization": f"Bearer {self.token}"},
                json=payload,
            )

    def test_evaluation_requires_matching_scheduled_interview(self):
        cursor = EvaluationCursor()
        connection = EvaluationConnection(cursor)

        response = self._patch_stage(
            connection,
            {
                "stage": "L1 Interview",
                "evaluation_notes": "Candidate is suitable for the role.",
            },
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(cursor.updates, [])
        self.assertFalse(connection.committed)

    def test_evaluation_appends_labeled_note_and_advances_stage(self):
        cursor = EvaluationCursor(scheduled_round="L1 Interview")
        connection = EvaluationConnection(cursor)

        response = self._patch_stage(
            connection,
            {
                "stage": "L1 Interview",
                "evaluation_notes": "Candidate is suitable for the role.",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(cursor.updates), 1)
        update_query, parameters = cursor.updates[0]
        self.assertIn("interview_notes = CASE", update_query)
        self.assertEqual(
            parameters,
            (
                "L1 Interview",
                "L1: Candidate is suitable for the role.",
                "L1: Candidate is suitable for the role.",
                7,
            ),
        )
        self.assertEqual(
            cursor.completed_interviews[0][1],
            ("L1: Candidate is suitable for the role.", 42),
        )
        self.assertIn(
            "SET is_completed = 1",
            cursor.completed_interviews[0][0],
        )
        self.assertTrue(connection.committed)

    def test_l2_candidate_can_skip_optional_client_interview(self):
        cursor = EvaluationCursor(current_stage="L2 Interview")
        connection = EvaluationConnection(cursor)

        response = self._patch_stage(connection, {"stage": "Offer Sent"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(cursor.updates), 1)
        self.assertNotIn(
            "interview_notes",
            cursor.updates[0][0],
        )
        self.assertEqual(cursor.updates[0][1], ("Offer Sent", 7))

    def test_offer_sent_candidate_can_be_marked_onboarded(self):
        cursor = EvaluationCursor(current_stage="Offer Sent")
        connection = EvaluationConnection(cursor)

        response = self._patch_stage(connection, {"stage": "Onboarded"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(cursor.updates[0][1], ("Onboarded", 7))

    def test_interview_round_is_selected_by_current_stage(self):
        self.assertEqual(
            get_required_interview_round("Shortlisted"),
            "L1 Interview",
        )
        self.assertEqual(
            get_required_interview_round("L1 Interview"),
            "L2 Interview",
        )
        self.assertEqual(
            get_required_interview_round("L2 Interview"),
            "Client Interview",
        )
        self.assertIsNone(get_required_interview_round("Offer Sent"))

    def test_note_prefix_uses_interview_round(self):
        self.assertEqual(
            format_interview_evaluation_note(
                "Client Interview",
                "  Strong client communication.  ",
            ),
            "Client: Strong client communication.",
        )


if __name__ == "__main__":
    unittest.main()

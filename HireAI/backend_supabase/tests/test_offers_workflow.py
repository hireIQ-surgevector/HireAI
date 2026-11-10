import unittest
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token

from routes.offers import offers


class OfferCursor:
    def __init__(
        self,
        candidate=("L2 Interview", 12, Decimal("18.00"), Decimal("28.00")),
        offer_id=31,
    ):
        self.candidate = candidate
        self.offer_id = offer_id
        self.current_result = None
        self.rowcount = 1
        self.executed = []

    def execute(self, query, parameters=None):
        self.executed.append((query, parameters))
        if "SELECT c.current_status, c.job_id" in query:
            self.current_result = self.candidate
        elif "INSERT INTO dbo.Offers" in query:
            self.current_result = (self.offer_id,)
        else:
            self.current_result = None

    def fetchone(self):
        return self.current_result

    def fetchall(self):
        return []


class OfferConnection:
    def __init__(self, cursor):
        self.fake_cursor = cursor
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def cursor(self):
        return self.fake_cursor

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


class OfferWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["JWT_SECRET_KEY"] = "offers-workflow-test-secret-key"
        JWTManager(self.app)
        self.app.register_blueprint(offers)
        self.client = self.app.test_client()
        with self.app.app_context():
            token = create_access_token(identity="1")
        self.headers = {"Authorization": f"Bearer {token}"}

    def test_create_offer_records_ctc_expiry_and_advances_candidate(self):
        cursor = OfferCursor()
        connection = OfferConnection(cursor)
        with patch("routes.offers.ensure_schema"), patch(
            "routes.offers.get_connection", return_value=connection
        ):
            response = self.client.post(
                "/api/offers",
                headers=self.headers,
                json={
                    "candidate_id": 7,
                    "ctc": 24.5,
                    "expiry_date": "2027-01-15",
                },
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["offer_id"], 31)
        self.assertTrue(connection.committed)
        self.assertFalse(connection.rolled_back)
        insert_query, insert_parameters = cursor.executed[1]
        self.assertIn("INSERT INTO dbo.Offers", insert_query)
        self.assertEqual(insert_parameters, (7, 12, insert_parameters[2], date(2027, 1, 15)))
        self.assertEqual(str(insert_parameters[2]), "24.5")
        self.assertIn("SET current_status = 'Offer Sent'", cursor.executed[2][0])

    def test_create_offer_rejects_candidates_not_ready_for_an_offer(self):
        cursor = OfferCursor(
            candidate=("L1 Interview", 12, Decimal("18.00"), Decimal("28.00"))
        )
        connection = OfferConnection(cursor)
        with patch("routes.offers.ensure_schema"), patch(
            "routes.offers.get_connection", return_value=connection
        ):
            response = self.client.post(
                "/api/offers",
                headers=self.headers,
                json={
                    "candidate_id": 7,
                    "ctc": 24.5,
                    "expiry_date": "2027-01-15",
                },
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(len(cursor.executed), 1)
        self.assertFalse(connection.committed)

    def test_create_offer_rejects_ctc_below_job_minimum(self):
        cursor = OfferCursor()
        connection = OfferConnection(cursor)
        with patch("routes.offers.ensure_schema"), patch(
            "routes.offers.get_connection", return_value=connection
        ):
            response = self.client.post(
                "/api/offers",
                headers=self.headers,
                json={
                    "candidate_id": 7,
                    "ctc": 17.99,
                    "expiry_date": "2027-01-15",
                },
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn("at least ₹18.00 LPA", response.get_json()["error"])
        self.assertFalse(any("INSERT INTO dbo.Offers" in query for query, _ in cursor.executed))

    def test_create_offer_rejects_ctc_above_job_maximum(self):
        cursor = OfferCursor()
        connection = OfferConnection(cursor)
        with patch("routes.offers.ensure_schema"), patch(
            "routes.offers.get_connection", return_value=connection
        ):
            response = self.client.post(
                "/api/offers",
                headers=self.headers,
                json={
                    "candidate_id": 7,
                    "ctc": 28.01,
                    "expiry_date": "2027-01-15",
                },
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn("must not exceed ₹28.00 LPA", response.get_json()["error"])
        self.assertFalse(any("INSERT INTO dbo.Offers" in query for query, _ in cursor.executed))

    def test_create_offer_requires_job_salary_range(self):
        cursor = OfferCursor(candidate=("L2 Interview", 12, None, None))
        connection = OfferConnection(cursor)
        with patch("routes.offers.ensure_schema"), patch(
            "routes.offers.get_connection", return_value=connection
        ):
            response = self.client.post(
                "/api/offers",
                headers=self.headers,
                json={
                    "candidate_id": 7,
                    "ctc": 24.5,
                    "expiry_date": "2027-01-15",
                },
            )

        self.assertEqual(response.status_code, 409)
        self.assertIn("salary range", response.get_json()["error"])
        self.assertFalse(any("INSERT INTO dbo.Offers" in query for query, _ in cursor.executed))

    def test_create_offer_requires_positive_ctc(self):
        with patch("routes.offers.ensure_schema"):
            response = self.client.post(
                "/api/offers",
                headers=self.headers,
                json={
                    "candidate_id": 7,
                    "ctc": 0,
                    "expiry_date": "2027-01-15",
                },
            )

        self.assertEqual(response.status_code, 400)

    def test_update_offer_status_accepts_supported_status(self):
        cursor = OfferCursor()
        connection = OfferConnection(cursor)
        with patch("routes.offers.ensure_schema"), patch(
            "routes.offers.get_connection", return_value=connection
        ):
            response = self.client.patch(
                "/api/offers/31/status",
                headers=self.headers,
                json={"status": "Accepted"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(connection.committed)
        self.assertEqual(cursor.executed[0][1], ("Accepted", 31))

    def test_update_offer_status_rejects_unknown_status(self):
        with patch("routes.offers.ensure_schema"):
            response = self.client.patch(
                "/api/offers/31/status",
                headers=self.headers,
                json={"status": "Sent"},
            )

        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()

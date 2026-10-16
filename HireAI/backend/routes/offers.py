from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from config.db import get_connection
from utils.auth_helpers import normalize_candidate_stage
from utils.schema import ensure_schema


offers = Blueprint("offers", __name__)
OFFER_STATUSES = {"Pending", "Accepted", "Declined", "Expired"}


def _serialize_offer(row):
    return {
        "offer_id": row.offer_id,
        "candidate_id": row.candidate_id,
        "candidate_name": row.candidate_name,
        "candidate_email": row.candidate_email,
        "candidate_stage": row.candidate_stage,
        "job_id": row.job_id,
        "role": row.role,
        "ctc": float(row.ctc),
        "currency": row.currency,
        "expiry_date": (
            row.expiry_date.isoformat()
            if isinstance(row.expiry_date, (date, datetime))
            else str(row.expiry_date)
        ),
        "status": row.status,
        "sent_at": (
            row.sent_at.isoformat()
            if isinstance(row.sent_at, (date, datetime))
            else str(row.sent_at)
        ),
        "updated_at": (
            row.updated_at.isoformat()
            if isinstance(row.updated_at, (date, datetime))
            else str(row.updated_at)
        ),
    }


@offers.route("/api/offers", methods=["GET"])
@jwt_required(optional=False)
def get_offers():
    conn = None
    try:
        ensure_schema()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                o.offer_id,
                o.candidate_id,
                c.full_name AS candidate_name,
                c.email AS candidate_email,
                c.current_status AS candidate_stage,
                o.job_id,
                COALESCE(j.title, c.applied_role) AS role,
                o.ctc,
                o.currency,
                o.expiry_date,
                o.status,
                o.sent_at,
                o.updated_at
            FROM dbo.Offers o
            INNER JOIN dbo.Candidates c ON c.candidate_id = o.candidate_id
            LEFT JOIN dbo.Jobs j ON j.job_id = o.job_id
            ORDER BY o.sent_at DESC, o.offer_id DESC
        """)
        rows = cursor.fetchall()
        return jsonify([_serialize_offer(row) for row in rows]), 200
    except Exception as error:
        return jsonify({"error": str(error)}), 500
    finally:
        if conn:
            conn.close()


@offers.route("/api/offers", methods=["POST"])
@jwt_required(optional=False)
def create_offer():
    conn = None
    try:
        ensure_schema()
        data = request.get_json(silent=True) or {}
        candidate_id = data.get("candidate_id")
        if isinstance(candidate_id, bool) or not isinstance(candidate_id, int):
            return jsonify({"error": "A valid candidate_id is required"}), 400

        try:
            ctc = Decimal(str(data.get("ctc", "")))
        except (InvalidOperation, ValueError):
            return jsonify({"error": "Enter a valid offer CTC"}), 400
        if not ctc.is_finite() or ctc <= 0 or ctc > Decimal("9999999999.99"):
            return jsonify({"error": "Offer CTC must be greater than zero"}), 400

        try:
            expiry_date = date.fromisoformat(str(data.get("expiry_date", "")))
        except ValueError:
            return jsonify({"error": "Enter a valid offer expiry date"}), 400
        if expiry_date < date.today():
            return jsonify({"error": "Offer expiry date cannot be in the past"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT c.current_status, c.job_id, j.min_salary, j.max_salary
            FROM dbo.Candidates c
            LEFT JOIN dbo.Jobs j ON j.job_id = c.job_id
            WHERE c.candidate_id = ?
            """,
            (candidate_id,),
        )
        candidate = cursor.fetchone()
        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404

        current_stage = normalize_candidate_stage(candidate[0])
        if current_stage not in {"L2 Interview", "Client Interview"}:
            return jsonify({
                "error": "Offers can only be created for candidates at the L2 or Client Interview stage"
            }), 409

        minimum_ctc = (
            Decimal(str(candidate[2]))
            if candidate[2] is not None
            else None
        )
        maximum_ctc = (
            Decimal(str(candidate[3]))
            if candidate[3] is not None
            else None
        )
        if minimum_ctc is None and maximum_ctc is None:
            return jsonify({
                "error": "Set a minimum or maximum salary range on the job before creating an offer"
            }), 409
        if minimum_ctc is not None and ctc < minimum_ctc:
            return jsonify({
                "error": f"Offer CTC must be at least ₹{minimum_ctc} LPA for this job"
            }), 400
        if maximum_ctc is not None and ctc > maximum_ctc:
            return jsonify({
                "error": f"Offer CTC must not exceed ₹{maximum_ctc} LPA for this job"
            }), 400

        cursor.execute(
            """
            INSERT INTO dbo.Offers (candidate_id, job_id, ctc, expiry_date)
            OUTPUT INSERTED.offer_id
            VALUES (?, ?, ?, ?)
            """,
            (candidate_id, candidate[1], ctc, expiry_date),
        )
        offer_row = cursor.fetchone()
        if not offer_row:
            raise RuntimeError("Offer record was not created")

        cursor.execute(
            """
            UPDATE dbo.Candidates
            SET current_status = 'Offer Sent'
            WHERE candidate_id = ?
            """,
            (candidate_id,),
        )
        conn.commit()
        return jsonify({
            "message": "Offer created successfully",
            "offer_id": offer_row[0],
            "candidate_id": candidate_id,
            "stage": "Offer Sent",
        }), 201
    except Exception as error:
        if conn:
            conn.rollback()
        return jsonify({"error": str(error)}), 500
    finally:
        if conn:
            conn.close()


@offers.route("/api/offers/<int:offer_id>/status", methods=["PATCH"])
@jwt_required(optional=False)
def update_offer_status(offer_id):
    conn = None
    try:
        ensure_schema()
        data = request.get_json(silent=True) or {}
        status = data.get("status")
        if not isinstance(status, str) or status not in OFFER_STATUSES:
            return jsonify({
                "error": f"Status must be one of: {', '.join(sorted(OFFER_STATUSES))}"
            }), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE dbo.Offers
            SET status = ?, updated_at = GETDATE()
            WHERE offer_id = ?
            """,
            (status, offer_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Offer not found"}), 404

        conn.commit()
        return jsonify({
            "message": "Offer status updated",
            "offer_id": offer_id,
            "status": status,
        }), 200
    except Exception as error:
        if conn:
            conn.rollback()
        return jsonify({"error": str(error)}), 500
    finally:
        if conn:
            conn.close()

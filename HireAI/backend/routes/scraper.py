from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from scraper.job_scraper import scrape_job


scraper = Blueprint(
    "scraper",
    __name__
)


# ==========================================================
# SCRAPE JOB FROM URL
# ==========================================================

@scraper.route(
    "/api/scrape-job",
    methods=["POST"]
)
@jwt_required(optional=True)
def scrape_job_endpoint():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "error":
                    "Request body is required."
            }), 400

        url = data.get("url")

        if not url:

            return jsonify({
                "error":
                    "Job posting URL is required."
            }), 400

        url = url.strip()

        if not url.startswith(
            ("http://", "https://")
        ):

            return jsonify({
                "error":
                    "Please provide a valid HTTP/HTTPS URL."
            }), 400

        # --------------------------------------
        # Scrape job
        # --------------------------------------

        job_data = scrape_job(
            url
        )

        # --------------------------------------
        # Return result
        # --------------------------------------

        return jsonify({
            "success": True,
            "job": job_data
        }), 200

    except Exception as e:

        print(
            "Job scraping error:",
            str(e)
        )

        return jsonify({
            "success": False,
            "error":
                "Unable to scrape the job posting."
        }), 500

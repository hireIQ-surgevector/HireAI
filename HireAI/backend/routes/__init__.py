from routes.auth import auth
from routes.dashboard import dashboard
from routes.candidates import candidates
from routes.interviews import interviews
from routes.jobs import jobs
from routes.scraper import scraper
from routes.matcher import matching


def register_routes(app):

    app.register_blueprint(auth)
    app.register_blueprint(dashboard)
    app.register_blueprint(candidates)
    app.register_blueprint(interviews)
    app.register_blueprint(jobs)
    app.register_blueprint(scraper)
    app.register_blueprint(matching)
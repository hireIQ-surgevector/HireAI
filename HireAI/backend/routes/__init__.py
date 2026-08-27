from routes.auth import auth
from routes.dashboard import dashboard
from routes.candidates import candidates
from routes.interviews import interviews
from routes.jobs import jobs


def register_routes(app):

    app.register_blueprint(auth)
    app.register_blueprint(dashboard)
    app.register_blueprint(candidates)
    app.register_blueprint(interviews)
    app.register_blueprint(jobs)
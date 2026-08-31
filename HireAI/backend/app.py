import os
from flask import Flask, send_file
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

from routes import register_routes
from api import api


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(
    os.path.join(BASE_DIR, '.env')
)


app = Flask(__name__)

app.config['JWT_SECRET_KEY'] = os.getenv(
    'JWT_SECRET',
    'dev-secret-key'
)


# ==========================================
# INITIALIZE EXTENSIONS
# ==========================================

bcrypt = Bcrypt(app)

jwt = JWTManager(app)

CORS(app)


# ==========================================
# REGISTER ALL ROUTES
# ==========================================

register_routes(app)

app.register_blueprint(api)

# ==========================================
# HOME ROUTE
# ==========================================

@app.route('/')
def home():
    return send_file('app.py')


# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5001
    )
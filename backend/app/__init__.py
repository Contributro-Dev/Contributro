from flask import Flask
from flask_cors import CORS
from .config import Config
from .extension import mongo, jwt, init_mongo

def create_app():
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, origins=["http://localhost:5173"])  # React Vite dev server
    init_mongo(app)
    jwt.init_app(app)

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.projects import projects_bp
    from .routes.recommendations import recommendations_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")

    return app
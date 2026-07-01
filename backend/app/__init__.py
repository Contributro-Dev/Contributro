from flask import Flask, app
from flask_cors import CORS
from .config import Config
from .extensions import db, jwt, init_mongo


def create_app():
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, origins=["http://localhost:5173", "http://localhost:5174"])  # React Vite dev server
    init_mongo(app)
    jwt.init_app(app)

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.projects import projects_bp
    from .routes.recommendations import recommendations_bp
    from .routes.connections import connections_bp
    from .routes.task import tasks_bp
    from .routes.messages import messages_bp
    from .routes.discussions import discussions_bp

    app.register_blueprint(discussions_bp, url_prefix="/api/discussions")
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")
    app.register_blueprint(connections_bp, url_prefix="/api/connections")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")

    return app
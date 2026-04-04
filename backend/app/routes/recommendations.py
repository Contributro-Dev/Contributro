# =============================================================
#  FILE: app/routes/recommendations.py
#  WHAT THIS FILE DOES:
#    This file is the "WAITER" between your ML brain and the outside world.
#
#    Your ML engine (recommender.py) is like a chef in the kitchen.
#    The frontend (React) is like a customer at a table.
#    This file (routes) is the WAITER who:
#      - Takes orders from customers (HTTP requests from React)
#      - Goes to the kitchen (calls the ML engine)
#      - Brings back the food (returns JSON response)
#
#  API ENDPOINTS THIS FILE CREATES:
#    GET  /api/recommendations/projects              → recommend projects for user
#    GET  /api/recommendations/collaborators/<id>    → recommend users for a project
#    POST /api/recommendations/refresh               → retrain ML with new projects
#
#  WHAT IS AN ENDPOINT?
#    An endpoint is a URL that your backend "listens" to.
#    When React sends a request to that URL, this code runs
#    and sends back a response (usually JSON data).
# =============================================================


# ─────────────────────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────────────────────

# Flask tools:
# Blueprint    → groups related routes together (like a mini-app)
# jsonify      → converts Python dict/list to JSON response
# request      → lets us read data from the incoming HTTP request
from flask import Blueprint, jsonify, request

# JWT tools:
# jwt_required   → decorator that blocks the route if no valid token
# get_jwt_identity → gets the user's ID from the JWT token
from flask_jwt_extended import jwt_required, get_jwt_identity

# ObjectId → MongoDB uses special ID format, this lets us use it
from bson import ObjectId

# db → our MongoDB connection from extensions.py
from ..extensions import db

# recommender → the GLOBAL ML engine instance from recommender.py
# This is the ONE shared instance that stays trained in memory
from ..ml.recommender import recommender


# ─────────────────────────────────────────────────────────────
# CREATE BLUEPRINT
#
# WHAT IS A BLUEPRINT?
#   A Blueprint is like a mini Flask app for a specific feature.
#   Instead of putting ALL routes in one file, we group them.
#   The 'recommendations' blueprint handles all recommendation routes.
#
# HOW IT'S REGISTERED:
#   In app/__init__.py:
#     app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
#
#   This means ALL routes in this file automatically start with /api/recommendations
#   So @bp.route('/projects') becomes → GET /api/recommendations/projects
# ─────────────────────────────────────────────────────────────

recommendations_bp = Blueprint('recommendations', __name__)


# ─────────────────────────────────────────────────────────────
# HELPER FUNCTION: _ensure_index_built
# PURPOSE: Make sure the ML model is trained before using it
# ─────────────────────────────────────────────────────────────

def _ensure_index_built():
    """
    Checks if the ML recommender has been trained.
    If not, loads all projects from MongoDB and trains it.

    WHY DO WE NEED THIS?
        When Flask server starts, the recommender is EMPTY (not trained).
        The first time someone requests recommendations, we need to:
          1. Load all projects from MongoDB
          2. Call recommender.fit() to train the model

        After that, the model stays trained in memory for all future requests.

    WHEN IS IT CALLED?
        At the start of every recommendation endpoint.
        But it only actually does work the FIRST time (when not fitted).
        After that, recommender.project_vectors is set, so it skips training.

    ANALOGY:
        Like a calculator that needs batteries.
        First time you use it → put in batteries (train the model)
        After that → just use it directly (model already trained)
    """

    # Check if the model has been trained yet
    # project_vectors is None until fit() is called
    if recommender.project_vectors is None:

        # Load ALL projects from MongoDB
        # find({}) means: get everything (no filter)
        # list() converts the MongoDB cursor to a Python list
        projects = list(db.projects.find({}))

        print(f"[ML] Building index from {len(projects)} projects in MongoDB...")

        # Train the ML model on all projects
        # After this, recommender.project_vectors is set
        if projects:
            recommender.fit(projects)
        else:
            print("[ML] Warning: No projects in database yet!")


# ─────────────────────────────────────────────────────────────
# ENDPOINT 1: GET /api/recommendations/projects
# PURPOSE: Return recommended projects for the currently logged-in user
# ─────────────────────────────────────────────────────────────

@recommendations_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_project_recommendations():
    """
    Returns a list of projects recommended for the logged-in user.

    HOW IT WORKS:
        1. JWT token is verified (@jwt_required)
        2. User's GitHub ID is extracted from the token
        3. User's data is fetched from MongoDB
        4. ML engine finds best matching projects
        5. Return as JSON

    REQUEST:
        GET /api/recommendations/projects
        Headers: Authorization: Bearer <jwt_token>
        Optional query param: ?limit=5  (default: 10)

    RESPONSE (success):
        {
            "recommendations": [
                {
                    "_id": "abc123",
                    "title": "AI Study Buddy",
                    "match_score": 87.4,
                    "required_skills": ["python", "machine learning"],
                    "domain": "EdTech"
                },
                ...
            ],
            "count": 3
        }

    RESPONSE (error):
        {"error": "User not found"}, status 404
    """

    # ── STEP 1: Get the logged-in user's ID from JWT token ──
    #
    # @jwt_required() already verified the token is valid
    # get_jwt_identity() extracts the user ID we stored in the token
    # In auth.py, the token was created with: create_access_token(identity=github_id)
    # So here we get back the github_id

    github_id = get_jwt_identity()
    # github_id = "192767789"  (string)


    # ── STEP 2: Fetch the user from MongoDB ──
    #
    # find_one() returns ONE document (or None if not found)
    # We search by github_id to find this specific user

    user = db.users.find_one({"github_id": str(github_id)})

    # If user doesn't exist in our database, return 404 error
    if not user:
        return jsonify({"error": "User not found"}), 404


    # ── STEP 3: Make sure ML model is trained ──
    #
    # This trains on all projects if not already done
    # If already trained, this does nothing (skips quickly)

    _ensure_index_built()


    # ── STEP 4: Read optional query parameter ──
    #
    # The frontend can request a specific number of results:
    # GET /api/recommendations/projects?limit=5
    #
    # request.args.get('limit', 10) means:
    #   try to get 'limit' from URL query params
    #   if not provided, use 10 as default
    # int() converts the string "5" to integer 5

    top_n = int(request.args.get('limit', 10))


    # ── STEP 5: Get recommendations from ML engine ──
    #
    # Pass the user dict and how many results to return
    # The ML engine does all the TF-IDF + cosine similarity work
    # Returns a list of project dicts with 'match_score' added

    results = recommender.recommend_projects(user, top_n=top_n)


    # ── STEP 6: Return the results as JSON ──
    #
    # jsonify() converts Python dict to proper JSON HTTP response
    # The frontend will receive this JSON and display it

    return jsonify({
        "recommendations": results,  # list of matching projects
        "count": len(results)         # how many results
    })


# ─────────────────────────────────────────────────────────────
# ENDPOINT 2: GET /api/recommendations/collaborators/<project_id>
# PURPOSE: Return recommended collaborators for a specific project
# ─────────────────────────────────────────────────────────────

@recommendations_bp.route('/collaborators/<project_id>', methods=['GET'])
@jwt_required()
def get_collaborator_recommendations(project_id):
    """
    Returns a list of users recommended as collaborators for a project.

    HOW IT WORKS:
        1. JWT token verified
        2. Fetch the specific project from MongoDB by ID
        3. Fetch all users from MongoDB (excluding passwords)
        4. ML engine finds users whose skills match project requirements
        5. Return as JSON

    REQUEST:
        GET /api/recommendations/collaborators/64f1234abc...
        Headers: Authorization: Bearer <jwt_token>
        Optional: ?limit=5  (default: 5)

    URL PARAMETER:
        project_id → the MongoDB _id of the project (from URL)

    RESPONSE (success):
        {
            "collaborators": [
                {
                    "_id": "user123",
                    "name": "Alice",
                    "skills": ["python", "flask"],
                    "match_score": 91.2
                    // note: password is NEVER included
                },
                ...
            ],
            "count": 3
        }
    """

    # ── STEP 1: Fetch the project from MongoDB ──
    #
    # project_id comes from the URL: /collaborators/64f1234abc
    # ObjectId() converts the string ID to MongoDB's special ID format
    # Without ObjectId(), MongoDB won't find the document

    project = db.projects.find_one({"_id": ObjectId(project_id)})

    # If project doesn't exist, return 404 error
    if not project:
        return jsonify({"error": "Project not found"}), 404


    # ── STEP 2: Fetch ALL users from MongoDB ──
    #
    # {"password": 0} is a MongoDB PROJECTION
    # It means: return all fields EXCEPT password
    # 0 = exclude this field
    # 1 = include this field (not needed here since we want everything except password)
    #
    # This is server-side security — passwords never leave the database
    # even accidentally

    all_users = list(db.users.find({}, {"password": 0}))


    # ── STEP 3: Get optional limit parameter ──

    top_n = int(request.args.get('limit', 5))


    # ── STEP 4: Get collaborator recommendations from ML engine ──
    #
    # Pass the project and all users
    # ML engine compares project skills to each user's skills
    # Returns top N users with match scores

    results = recommender.recommend_collaborators(project, all_users, top_n=top_n)


    # ── STEP 5: Return results as JSON ──

    return jsonify({
        "collaborators": results,  # list of matching users
        "count": len(results)       # how many found
    })


# ─────────────────────────────────────────────────────────────
# ENDPOINT 3: POST /api/recommendations/refresh
# PURPOSE: Retrain the ML model with the latest projects from MongoDB
# ─────────────────────────────────────────────────────────────

@recommendations_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_index():
    """
    Retrains the ML recommendation engine with all current projects.

    WHEN TO CALL THIS:
        - After new projects are added to the database
        - The ML model doesn't automatically know about new projects
        - So we need to retrain it with the updated project list

    HOW IT WORKS:
        1. Fetch all projects from MongoDB (including newly added ones)
        2. Call recommender.fit() to retrain with fresh data
        3. Return success message

    REQUEST:
        POST /api/recommendations/refresh
        Headers: Authorization: Bearer <jwt_token>
        Body: (empty — no data needed)

    RESPONSE:
        {"message": "Index rebuilt with 15 projects"}

    NOTE:
        This is called automatically by _ensure_index_built() on first request.
        But you can call this manually anytime to force a retrain.
        For example, after someone creates a new project in your app.
    """

    # ── STEP 1: Fetch ALL current projects from MongoDB ──
    #
    # This gets the LATEST data including any newly added projects

    projects = list(db.projects.find({}))


    # ── STEP 2: Retrain the ML engine ──
    #
    # recommender.fit() completely retrains from scratch:
    #   - Rebuilds all document texts
    #   - Re-fits the TF-IDF vectorizer on all projects
    #   - Saves updated vectorizer to disk

    recommender.fit(projects)


    # ── STEP 3: Return success message ──

    return jsonify({
        "message": f"Index rebuilt with {len(projects)} projects"
    })

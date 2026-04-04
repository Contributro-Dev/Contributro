# =============================================================
#  FILE: app/ml/recommender.py
#  WHAT THIS FILE DOES:
#    This is the BRAIN of your ML system.
#    It does 2 main jobs:
#      JOB 1: recommend_projects()
#             → Given a USER, find the best matching PROJECTS
#      JOB 2: recommend_collaborators()
#             → Given a PROJECT, find the best matching USERS
#
#  HOW IT WORKS (BIG PICTURE):
#    1. Convert all projects to NUMBER VECTORS using TF-IDF
#    2. Convert the user's skills to a NUMBER VECTOR too
#    3. Measure HOW SIMILAR the user vector is to each project vector
#       (this is called Cosine Similarity)
#    4. Sort by similarity score → return top results
# =============================================================


# ─────────────────────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────────────────────

# numpy → the math library for working with arrays and matrices
# We call it 'np' for short (standard convention in data science)
import numpy as np

# cosine_similarity → the function that measures similarity between vectors
# This is the core of our recommendation system
from sklearn.metrics.pairwise import cosine_similarity

# Our own tools from skill_vectorizer.py
# SkillVectorizer → converts text to numbers
# build_document  → combines skills + description + domain into one text
# normalize_skills → converts "ReactJS" → "react" etc.
from .skill_vectorizer import SkillVectorizer, build_document, normalize_skills


# ─────────────────────────────────────────────────────────────
# UNDERSTANDING COSINE SIMILARITY (THE CORE CONCEPT)
# ─────────────────────────────────────────────────────────────
#
#  WHAT IS A VECTOR?
#    A vector is just a list of numbers.
#    When we convert "python flask" to numbers, we get a vector like:
#    [0.8, 0.0, 0.6, 0.0, 0.3, ...]
#    Each number represents the importance of one word.
#
#  WHAT IS COSINE SIMILARITY?
#    It measures the ANGLE between two vectors.
#    Think of vectors as arrows pointing in space.
#
#    If two arrows point in the SAME direction → angle = 0° → similarity = 1.0 (perfect match)
#    If two arrows point in DIFFERENT directions → angle = 90° → similarity = 0.0 (no match)
#
#    SIMPLE ANALOGY:
#    Imagine two people facing directions on a compass.
#    If both face NORTH → they're going the same way → very similar
#    If one faces NORTH and other faces EAST → very different
#
#  SCORE MEANING:
#    1.0 = perfect match (identical skills)
#    0.7 = very good match
#    0.4 = partial match
#    0.1 = poor match
#    0.0 = nothing in common
#
# ─────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────
# CLASS: ProjectRecommender
# PURPOSE: The main recommendation engine
#
# WHAT IS A CLASS?
#   A class is like a machine/robot blueprint.
#   You build the machine once (ProjectRecommender())
#   Then you can use it many times (recommender.recommend_projects(...))
#   The machine REMEMBERS things between uses (self.projects, self.project_vectors)
# ─────────────────────────────────────────────────────────────

class ProjectRecommender:

    def __init__(self):
        """
        Called automatically when you create: recommender = ProjectRecommender()
        Sets up the empty recommendation engine.

        Think of this like turning on a new machine.
        It's ready, but hasn't learned anything yet.
        You need to call fit() to teach it about your projects.

        self.vectorizer      → the TF-IDF converter (text → numbers)
        self.project_vectors → the NUMBER GRID of all projects (set after fit())
        self.projects        → the raw project data from MongoDB (set after fit())
        """

        # Create a new vectorizer (text → numbers converter)
        self.vectorizer = SkillVectorizer()

        # These start as None/empty because we haven't trained yet
        # They get filled when fit() is called
        self.project_vectors = None   # will become a matrix of numbers
        self.projects = []            # will become a list of project dicts


    # ─────────────────────────────────────────────────────────
    # METHOD: fit
    # PURPOSE: Train the ML engine on all projects from MongoDB
    #          This is like "teaching" the system about all available projects
    # ─────────────────────────────────────────────────────────

    def fit(self, projects: list):
        """
        Train the recommendation engine on a list of projects.

        WHEN IS THIS CALLED?
            1. When the Flask server starts (loads all projects from MongoDB)
            2. When POST /api/recommendations/refresh is called
               (after new projects are added)

        WHAT HAPPENS INSIDE:
            Step 1: Save the raw project data
            Step 2: Convert each project into a "document" (text string)
            Step 3: Convert all documents into NUMBER VECTORS using TF-IDF
            Step 4: Save the trained vectorizer to disk

        PARAMETERS:
            projects: list of project dicts from MongoDB
                e.g. [
                    {"title": "AI App", "required_skills": ["python", "ml"], ...},
                    {"title": "Web App", "required_skills": ["react", "css"], ...},
                ]

        ANALOGY:
            Like a teacher reading all textbooks before teaching.
            After fit(), the system "knows" all projects.
        """

        # Save the raw project data so we can return it later with scores
        self.projects = projects

        # SAFETY CHECK: If no projects exist, don't try to train
        # TF-IDF can't work with empty data → would crash
        if not projects:
            print("[ML] No projects to fit. Skipping training.")
            return

        # ── STEP 1: Convert each project into a text document ──
        #
        # For each project in the list, we create ONE text string
        # combining its required_skills + description + domain
        #
        # p.get('required_skills', []) means:
        #   try to get 'required_skills' from the project dict
        #   if it doesn't exist, use empty list [] as default
        #   (defensive coding — never crash if data is missing)
        #
        # EXAMPLE OUTPUT for one project:
        # "python flask python flask python flask build rest api web"
        #    ↑ skills repeated 3x           ↑ description  ↑ domain

        docs = [
            build_document(
                p.get('required_skills', []),   # project's required skills
                p.get('description', ''),        # project's description text
                p.get('domain', '')              # project's domain (web, ai, etc.)
            )
            for p in projects  # do this for EVERY project
        ]

        # ── STEP 2: Convert all text documents to NUMBER VECTORS ──
        #
        # fit_transform does TWO things:
        #   1. LEARNS the vocabulary from all documents (what words exist?)
        #   2. CONVERTS all documents to number vectors
        #
        # Result is a MATRIX (grid of numbers):
        #   Rows = projects (one row per project)
        #   Columns = words/features (one column per word)
        #
        # Example with 4 projects and 5000 features:
        #   Shape: (4, 5000)
        #   project_vectors[0] = numbers for project 0
        #   project_vectors[1] = numbers for project 1
        #   etc.

        self.project_vectors = self.vectorizer.fit_transform(docs)

        # ── STEP 3: Save the trained vectorizer to disk ──
        # So we don't have to retrain if server restarts
        self.vectorizer.save()

        print(f"[ML] Fitted on {len(projects)} projects. "
              f"Matrix shape: {self.project_vectors.shape}")


    # ─────────────────────────────────────────────────────────
    # METHOD: recommend_projects
    # PURPOSE: Given a USER, find the best matching PROJECTS
    # ─────────────────────────────────────────────────────────

    def recommend_projects(self, user: dict, top_n: int = 10) -> list:
        """
        Find the top N projects that best match the given user's skills.

        HOW IT WORKS (step by step):
            1. Convert the user's skills/interests into a number vector
            2. Compare that vector to EVERY project's vector
               using cosine similarity
            3. Calculate a bonus score for exact skill matches
            4. Combine: 60% cosine similarity + 40% exact overlap
            5. Sort by final score, return top N

        PARAMETERS:
            user:  dict with user's data from MongoDB
                   e.g. {
                       "skills": ["python", "flask"],
                       "interests": ["backend", "api"],
                       "preferred_domains": ["web"]
                   }
            top_n: how many recommendations to return (default: 10)

        RETURNS:
            list of project dicts, each with an added 'match_score' field
            e.g. [{"title": "Flask API", "match_score": 87.4, ...}, ...]
        """

        # ── SAFETY CHECK ──
        # If fit() was never called, we have no project vectors → return empty
        if self.project_vectors is None or not self.projects:
            print("[ML] Recommender not fitted yet. Call fit() first.")
            return []


        # ── STEP 1: Build the user's document ──
        #
        # Same as we did for projects, we convert the USER into one text string
        # combining their skills + interests + preferred domains
        #
        # ' '.join(user.get('interests', [])) converts list to string:
        #   ["backend", "api"] → "backend api"

        user_doc = build_document(
            user.get('skills', []),                          # user's skills
            description=' '.join(user.get('interests', [])), # user's interests as text
            domain=' '.join(user.get('preferred_domains', [])) # preferred domains
        )


        # ── STEP 2: Convert user document to a number vector ──
        #
        # We use transform() NOT fit_transform()!
        # Why? Because the vocabulary was already LEARNED from projects.
        # We just want to convert the user doc using that SAME vocabulary.
        # If we used fit_transform(), it would create a NEW vocabulary
        # just from the user, and the numbers wouldn't be comparable to projects.
        #
        # [user_doc] → we pass a list with one item (transform expects a list)

        user_vec = self.vectorizer.transform([user_doc])


        # ── STEP 3: Calculate Cosine Similarity ──
        #
        # Compare user_vec to ALL project vectors at once
        #
        # cosine_similarity(A, B) returns a matrix of similarity scores
        # Since user_vec is 1 row, result shape is (1, num_projects)
        # .flatten() converts it from 2D [[0.8, 0.2, ...]] to 1D [0.8, 0.2, ...]
        #
        # EXAMPLE:
        # scores = [0.87, 0.12, 0.65, 0.03, 0.74]
        #           ↑ project 0  ↑ p1  ↑ p2  ↑ p3  ↑ p4
        # Project 0 has 0.87 similarity → very good match!
        # Project 3 has 0.03 similarity → very poor match

        scores = cosine_similarity(user_vec, self.project_vectors).flatten()


        # ── STEP 4: Calculate Exact Skill Overlap Bonus ──
        #
        # TF-IDF is good but not perfect.
        # We add an extra bonus when a user has EXACTLY the required skills.
        #
        # WHY? Example:
        #   Project needs: python, flask, mongodb
        #   User has: python, flask, mongodb  → 3/3 overlap = 1.0 (100% bonus)
        #   User has: python                  → 1/3 overlap = 0.33 (33% bonus)
        #
        # This catches cases where TF-IDF similarity might miss exact matches

        user_skills = set(normalize_skills(user.get('skills', [])))
        # user_skills = {"python", "flask"}  (a set for fast comparison)

        bonuses = []  # will store one bonus score per project

        for p in self.projects:
            # Get this project's required skills as a set
            proj_skills = set(normalize_skills(p.get('required_skills', [])))
            # proj_skills = {"python", "flask", "mongodb"}

            # Count how many user skills match project skills
            # & is set intersection: elements that appear in BOTH sets
            # {"python", "flask"} & {"python", "flask", "mongodb"} = {"python", "flask"}
            overlap = len(user_skills & proj_skills)  # = 2

            # Divide by total required skills to get a ratio (0 to 1)
            # If project has 0 skills, use 1 to avoid division by zero
            total = len(proj_skills) if proj_skills else 1
            bonuses.append(overlap / total)  # = 2/3 = 0.667

        # Convert bonuses list to numpy array for math operations
        bonuses = np.array(bonuses)
        # bonuses = [0.667, 0.0, 0.5, 0.333, ...]


        # ── STEP 5: Calculate Final Weighted Score ──
        #
        # FORMULA: final = (cosine_score × 0.6) + (overlap_bonus × 0.4)
        #
        # WHY 60/40 split?
        #   60% TF-IDF → captures semantic/meaning similarity
        #   40% overlap → captures exact skill matches
        #   Together they're more accurate than either alone
        #
        # EXAMPLE for one project:
        #   cosine_score = 0.75
        #   overlap_bonus = 0.67
        #   final = (0.75 × 0.6) + (0.67 × 0.4)
        #         = 0.45 + 0.268
        #         = 0.718  → 71.8% match

        final_scores = (scores * 0.6) + (bonuses * 0.4)


        # ── STEP 6: Sort and get top N indices ──
        #
        # np.argsort returns INDICES that would sort the array
        # Example: scores = [0.3, 0.8, 0.5]
        #          np.argsort = [0, 2, 1]  (index 0 is smallest, index 1 is largest)
        #
        # [::-1] reverses it → [1, 2, 0] (largest first)
        # [:top_n] takes only the first top_n items

        top_indices = np.argsort(final_scores)[::-1][:top_n]
        # top_indices = [1, 2, 0]  meaning: project 1 is best, then 2, then 0


        # ── STEP 7: Build the results list ──
        #
        # Go through the top indices and create the output list

        results = []

        for i in top_indices:

            # THRESHOLD: Only include projects with score > 5%
            # If score is 0.03 (3%), the match is too poor to show
            if final_scores[i] > 0.05:

                # Make a COPY of the project dict so we don't modify the original
                project = dict(self.projects[i])

                # MongoDB's _id is a special ObjectId type
                # JSON can't serialize ObjectId, so convert to string
                project['_id'] = str(project.get('_id', ''))

                # Add the match_score as a percentage
                # float() → ensures it's a decimal number
                # round(..., 1) → round to 1 decimal place
                # × 100 → convert from 0-1 scale to 0-100 percentage
                # Example: 0.718 → 71.8
                project['match_score'] = round(float(final_scores[i]) * 100, 1)

                results.append(project)

        print(f"[ML] recommend_projects: returning {len(results)} results for user")
        return results


    # ─────────────────────────────────────────────────────────
    # METHOD: recommend_collaborators
    # PURPOSE: Given a PROJECT, find the best matching USERS
    # ─────────────────────────────────────────────────────────

    def recommend_collaborators(self, project: dict, all_users: list, top_n: int = 5) -> list:
        """
        Find the top N users that best match the given project's requirements.

        THIS IS THE REVERSE of recommend_projects:
            recommend_projects:      USER → find matching PROJECTS
            recommend_collaborators: PROJECT → find matching USERS

        HOW IT WORKS:
            1. Build a document for the project
            2. Build a document for EACH user
            3. Fit TF-IDF on ALL documents (project + users) together
               (so the vocabulary includes both sides)
            4. Compare project vector to each user vector
            5. Return top N users with match scores

        WHY DO WE FIT ON ALL DOCUMENTS TOGETHER?
            Because the vocabulary needs to include both project skills
            and user skills. If we only fit on users, we might miss
            project-specific terms, and vice versa.

        PARAMETERS:
            project:   dict of project data from MongoDB
            all_users: list of all user dicts from MongoDB
            top_n:     how many collaborators to return (default: 5)

        RETURNS:
            list of user dicts with 'match_score' field added
            passwords are removed for security!
        """

        # Safety check: if no users, nothing to recommend
        if not all_users:
            return []


        # ── STEP 1: Build the project's document ──
        #
        # Convert project info into one text string

        proj_doc = build_document(
            project.get('required_skills', []),
            project.get('description', ''),
            project.get('domain', '')
        )


        # ── STEP 2: Build documents for ALL users ──
        #
        # For each user, combine their skills + bio into one text

        user_docs = [
            build_document(
                u.get('skills', []),  # user's skills
                u.get('bio', '')       # user's bio/description
            )
            for u in all_users
        ]


        # ── STEP 3: Fit TF-IDF on ALL documents together ──
        #
        # We put the PROJECT document FIRST, then all USER documents
        # This creates one shared vocabulary from both project and users
        #
        # [proj_doc] + user_docs =
        #   ["python flask web", "python django", "react javascript", ...]
        #    ↑ project doc        ↑ user 1 doc     ↑ user 2 doc

        all_docs = [proj_doc] + user_docs
        self.vectorizer.fit_transform(all_docs)  # train on everything together


        # ── STEP 4: Get the project vector ──
        #
        # Now convert the project doc using the trained vocabulary
        # We use transform() because vocabulary is already learned above

        proj_vec = self.vectorizer.transform([proj_doc])


        # ── STEP 5: Get vectors for all users ──
        #
        # Convert each user's document to a number vector

        user_vecs = self.vectorizer.transform(user_docs)


        # ── STEP 6: Calculate similarity between project and each user ──
        #
        # proj_vec shape: (1, 5000) → one project
        # user_vecs shape: (num_users, 5000) → all users
        #
        # cosine_similarity compares the project to EVERY user at once
        # Result shape: (1, num_users) → .flatten() → (num_users,)
        #
        # scores = [0.85, 0.23, 0.67, ...]
        #           ↑ user 0    ↑ u1   ↑ u2

        scores = cosine_similarity(proj_vec, user_vecs).flatten()


        # ── STEP 7: Get top N user indices (sorted by score) ──
        #
        # Same sorting logic as recommend_projects
        # argsort → sort ascending → [::-1] reverse → descending
        # [:top_n] → take only top N

        top_indices = np.argsort(scores)[::-1][:top_n]


        # ── STEP 8: Build results list ──

        results = []

        for i in top_indices:
            # Make a copy of the user dict
            user = dict(all_users[i])

            # Convert MongoDB ObjectId to string (for JSON serialization)
            user['_id'] = str(user.get('_id', ''))

            # ⚠️ SECURITY: ALWAYS remove password before sending to frontend!
            # .pop('password', None) removes 'password' key if it exists
            # 'None' means: don't crash if 'password' key doesn't exist
            user.pop('password', None)

            # Add match score as percentage
            user['match_score'] = round(float(scores[i]) * 100, 1)

            results.append(user)

        print(f"[ML] recommend_collaborators: returning {len(results)} collaborators")
        return results


# ─────────────────────────────────────────────────────────────
# GLOBAL SINGLETON
#
# WHAT IS A SINGLETON?
#   A singleton means we create ONLY ONE instance of ProjectRecommender
#   and share it across the entire Flask app.
#
# WHY?
#   If we created a new recommender for every API request:
#     - It would re-train TF-IDF every single time → VERY SLOW
#     - Each instance would have its own separate memory
#
#   By creating ONE global instance:
#     - It trains ONCE when the server starts
#     - All API requests share the SAME trained model → FAST
#     - It stays in memory and is ready instantly for each request
#
# HOW IT WORKS:
#   1. Server starts → recommender = ProjectRecommender() (empty)
#   2. First API request hits → _ensure_index_built() in routes calls recommender.fit()
#   3. Now the model is trained and ready
#   4. All future requests use this same trained recommender
#
# This line is at module level, so it runs once when Python imports this file
# ─────────────────────────────────────────────────────────────

recommender = ProjectRecommender()  # ← ONE global instance shared by all requests

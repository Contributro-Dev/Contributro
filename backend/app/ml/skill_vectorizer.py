# =============================================================
#  FILE: app/ml/skill_vectorizer.py
#  WHAT THIS FILE DOES:
#    This file is like a "text cleaner + converter".
#    It does 2 main jobs:
#      JOB 1: Clean and normalize skills
#             (e.g. "ReactJS" and "react.js" both become "react")
#      JOB 2: Convert text (skills, descriptions) into NUMBERS
#             because computers can only compare numbers, not words
# =============================================================


# ─────────────────────────────────────────────────────────────
# IMPORTS — tools we borrow from other libraries
# ─────────────────────────────────────────────────────────────

# TfidfVectorizer → the main tool that converts text to numbers
# ENGLISH_STOP_WORDS → common useless words like "the", "is", "and"
#   we remove these because they don't help with skill matching
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS

# pickle → used to SAVE and LOAD the trained vectorizer to a file
#   Why? So we don't have to retrain it every time the server restarts
import pickle

# os → used to check if a file exists on the computer
import os

# re → used for regex (pattern matching in text)
#   e.g. remove all special characters like @, #, ! from text
import re


# ─────────────────────────────────────────────────────────────
# SKILL ALIASES — the "translation dictionary"
# ─────────────────────────────────────────────────────────────

# PROBLEM: People write the same skill in different ways
#   Person A writes "reactjs"
#   Person B writes "react.js"  
#   Person C writes "React"
#   These are ALL the same skill! But the computer thinks they're different words.
#
# SOLUTION: We create a dictionary that translates all versions to ONE standard version
#
# HOW TO READ THIS:
#   "reactjs" : "react"  means → if someone writes "reactjs", convert it to "react"

SKILL_ALIASES = {
    # JavaScript framework aliases
    "reactjs"  : "react",
    "react.js" : "react",

    # Node.js aliases
    "nodejs"   : "node.js",
    "node"     : "node.js",

    # Machine Learning / AI aliases
    "ml"       : "machine learning",
    "ai"       : "artificial intelligence",

    # Language aliases
    "py"       : "python",
    "js"       : "javascript",
    "ts"       : "typescript",
}


# ─────────────────────────────────────────────────────────────
# FUNCTION 1: normalize_skill
# PURPOSE: Convert ONE skill to its standard form
# ─────────────────────────────────────────────────────────────

def normalize_skill(skill: str) -> str:
    """
    Takes one skill string and returns its standard version.

    EXAMPLE:
        normalize_skill("ReactJS")  →  "react"
        normalize_skill("ML")       →  "machine learning"
        normalize_skill("django")   →  "django"  (no alias, stays same)

    HOW IT WORKS STEP BY STEP:
        Step 1: Remove extra spaces and make lowercase
                "  ReactJS  " → "reactjs"
        Step 2: Look it up in our SKILL_ALIASES dictionary
                "reactjs" → found! → return "react"
                "django"  → not found → return "django" (unchanged)
    """

    # Step 1: .strip() removes spaces from start/end, .lower() makes lowercase
    # Example: "  ReactJS  " → "reactjs"
    s = skill.strip().lower()

    # Step 2: Look it up in dictionary
    # .get(s, s) means: look for 's' in dictionary,
    #   if found → return the translation
    #   if NOT found → return 's' itself (keep original)
    return SKILL_ALIASES.get(s, s)


# ─────────────────────────────────────────────────────────────
# FUNCTION 2: normalize_skills
# PURPOSE: Normalize a WHOLE LIST of skills at once
# ─────────────────────────────────────────────────────────────

def normalize_skills(skills: list) -> list:
    """
    Takes a list of skills and normalizes all of them.
    Also removes duplicates and empty strings.

    EXAMPLE:
        Input:  ["ReactJS", "react", "ML", "", "Python"]
        Output: ["react", "machine learning", "python"]
        
        Notice: "ReactJS" and "react" both became "react",
                so the duplicate was removed automatically!
    
    HOW IT WORKS:
        - 'for s in skills' → go through each skill in the list
        - 'if s' → skip empty strings (empty string is "falsy" in Python)
        - normalize_skill(s) → convert each skill to standard form
        - set(...) → remove duplicates (sets can't have duplicates)
        - list(...) → convert back to a list
    """

    return list(set(normalize_skill(s) for s in skills if s))


# ─────────────────────────────────────────────────────────────
# FUNCTION 3: clean_text
# PURPOSE: Clean messy text (remove symbols, stop words, etc.)
# ─────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """
    Cleans a text string by:
        1. Making it lowercase
        2. Removing special characters (!, @, #, etc.)
        3. Removing useless common words (the, is, and, etc.)
        4. Removing very short words (1-2 letters, usually meaningless)

    EXAMPLE:
        Input:  "Build a REST API for the web application!"
        Output: "build rest api web application"

        Removed: "a", "for", "the" (stop words)
        Removed: "!" (special character)
    """

    # If text is empty or None, return empty string
    # Without this check, the code below would crash on None
    if not text:
        return ''

    # Step 1: Make everything lowercase
    # "Python Flask" → "python flask"
    text = text.lower()

    # Step 2: Remove everything that's NOT a letter, number, or space
    # re.sub replaces pattern matches with a space
    # '[^a-z0-9\s]' means: anything that is NOT (a-z, 0-9, or whitespace)
    # Example: "hello-world!" → "hello world "
    text = re.sub(r'[^a-z0-9\s]', ' ', text)

    # Step 3: Split into individual words and filter
    # .split() → "hello world" → ["hello", "world"]
    # then keep a word only if:
    #   - it's NOT in ENGLISH_STOP_WORDS (not "the", "is", "and", etc.)
    #   - it's longer than 2 characters (skip "a", "is", "to", etc.)
    tokens = [
        t for t in text.split()
        if t not in ENGLISH_STOP_WORDS and len(t) > 2
    ]

    # Step 4: Join the words back into one string
    # ["python", "flask", "api"] → "python flask api"
    return ' '.join(tokens)


# ─────────────────────────────────────────────────────────────
# FUNCTION 4: build_document
# PURPOSE: Combine skills + description + domain into ONE text
#          This combined text is what we feed to the ML model
# ─────────────────────────────────────────────────────────────

def build_document(skills: list, description: str = '', domain: str = '') -> str:
    """
    Combines all information about a user or project into one text string.
    This is called a "document" in ML terms.

    WHY DO WE COMBINE EVERYTHING?
        The ML model needs ONE piece of text to work with.
        So we combine skills + description + domain into one string.

    WHY DO WE REPEAT SKILLS 3 TIMES?
        Skills are the MOST IMPORTANT thing for matching.
        If we only include them once, the model treats them the same
        as any other word. By repeating 3 times, we tell the model
        "these words (skills) are more important than description words".

    EXAMPLE:
        skills = ["python", "flask"]
        description = "Build a REST API"
        domain = "web"

        skill_text = "python flask python flask python flask"  (repeated 3x)
        
        Final document = "python flask python flask python flask build rest api web"

    This way, "python" and "flask" have 3x more weight than "build", "rest", "api"
    """

    # Step 1: Normalize all skills first
    # ["ReactJS", "ML"] → ["react", "machine learning"]
    normalized = normalize_skills(skills)

    # Step 2: Join skills into one string and REPEAT 3 TIMES
    # ["python", "flask"] → "python flask"
    # "python flask" * 3 → "python flask python flask python flask"
    # The space join ensures words don't concatenate together
    skill_text = ' '.join(normalized) * 3

    # Step 3: Clean the description text
    # "Build a REST API!" → "build rest api"
    cleaned_desc = clean_text(description)

    # Step 4: Combine everything into one string
    # f-string format: f'{variable} more text {variable}'
    # .strip() removes any extra spaces at start/end of final string
    return f'{skill_text} {cleaned_desc} {domain.lower()}'.strip()


# ─────────────────────────────────────────────────────────────
# CLASS: SkillVectorizer
# PURPOSE: The main tool that converts text documents into NUMBERS
#
# WHAT IS A CLASS?
#   A class is like a blueprint. You create an "object" from it
#   and that object remembers its own data.
#   Think of it like a form that stores filled-in values.
#
# WHAT IS TF-IDF?
#   TF = Term Frequency → how often a word appears in THIS document
#   IDF = Inverse Document Frequency → how RARE the word is across ALL documents
#
#   SIMPLE EXPLANATION:
#   If "python" appears a lot in a document → high TF score
#   If "python" is rare across all documents → high IDF score
#   Common words like "the" → very low IDF (they appear everywhere)
#   So TF-IDF gives HIGH scores to words that are:
#     - frequent in THIS document, BUT
#     - rare across ALL documents
#   This means specific skills like "kubernetes" score higher than generic words
# ─────────────────────────────────────────────────────────────

class SkillVectorizer:

    def __init__(self):
        """
        Called automatically when you do: vec = SkillVectorizer()
        Sets up the TF-IDF vectorizer with our chosen settings.

        SETTINGS EXPLAINED:
            ngram_range=(1, 2):
                Instead of just single words, also consider PAIRS of words
                Example: "machine learning" is more meaningful than "machine" alone
                ngram_range=(1,2) means: use single words AND two-word pairs
                
            max_features=5000:
                Only keep the 5000 most important words/pairs
                Ignores very rare words that appear only once
                This saves memory and speeds up computation
                
            sublinear_tf=True:
                Instead of raw word count, use logarithm
                So if "python" appears 10 times, don't use 10, use log(10)=2.3
                This prevents one very common word from dominating everything
        """

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),      # use single words AND word pairs
            max_features=5000,        # keep only top 5000 features
            sublinear_tf=True         # use log scaling for word frequency
        )

        # This flag tracks whether the vectorizer has been trained yet
        # False at start → becomes True after fit_transform() is called
        self.fitted = False


    def fit_transform(self, documents: list):
        """
        TRAIN the vectorizer on a list of documents AND convert them to numbers.

        This is called "fitting" — the vectorizer LEARNS from the documents:
            - What words exist?
            - How rare/common is each word?
            - What's the vocabulary?

        After fitting, it converts all documents to number vectors (matrix).

        ANALOGY:
            Imagine you're a teacher grading essays.
            First you READ all essays to understand the vocabulary (fit).
            Then you SCORE each essay based on that vocabulary (transform).
            fit_transform does BOTH at once.

        WHAT IS A MATRIX?
            If you have 4 projects and 5000 features (words):
            The result is a 4×5000 grid of numbers.
            Each ROW = one project
            Each COLUMN = one word/feature
            Each NUMBER = how important that word is for that project

            Project 1: [0.8, 0.0, 0.6, 0.0, ...]  ← python is important here
            Project 2: [0.0, 0.9, 0.0, 0.7, ...]  ← react is important here

        PARAMETERS:
            documents: list of text strings
                e.g. ["python flask web", "react javascript frontend", ...]

        RETURNS:
            A sparse matrix of shape (num_documents × num_features)
        """

        # Train on documents AND convert to numbers in one step
        matrix = self.vectorizer.fit_transform(documents)

        # Mark as trained so transform() can be used later
        self.fitted = True

        return matrix


    def transform(self, documents: list):
        """
        Convert NEW documents to numbers using the ALREADY TRAINED vocabulary.

        WHY IS THIS DIFFERENT FROM fit_transform?
            fit_transform: LEARNS vocabulary from documents, then converts
            transform: Uses EXISTING vocabulary to convert (no new learning)

        WHEN DO WE USE THIS?
            When a USER logs in and wants recommendations:
                1. Projects were already fit_transformed (vectorizer is trained)
                2. We just need to convert the USER's skills to numbers
                3. So we use transform() — not fit_transform()
                   (we don't want to re-learn vocabulary from just one user)

        EXAMPLE:
            # Training phase (done once at server start)
            project_vectors = vec.fit_transform(all_project_docs)

            # Per-user request (done every time a user requests recommendations)
            user_vector = vec.transform([user_doc])   ← uses learned vocabulary

        RAISES ValueError if vectorizer hasn't been trained yet.
        """

        # Safety check: can't transform if we haven't fitted yet
        if not self.fitted:
            raise ValueError(
                "Vectorizer not fitted yet. "
                "Call fit_transform() first before calling transform()."
            )

        return self.vectorizer.transform(documents)


    def save(self, path: str = 'ml/vectorizer.pkl'):
        """
        Save the trained vectorizer to a file on disk.

        WHY SAVE IT?
            Training takes time. If we train every time the server restarts,
            it would be slow. So we save the trained vectorizer to a file.
            Next time the server starts, we just LOAD the file — much faster!

        WHAT IS .pkl?
            pkl = pickle file = Python's way of saving any object to a file
            Like taking a photo of the vectorizer's brain and saving it

        PARAMETERS:
            path: where to save the file (default: 'ml/vectorizer.pkl')
        """

        # Create the folder if it doesn't exist yet
        # exist_ok=True → don't crash if folder already exists
        os.makedirs(os.path.dirname(path), exist_ok=True)

        # Open file in write-binary mode ('wb') and save the vectorizer
        # pickle.dump → serializes the object and writes to file
        with open(path, 'wb') as f:
            pickle.dump(self.vectorizer, f)

        # Mark as fitted (it already was, but just to be safe)
        self.fitted = True

        print(f"[ML] Vectorizer saved to {path}")


    def load(self, path: str = 'ml/vectorizer.pkl'):
        """
        Load a previously saved vectorizer from a file.

        WHY LOAD?
            Instead of retraining on server restart, just load the saved file.
            The loaded vectorizer already knows all the vocabulary.

        RETURNS:
            True  → if file was found and loaded successfully
            False → if file doesn't exist (need to train first)
        """

        # Check if the file actually exists before trying to open it
        if os.path.exists(path):

            # Open file in read-binary mode ('rb') and load
            # pickle.load → reads file and reconstructs the object
            with open(path, 'rb') as f:
                self.vectorizer = pickle.load(f)

            self.fitted = True
            print(f"[ML] Vectorizer loaded from {path}")
            return True  # ← success

        # File doesn't exist — need to train first
        print(f"[ML] No saved vectorizer found at {path}. Will train from scratch.")
        return False  # ← file not found

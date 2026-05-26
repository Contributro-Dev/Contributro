from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
import pickle
import os
import re

SKILL_ALIASES = {
    "reactjs":    "react",
    "react.js":   "react",
    "nodejs":     "node.js",
    "node":       "node.js",
    "ml":         "machine learning",
    "ai":         "artificial intelligence",
    "py":         "python",
    "js":         "javascript",
    "ts":         "typescript",
    "dl":         "deep learning",
    "nlp":        "natural language processing",
    "cv":         "computer vision",
    "k8s":        "kubernetes",
    "postgres":   "postgresql",
    "mongo":      "mongodb",
}


def normalize_skill(skill: str) -> str:
    s = skill.strip().lower()
    return SKILL_ALIASES.get(s, s)


def normalize_skills(skills: list) -> list:
    return list(set(normalize_skill(s) for s in skills if s))


def clean_text(text: str) -> str:
    if not text:
        return ''
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    tokens = [
        t for t in text.split()
        if t not in ENGLISH_STOP_WORDS and len(t) > 2
    ]
    return ' '.join(tokens)


def build_document(skills: list, description: str = '', domain: str = '') -> str:
    """
    Combine skills + description + domain into one weighted text document.

    BUG FIXED:
        OLD (broken): ' '.join(normalized) * 3
            → 'python flaskpython flaskpython flask'  ← words concatenate!

        NEW (correct): (' '.join(normalized) + ' ') * 3
            → 'python flask python flask python flask '  ← proper spaces
    """
    normalized = normalize_skills(skills)

    # ✅ FIXED: add a trailing space BEFORE multiplying so words stay separated
    skill_text = (' '.join(normalized) + ' ') * 3

    cleaned_desc = clean_text(description)

    return f'{skill_text} {cleaned_desc} {domain.lower()}'.strip()


class SkillVectorizer:

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True
        )
        self.fitted = False

    def fit_transform(self, documents: list):
        matrix = self.vectorizer.fit_transform(documents)
        self.fitted = True
        return matrix

    def transform(self, documents: list):
        if not self.fitted:
            raise ValueError(
                "Vectorizer not fitted yet. Call fit_transform() first."
            )
        return self.vectorizer.transform(documents)

    def save(self, path: str = None):
        # ✅ FIXED: use absolute path relative to this file so it works
        # regardless of where Flask is run from
        if path is None:
            base = os.path.dirname(os.path.abspath(__file__))
            path = os.path.join(base, '..', '..', 'ml', 'vectorizer.pkl')
            path = os.path.normpath(path)

        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as f:
            pickle.dump(self.vectorizer, f)
        self.fitted = True
        print(f"[ML] Vectorizer saved to {path}")

    def load(self, path: str = None):
        if path is None:
            base = os.path.dirname(os.path.abspath(__file__))
            path = os.path.join(base, '..', '..', 'ml', 'vectorizer.pkl')
            path = os.path.normpath(path)

        if os.path.exists(path):
            with open(path, 'rb') as f:
                self.vectorizer = pickle.load(f)
            self.fitted = True
            print(f"[ML] Vectorizer loaded from {path}")
            return True

        print(f"[ML] No saved vectorizer at {path}. Will train from scratch.")
        return False

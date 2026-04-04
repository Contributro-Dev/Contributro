"""
=============================================================
  Contributro ML System - Complete Test Script
  Run from: backend/ folder (where run.py lives)
  Command:  python test_ml.py
=============================================================
"""

import sys
import traceback

PASS = "\u2705 PASS"
FAIL = "\u274c FAIL"
INFO = "\u2139\ufe0f  INFO"

results = []

def check(name, fn):
    try:
        fn()
        print(f"{PASS}  {name}")
        results.append((name, True))
    except Exception as e:
        print(f"{FAIL}  {name}")
        print(f"         Error: {e}")
        results.append((name, False))


# ─────────────────────────────────────────────
# SECTION 1: Imports
# ─────────────────────────────────────────────
print("\n" + "="*55)
print("  SECTION 1: Checking imports")
print("="*55)

def test_sklearn():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

def test_numpy():
    import numpy as np

def test_skill_vectorizer():
    from app.ml.skill_vectorizer import normalize_skill, normalize_skills, build_document, SkillVectorizer

def test_recommender():
    from app.ml.recommender import ProjectRecommender

check("sklearn is installed", test_sklearn)
check("numpy is installed", test_numpy)
check("skill_vectorizer.py can be imported", test_skill_vectorizer)
check("recommender.py can be imported", test_recommender)


# ─────────────────────────────────────────────
# SECTION 2: Skill Normalization
# ─────────────────────────────────────────────
print("\n" + "="*55)
print("  SECTION 2: Skill Normalization")
print("="*55)

from app.ml.skill_vectorizer import normalize_skill, normalize_skills, build_document, SkillVectorizer

def test_alias_reactjs():
    assert normalize_skill("reactjs") == "react", f"Got: {normalize_skill('reactjs')}"

def test_alias_ml():
    assert normalize_skill("ml") == "machine learning", f"Got: {normalize_skill('ml')}"

def test_alias_nodejs():
    assert normalize_skill("nodejs") == "node.js", f"Got: {normalize_skill('nodejs')}"

def test_alias_py():
    assert normalize_skill("py") == "python", f"Got: {normalize_skill('py')}"

def test_normalize_list():
    result = normalize_skills(["reactjs", "ml", "py", ""])
    assert "react" in result
    assert "machine learning" in result
    assert "python" in result
    assert "" not in result

check("normalize_skill: reactjs → react",             test_alias_reactjs)
check("normalize_skill: ml → machine learning",       test_alias_ml)
check("normalize_skill: nodejs → node.js",            test_alias_nodejs)
check("normalize_skill: py → python",                 test_alias_py)
check("normalize_skills: handles list + empty string",test_normalize_list)


# ─────────────────────────────────────────────
# SECTION 3: TF-IDF Vectorizer
# ─────────────────────────────────────────────
print("\n" + "="*55)
print("  SECTION 3: TF-IDF Vectorizer")
print("="*55)

def test_build_document():
    doc = build_document(["python", "flask"], "Build a REST API", "web")
    assert isinstance(doc, str) and len(doc) > 0
    assert "python" in doc

def test_fit_transform():
    import numpy as np
    vec = SkillVectorizer()
    docs = [
        build_document(["python", "flask"], "Backend API", "web"),
        build_document(["react", "css"], "Frontend UI", "web"),
        build_document(["machine learning", "python"], "ML Model", "ai"),
    ]
    matrix = vec.fit_transform(docs)
    assert matrix.shape[0] == 3, f"Expected 3 rows, got {matrix.shape[0]}"

def test_transform_after_fit():
    vec = SkillVectorizer()
    docs = [build_document(["python"], "test", "web")]
    vec.fit_transform(docs)
    result = vec.transform(docs)
    assert result.shape[0] == 1

def test_transform_without_fit():
    vec = SkillVectorizer()
    try:
        vec.transform(["python flask"])
        raise AssertionError("Should have raised ValueError")
    except ValueError as e:
        pass  # expected

check("build_document returns non-empty string",       test_build_document)
check("fit_transform returns correct shape (3 docs)",  test_fit_transform)
check("transform works after fit",                     test_transform_after_fit)
check("transform raises error if not fitted first",    test_transform_without_fit)


# ─────────────────────────────────────────────
# SECTION 4: Project Recommendations
# ─────────────────────────────────────────────
print("\n" + "="*55)
print("  SECTION 4: Project Recommendations")
print("="*55)

from app.ml.recommender import ProjectRecommender

FAKE_PROJECTS = [
    {"_id": "p1", "title": "Flask API",      "required_skills": ["python", "flask"],           "description": "Backend REST API",     "domain": "web"},
    {"_id": "p2", "title": "React Dashboard","required_skills": ["react", "javascript", "css"],"description": "Frontend dashboard",   "domain": "web"},
    {"_id": "p3", "title": "ML Pipeline",    "required_skills": ["python", "machine learning"],"description": "Data science pipeline","domain": "ai"},
    {"_id": "p4", "title": "Mobile App",     "required_skills": ["react", "typescript"],       "description": "Cross-platform app",   "domain": "mobile"},
]

PYTHON_USER = {
    "skills": ["python", "flask"],
    "interests": ["backend", "api"],
    "preferred_domains": ["web"]
}

REACT_USER = {
    "skills": ["react", "javascript", "css"],
    "interests": ["frontend", "ui"],
    "preferred_domains": ["web"]
}

def test_fit_runs():
    r = ProjectRecommender()
    r.fit(FAKE_PROJECTS)
    assert r.project_vectors is not None

def test_recommend_returns_list():
    r = ProjectRecommender()
    r.fit(FAKE_PROJECTS)
    results = r.recommend_projects(PYTHON_USER, top_n=3)
    assert isinstance(results, list)

def test_results_have_match_score():
    r = ProjectRecommender()
    r.fit(FAKE_PROJECTS)
    results = r.recommend_projects(PYTHON_USER, top_n=3)
    assert len(results) > 0, "Expected at least 1 result"
    assert "match_score" in results[0], "match_score field missing"

def test_python_user_prefers_flask_project():
    r = ProjectRecommender()
    r.fit(FAKE_PROJECTS)
    results = r.recommend_projects(PYTHON_USER, top_n=4)
    titles = [res["title"] for res in results]
    print(f"\n         Python user ranking: {titles}")
    assert results[0]["title"] == "Flask API", f"Expected Flask API first, got: {results[0]['title']}"

def test_react_user_prefers_react_project():
    r = ProjectRecommender()
    r.fit(FAKE_PROJECTS)
    results = r.recommend_projects(REACT_USER, top_n=4)
    titles = [res["title"] for res in results]
    print(f"\n         React user ranking: {titles}")
    assert results[0]["title"] == "React Dashboard", f"Expected React Dashboard first, got: {results[0]['title']}"

def test_score_is_percentage():
    r = ProjectRecommender()
    r.fit(FAKE_PROJECTS)
    results = r.recommend_projects(PYTHON_USER, top_n=2)
    for res in results:
        assert 0 <= res["match_score"] <= 100, f"Score out of range: {res['match_score']}"

def test_empty_projects():
    r = ProjectRecommender()
    r.fit([])
    results = r.recommend_projects(PYTHON_USER)
    assert results == [], f"Expected empty list, got: {results}"

check("recommender.fit() runs without error",             test_fit_runs)
check("recommend_projects returns a list",                test_recommend_returns_list)
check("results have match_score field",                   test_results_have_match_score)
check("python user gets Flask API as top result",         test_python_user_prefers_flask_project)
check("react user gets React Dashboard as top result",    test_react_user_prefers_react_project)
check("match_score is between 0 and 100",                 test_score_is_percentage)
check("empty project list returns empty results",         test_empty_projects)


# ─────────────────────────────────────────────
# SECTION 5: Collaborator Recommendations
# ─────────────────────────────────────────────
print("\n" + "="*55)
print("  SECTION 5: Collaborator Recommendations")
print("="*55)

FAKE_USERS = [
    {"_id": "u1", "name": "Alice", "skills": ["python", "flask"],             "bio": "Backend developer"},
    {"_id": "u2", "name": "Bob",   "skills": ["react", "javascript"],         "bio": "Frontend developer"},
    {"_id": "u3", "name": "Carol", "skills": ["python", "machine learning"],  "bio": "Data scientist"},
]

PYTHON_PROJECT = {
    "_id": "p1",
    "title": "ML Pipeline",
    "required_skills": ["python", "machine learning"],
    "description": "Build a data pipeline",
    "domain": "ai"
}

def test_collaborator_returns_list():
    r = ProjectRecommender()
    results = r.recommend_collaborators(PYTHON_PROJECT, FAKE_USERS, top_n=3)
    assert isinstance(results, list)

def test_collaborator_has_match_score():
    r = ProjectRecommender()
    results = r.recommend_collaborators(PYTHON_PROJECT, FAKE_USERS, top_n=3)
    assert len(results) > 0
    assert "match_score" in results[0]

def test_best_collaborator_for_ml_project():
    r = ProjectRecommender()
    results = r.recommend_collaborators(PYTHON_PROJECT, FAKE_USERS, top_n=3)
    names = [u["name"] for u in results]
    print(f"\n         Collaborator ranking for ML project: {names}")
    assert results[0]["name"] == "Carol", f"Expected Carol first (has python+ML), got: {results[0]['name']}"

def test_no_password_in_results():
    users_with_password = [
        {"_id": "u1", "name": "Alice", "skills": ["python"], "bio": "dev", "password": "secret123"},
    ]
    r = ProjectRecommender()
    results = r.recommend_collaborators(PYTHON_PROJECT, users_with_password, top_n=1)
    for u in results:
        assert "password" not in u, "Password was leaked in collaborator results!"

check("recommend_collaborators returns a list",              test_collaborator_returns_list)
check("collaborator results have match_score",               test_collaborator_has_match_score)
check("Carol (python+ML) is top collaborator for ML project",test_best_collaborator_for_ml_project)
check("password field is removed from collaborator results", test_no_password_in_results)


# ─────────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────────
print("\n" + "="*55)
print("  FINAL SUMMARY")
print("="*55)

passed = sum(1 for _, ok in results if ok)
failed = sum(1 for _, ok in results if not ok)
total  = len(results)

print(f"\n  Total : {total}")
print(f"  {PASS} : {passed}")
print(f"  {FAIL} : {failed}")

if failed > 0:
    print("\n  Failed tests:")
    for name, ok in results:
        if not ok:
            print(f"    - {name}")
    print("\n  Fix the above and re-run: python test_ml.py")
else:
    print("\n  All tests passed! Your ML system is working correctly.")
    print("  Next step: Start Flask and test the live API endpoints.")
    print("  Command: python run.py")

print("="*55 + "\n")

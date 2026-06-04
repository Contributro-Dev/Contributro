import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from .skill_vectorizer import SkillVectorizer, build_document, normalize_skills


class ProjectRecommender:

    def __init__(self):
        self.vectorizer = SkillVectorizer()
        self.project_vectors = None
        self.projects = []

    def fit(self, projects: list):
        self.projects = projects

        if not projects:
            print("[ML] No projects to fit. Skipping training.")
            return

        docs = [
            build_document(
                p.get('required_skills', []),
                p.get('description', ''),
                p.get('domain', '')
            )
            for p in projects
        ]

        self.project_vectors = self.vectorizer.fit_transform(docs)
        self.vectorizer.save()

        print(f"[ML] Fitted on {len(projects)} projects. "
              f"Matrix shape: {self.project_vectors.shape}")

    def recommend_projects(self, user: dict, top_n: int = 10) -> list:  #Recommend projects to users

        if self.project_vectors is None or not self.projects:
            print("[ML] Recommender not fitted yet. Call fit() first.")
            return []

        user_doc = build_document(
            user.get('skills', []),
            description=' '.join(user.get('interests', [])),
            domain=' '.join(user.get('preferred_domains', []))
        )

        user_vec = self.vectorizer.transform([user_doc])
        scores = cosine_similarity(user_vec, self.project_vectors).flatten()

        user_skills = set(normalize_skills(user.get('skills', [])))

        bonuses = []
        for p in self.projects:
            proj_skills = set(normalize_skills(p.get('required_skills', [])))
            overlap = len(user_skills & proj_skills)
            total = len(proj_skills) if proj_skills else 1
            bonuses.append(overlap / total)

        bonuses = np.array(bonuses)
        final_scores = (scores * 0.6) + (bonuses * 0.4)

        top_indices = np.argsort(final_scores)[::-1][:top_n]

        results = []
        for i in top_indices:
            if final_scores[i] > 0.05:
                project = dict(self.projects[i])
                project['_id'] = str(project.get('_id', ''))
                project['match_score'] = round(float(final_scores[i]) * 100, 1)
                results.append(project)

        print(f"[ML] recommend_projects: returning {len(results)} results")
        return results

    def recommend_collaborators(self, project: dict, all_users: list, top_n: int = 5) -> list:  #Recommend users for projects
        """
        BUG FIXED:
            OLD (broken): self.vectorizer.fit_transform(all_docs)
                → This re-trains the SHARED vectorizer, destroying the
                  project index built by fit(). Every call to this method
                  corrupted the project recommendations.

            NEW (correct): Use a SEPARATE local SkillVectorizer() that only
                lives inside this method. The shared self.vectorizer is
                never touched.
        """

        if not all_users:
            return []

        proj_doc = build_document(
            project.get('required_skills', []),
            project.get('description', ''),
            project.get('domain', '')
        )

        user_docs = [
            build_document(
                u.get('skills', []),
                u.get('bio', '')
            )
            for u in all_users
        ]

        # ✅ FIXED: create a fresh local vectorizer — never reuse self.vectorizer
        local_vectorizer = SkillVectorizer()
        all_docs = [proj_doc] + user_docs
        all_vectors = local_vectorizer.fit_transform(all_docs)

        # First row is the project, remaining rows are users
        proj_vec = all_vectors[0]
        user_vecs = all_vectors[1:]

        scores = cosine_similarity(proj_vec, user_vecs).flatten()

        top_indices = np.argsort(scores)[::-1][:top_n]

        results = []
        for i in top_indices:
            user = dict(all_users[i])
            user['_id'] = str(user.get('_id', ''))
            user.pop('password', None)
            user['match_score'] = round(float(scores[i]) * 100, 1)
            results.append(user)

        print(f"[ML] recommend_collaborators: returning {len(results)} collaborators")
        return results


# Global singleton — trained once, shared across all requests
recommender = ProjectRecommender()

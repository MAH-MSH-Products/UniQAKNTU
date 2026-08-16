# Repository Rules & GitFlow Workflow

## 1. Core Branching Strategy
* **`main`**: The production-ready branch. Code in this branch must always be stable, tested, and ready for deployment. Direct commits to `main` are strictly forbidden.
* **`develop`**: The primary integration branch. All completed features are merged here for integration testing before moving to `main`.
* **`feature/*`**: Short-lived branches used for developing new features, UI components, or API endpoints.

## 2. Branch Naming Conventions
All feature branches must explicitly indicate the working domain (Frontend or Backend) and use kebab-case for the feature name.

* **Frontend Features:** `feature/fe-[feature-name]`
    * *Example:* `feature/fe-markdown-editor`
    * *Example:* `feature/fe-course-sidebar`
* **Backend Features:** `feature/be-[feature-name]`
    * *Example:* `feature/be-revision-api`
    * *Example:* `feature/be-postgres-setup`
* **Bug Fixes:** `bugfix/fe-[bug-name]` or `bugfix/be-[bug-name]`

## 3. Development & Merge Workflow
The development lifecycle must strictly follow these steps:

1. **Initialize Feature Branch:**
   Always branch out from the latest `develop`.
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/be-rollback-endpoint
   ```
2. **Commit Changes:**
   Use Conventional Commits format (`feat:`, `fix:`, `refactor:`, `docs:`).
   ```bash
   git commit -m "feat: implement rollback API endpoint"
   ```
3. **Push and Open Pull Request (PR):**
   Push the feature branch to the remote repository and open a PR targeting the `develop` branch.
   ```bash
   git push origin feature/be-rollback-endpoint
   ```
4. **CI/CD Execution:**
   Upon creating the PR, GitHub Actions `.yml` workflows will automatically trigger. These workflows execute automated testing, linting, and build verification.
5. **Merge to `develop`:**
   The PR can only be merged into `develop` if:
    * The GitHub Actions pipeline completes successfully (Green status).
    * The code has been reviewed by the other team member.
6. **Merge to `main` (Release):**
   Once a set of features is fully integrated and validated in `develop`, a Release PR is opened to merge `develop` into `main`. This triggers the production deployment pipeline.

## 4. GitHub Actions (.yml) Requirements
* The `.github/workflows/` directory must contain the CI configuration.
* **Backend workflow:** Must execute `pytest` (or Django test runner) and `flake8`/`black` linting.
* **Frontend workflow:** Must execute UI validation or JS linting (if applicable).
* Merging is hard-blocked if any workflow fails.

## 5. Document
* You HAVE to create a .md document file for each file which you implement based on constraint that is mentioned in documentations/Document-Constraint.md

# SmartBite Release Management Guide

This document defines the release management lifecycle, versioning policy, CI/CD gates, rollback procedures, and manual release workflows for the SmartBite Smart Canteen Management System.

---

## 1. Semantic Versioning Policy

SmartBite adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/):

$$\text{Format: } \mathbf{MAJOR.MINOR.PATCH}$$

- **MAJOR** (`1.0.0` $\rightarrow$ `2.0.0`): Breaking architectural changes, incompatible database migrations, or breaking API payload modifications.
- **MINOR** (`1.0.0` $\rightarrow$ `1.1.0`): New backward-compatible application features (e.g., payment gateway integration, export analytics).
- **PATCH** (`1.0.0` $\rightarrow$ `1.0.1`): Backward-compatible bug fixes, security patches, or documentation updates.

### Version Authority
The single source of truth for the active release version is the root `VERSION` file:
```bash
cat VERSION
# 1.0.0
```

---

## 2. Release Prerequisites (Quality Gates)

Before any release can be created or tagged, the following gates **MUST** pass:

1. **Frontend Tests**: 100% pass rate in Vitest suite (`npm --prefix frontend run test`).
2. **Backend Tests**: 100% pass rate in Jest suite (`npm --prefix backend run test`).
3. **Frontend Production Build**: Zero compilation or bundle errors (`npm --prefix frontend run build`).
4. **Coverage Reports Generated**: `backend/coverage/lcov.info` and `frontend/coverage/lcov.info` present.
5. **SonarQube Quality Gate**: Static code analysis must achieve `Passed (OK)` status with no blocker or critical vulnerabilities.

---

## 3. Manual Release Workflow (College Project & Presentation Guide)

For academic evaluation or local releases without an active Jenkins server, follow this step-by-step workflow:

### Step 3.1: Verify Tests and Quality Gate Locally
```bash
# 1. Run backend tests and verify 26 tests pass
cd backend
npm test

# 2. Run frontend tests and verify 10 tests pass
cd ../frontend
npm test

# 3. Build frontend production assets
npm run build
cd ..
```

### Step 3.2: Increment Version & Document Changes
1. Update `VERSION` file with the target version (e.g., `1.0.1` or `1.1.0`).
2. Add the corresponding release section into `CHANGELOG.md` detailing:
   - Added features
   - Changed items
   - Fixed bugs
3. Commit version updates:
   ```bash
   git add VERSION CHANGELOG.md
   git commit -m "chore(release): prepare v1.0.0 release"
   ```

### Step 3.3: Create an Annotated Git Tag
Never use lightweight tags for official releases. Always create an annotated tag:
```bash
git tag -a v1.0.0 -m "Release v1.0.0 - SmartBite Canteen System with DevOps"
git push origin v1.0.0
```

### Step 3.4: Build and Tag Release Docker Images
Tag images with both the explicit semantic version and `:latest`:
```bash
# Read version
export VERSION=$(cat VERSION)

# Build Backend Image
docker build -t smartbite-backend:${VERSION} -t smartbite-backend:latest ./backend

# Build Frontend Image
docker build -t smartbite-frontend:${VERSION} -t smartbite-frontend:latest ./frontend
```

### Step 3.5: Run the Release Stack via Docker Compose
```bash
docker compose up -d --build
```
Inspect running containers:
```bash
docker compose ps
docker compose logs -f
```

---

## 4. Production Deployment Approval Gate

In continuous delivery environments:
1. Release artifacts and Docker images are packaged during stages 1–11.
2. Publishing to registry (Stage 12) is only executed when `PUBLISH_DOCKER` is enabled.
3. Production deployment (Stage 13) **NEVER** happens automatically.
4. An authorized team lead or evaluator must review the release metadata and click **Approve** in Jenkins.
5. Jenkins logs the approver's name and timestamp in the build audit history.

---

## 5. Rollback Procedure (Disaster Recovery)

If an issue is detected post-deployment, immediately roll back to the previously verified Docker image tag without losing persistent SQLite order data:

### Instant Image Rollback:
```bash
# 1. Stop current release
docker compose down

# 2. Revert service images to previous version tag (e.g., v0.9.0 or previous hash)
docker run -d --name smartbite-backend-rollback \
  -p 5000:5000 \
  -v smartbite_canteen_data:/app/data \
  smartbite-backend:v1.0.0

# 3. Or update docker-compose.yml image tags:
# backend: image: smartbite-backend:v1.0.0
# frontend: image: smartbite-frontend:v1.0.0
docker compose up -d
```

### Database Persistence Safety
- SQLite data is stored in the Docker volume `smartbite_canteen_data` (`/app/data/canteen.db`).
- Container teardown (`docker compose down`) does **not** erase order or menu data.
- Never run `docker compose down -v` in production as `-v` removes volumes!

---

## 6. Release Anti-Patterns (Rules to Enforce)
- **Never overwrite a released version silently**: Once `v1.0.0` is published, bugfixes must become `v1.0.1`.
- **Never deploy without running tests**: If tests or quality gate fail, deployment is automatically halted.
- **Never hardcode credentials**: Pass all secrets via Jenkins Credentials or `.env` files.

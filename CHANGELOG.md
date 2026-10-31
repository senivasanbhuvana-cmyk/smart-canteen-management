# Changelog

All notable changes to the SmartBite Smart Canteen Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-22

### Added
- **Full JavaScript & Node.js Architecture**:
  - Express.js REST API with modular routers (`authRoutes`, `foodRoutes`, `orderRoutes`, `adminRoutes`).
  - Native SQLite database persistence with automated schema initialization, indexes, and zero Python dependencies.
  - Secure bcrypt password hashing and 24-hour expiration JSON Web Token (JWT) authentication.
  - Automated database seeder with default administrator (`admin@smartbite.com`), sample student (`student@campus.edu`), and 15 rich menu items.
- **Frontend & UI Testing**:
  - Vitest test suite integrated with React Testing Library and jsdom.
  - Full unit tests for frontend API client layer (`authAPI`, `foodAPI`, `orderAPI`, `adminAPI`).
  - Component and hook tests for `CartProvider` and cart calculation logic.
  - LCOV coverage report generation for SonarQube ingestion.
- **Backend Testing & Verification**:
  - Jest test suite with 26 automated unit and integration tests.
  - Test coverage for student registration, unique constraints, and secure authentication.
  - Test coverage for food catalog listing, filtering, search, and admin CRUD permissions.
  - Test coverage for atomic order checkout, stock deductions, and cart total calculations.
  - Test coverage for student order isolation and cancellation with automatic stock restoration.
  - Test coverage for administrative order lifecycle progression (`Placed` -> `Confirmed` -> `Preparing` -> `Ready for Pickup` -> `Completed`).
- **DevOps & CI/CD Pipeline**:
  - Root-level declarative `Jenkinsfile` featuring 13 distinct automated pipeline stages.
  - SonarQube static code analysis configuration in `sonar-project.properties` with Quality Gate enforcement.
  - Secret credential bindings for SonarQube tokens and Docker registry authentication without log exposure.
  - Manual approval gate with audit trail logging prior to production deployment.
- **Containerization**:
  - Multi-stage `frontend/Dockerfile` building React with Vite and serving production bundles via Nginx with reverse proxy and SPA routing.
  - Hardened `backend/Dockerfile` based on Node 22 Alpine executing under an unprivileged `node` user with healthcheck probes.
  - `docker-compose.yml` orchestrating frontend and backend services with a persistent SQLite data volume (`canteen-data`).
- **Release Management & Governance**:
  - Semantic versioning policy documented in `RELEASE.md`.
  - Manual release workflow designed for college project demonstrations and enterprise standards.
  - Docker container image rollback procedure for rapid disaster recovery.

### Removed
- Removed legacy Python backend files (`app.py`, `database.py`, `models.py`, `auth_utils.py`, `seed.py`, `requirements.txt`).
- Removed legacy Python test files and caches (`tests/conftest.py`, `test_auth.py`, `test_menu.py`, `test_orders.py`).

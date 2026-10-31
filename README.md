# SmartBite — Smart Canteen Management System with DevOps

A production-grade, full-stack college canteen management web application built with **React & Vite** on the frontend, **Node.js & Express.js** on the backend, **SQLite** for relational database persistence, and a complete DevOps lifecycle comprising **SonarQube Static Analysis**, **Jenkins CI/CD Declarative Pipeline**, **Docker Containerization**, and **Semantic Release Management**.

---

## 1. Project Overview & Architecture

**SmartBite** modernizes campus cafeteria operations by eliminating long queue wait times, automating kitchen stock deductions, enabling order tracking through a 5-stage visual progress stepper, and empowering kitchen staff with real-time analytics and inventory controls.

### Pure JavaScript / Node.js Architecture
The application runs entirely on JavaScript across the stack with **zero Python dependencies**:
- **Frontend SPA**: React 19, Vite, Lucide Icons, Context API (`AuthContext`, `CartContext`, `ToastContext`), Vanilla CSS3 with responsive glassmorphism and warm palette (`#FAF7F2` cream, `#EA580C` orange).
- **Backend API**: Node.js & Express.js REST API structured with modular controllers, input validation, and secure password hashing.
- **Database Engine**: Embedded SQLite with strict foreign keys, atomic transactions for checkout and stock restoration, and auto-seeding.
- **Testing**: **Vitest** for frontend React components & API services; **Jest** with Supertest for backend API endpoints and transactions.
- **DevOps Suite**:
  - **SonarQube**: Multi-module JavaScript analysis with LCOV coverage ingestion and automated Quality Gate enforcement.
  - **Jenkins Pipeline**: 13-stage declarative pipeline with credential masking and production approval gates.
  - **Docker**: Multi-stage Nginx container for React and hardened Node.js Alpine container for Express, orchestrated via Docker Compose with persistent data volumes.
  - **Release Management**: Semantic Versioning (`1.0.0`), annotated Git tags, release metadata, and container rollback strategy.

---

## 2. Technology Stack

| Layer | Technology | Version / Specification | Description |
|---|---|---|---|
| **Frontend Framework** | React | `^19.2.8` | Declarative UI components, stateful hooks, context providers |
| **Frontend Tooling** | Vite | `^8.3.0` | Ultra-fast HMR dev server and optimized Rollup production builds |
| **Frontend Testing** | Vitest & Testing Library | `^3.0.7` & `^16.2.0` | In-memory jsdom unit and component test runner with v8 coverage |
| **Backend Runtime** | Node.js | `>= 20.x` (v22/v24 supported) | High-performance asynchronous JavaScript runtime |
| **Backend Framework** | Express.js | `^4.21.2` | RESTful API routing, middleware, and error handling |
| **Database** | SQLite | `node:sqlite` / SQLite 3 | Relational database with foreign key constraints and ACID transactions |
| **Authentication** | JWT & Bcrypt | `jsonwebtoken`, `bcryptjs` | 24-hour Bearer token validation and 10-round salted password hashing |
| **Backend Testing** | Jest & Supertest | `^29.7.0` & `^7.0.0` | API integration test suite with LCOV coverage generation |
| **Static Code Analysis**| SonarQube | Scanner CLI / `sonar-project.properties` | Code quality, vulnerability scanning, and Quality Gate verification |
| **CI/CD Pipeline** | Jenkins | Declarative Pipeline (`Jenkinsfile`) | 13-stage automated build, test, scan, package, and deploy pipeline |
| **Containerization** | Docker & Docker Compose | Multi-stage Dockerfiles | Alpine-based isolated containers with persistent named volumes |

---

## 3. Database Schema

The database consists of 4 relational tables with foreign keys and performance indexes:

```
+-----------------------------------------------------------+
|                          users                            |
+-----------------------------------------------------------+
| id            INTEGER PRIMARY KEY AUTOINCREMENT           |
| name          TEXT NOT NULL                               |
| email         TEXT UNIQUE NOT NULL                        |
| student_id    TEXT UNIQUE                                 |
| password_hash TEXT NOT NULL                               |
| role          TEXT NOT NULL DEFAULT 'student'             |
| created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP         |
+-----------------------------------------------------------+
                            | 1
                            |
                            | N
+-----------------------------------------------------------+
|                          orders                           |
+-----------------------------------------------------------+
| id             INTEGER PRIMARY KEY AUTOINCREMENT          |
| order_number   TEXT UNIQUE NOT NULL                       |
| user_id        INTEGER NOT NULL (FK -> users.id)          |
| total_amount   REAL NOT NULL                              |
| payment_method TEXT NOT NULL                              |
| payment_status TEXT NOT NULL DEFAULT 'pending'            |
| status         TEXT NOT NULL DEFAULT 'Placed'             |
| notes          TEXT                                       |
| created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP        |
| updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP        |
+-----------------------------------------------------------+
                            | 1
                            |
                            | N
+-----------------------------------------------------------+
|                       order_items                         |
+-----------------------------------------------------------+
| id             INTEGER PRIMARY KEY AUTOINCREMENT          |
| order_id       INTEGER NOT NULL (FK -> orders.id)         |
| food_item_id   INTEGER NOT NULL (FK -> food_items.id)     |
| item_name      TEXT NOT NULL                              |
| price_at_order REAL NOT NULL                              |
| quantity       INTEGER NOT NULL                           |
| subtotal       REAL NOT NULL                              |
+-----------------------------------------------------------+
                            | N
                            |
                            | 1
+-----------------------------------------------------------+
|                       food_items                          |
+-----------------------------------------------------------+
| id             INTEGER PRIMARY KEY AUTOINCREMENT          |
| name           TEXT NOT NULL                              |
| description    TEXT                                       |
| category       TEXT NOT NULL                              |
| price          REAL NOT NULL                              |
| is_veg         INTEGER NOT NULL DEFAULT 1                 |
| image_url      TEXT                                       |
| stock_quantity INTEGER NOT NULL DEFAULT 20                |
| is_available   INTEGER NOT NULL DEFAULT 1                 |
| created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP        |
| updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP        |
+-----------------------------------------------------------+
```

---

## 4. Default Seed Accounts & Demo Credentials

When the backend starts up, it automatically initializes the SQLite schema and seeds standard test accounts and menu items:

| Role | Name | Email | Password | Student ID |
|---|---|---|---|---|
| **Canteen Admin** | Campus Admin | `admin@smartbite.com` | `admin123` | N/A (Admin) |
| **Demo Student** | Aarav Sharma | `student@campus.edu` | `student123` | `CS2026-042` |

The menu includes 15 authentic dishes across categories:
- **Breakfast**: Masala Dosa, Idli Vada Combo, Indori Poha, Aloo Paratha with Curd.
- **Meals**: Hyderabadi Chicken Biryani, Paneer Butter Masala Meal, South Indian Mini Thali, Egg Curry Bowl.
- **Snacks**: Crispy Veg Samosa, Mumbai Pav Bhaji, Paneer Pakora Platter.
- **Fast Food**: Crispy Veg Cheese Burger, Grilled Chicken Burger, Peri Peri French Fries, Farmhouse Cheesy Pizza.
- **Drinks**: South Indian Filter Coffee, Special Masala Chai, Alphonso Mango Lassi, Iced Cold Coffee, Fresh Mint Lime Soda.

---

## 5. Local Setup & Execution Guide

### Prerequisites
- **Node.js** v20.x or higher (tested on Node v24.20.0).
- **npm** v10.x or higher.

### Quick Launch (Windows Batch File)
Double-click `run_all.bat` or run:
```bat
run_all.bat
```
This opens two independent terminal windows:
1. Backend REST API on `http://localhost:5000`
2. Frontend Vite Application on `http://localhost:5173`

### Manual Step-by-Step Launch

#### 1. Setup Backend:
```bash
cd backend
npm install
node src/seed.js        # Initial database seed (optional, server auto-seeds)
npm start              # Starts Express server on http://localhost:5000
```

#### 2. Setup Frontend:
```bash
cd frontend
npm install
npm run dev            # Starts Vite development server on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 6. Testing & Quality Verification

SmartBite features comprehensive automated testing covering both frontend and backend layers with zero Python tools.

### Run All Tests from Project Root:
```bash
npm test
```

### Run Backend Tests (Jest):
```bash
cd backend
npm test
```
- **26 Automated Unit & Integration Tests**:
  - `tests/auth.test.js`: Registration, unique email/student_id constraints, login, password verification, profile retrieval.
  - `tests/menu.test.js`: Food listing, category filter, dietary filter, text search, admin food creation, editing, deletion.
  - `tests/orders.test.js`: Cart checkout transaction, atomic stock deduction, stock limit validation, student order isolation, order cancellation with stock restoration.
  - `tests/admin.test.js`: Canteen analytics computation, order dispatch queue, state machine advancement (`Placed` $\rightarrow$ `Confirmed` $\rightarrow$ `Preparing` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Completed`), invalid transition rejection.
- Generates LCOV report at `backend/coverage/lcov.info`.

### Run Frontend Tests (Vitest):
```bash
cd frontend
npm test
```
- **10 Automated React & Service Tests**:
  - `src/test/api.test.js`: HTTP request headers, Bearer token attachment, query formatting, checkout payload formatting, error handling.
  - `src/test/cartContext.test.jsx`: Cart state initialization, addition, line totals, duplicate item quantity aggregation, kitchen stock limits, item removal, cart clearing.
- Generates LCOV report at `frontend/coverage/lcov.info`.

### Run Frontend Production Build:
```bash
cd frontend
npm run build
```
Builds optimized production assets in `frontend/dist/`.

---

## 7. SonarQube Static Analysis & Quality Gate

### Configuration: `sonar-project.properties`
The root `sonar-project.properties` is configured for JavaScript source and test analysis:
```properties
sonar.projectKey=smartbite-canteen-management
sonar.projectName=SmartBite - Smart Canteen Management System
sonar.projectVersion=1.0.0

sonar.sources=backend/src,frontend/src
sonar.tests=backend/tests,frontend/src/test
sonar.test.inclusions=backend/tests/**/*.js,frontend/src/test/**/*.{js,jsx}

sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/*.config.js,frontend/public/**,backend/*.db*
sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info

sonar.qualitygate.wait=true
```

### Running SonarQube Scanner Locally:
1. Ensure SonarQube server is running (e.g. `http://localhost:9000`).
2. Generate token in SonarQube: *User Profile* $\rightarrow$ *Security* $\rightarrow$ *Generate Tokens*.
3. Execute the scanner:
```bash
# Using sonarqube-scanner via npx
npx -y sonarqube-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.login=YOUR_SONAR_TOKEN
```
*Note: Tokens are passed via parameters or environment variables; never hardcode tokens.*

---

## 8. Jenkins CI/CD Declarative Pipeline

The root `Jenkinsfile` implements a 13-stage declarative pipeline:

```
[1. Checkout] ──> [2. Install Dependencies] ──> [3. Frontend Tests] ──> [4. Backend Tests]
       │
       ▼
[5. Coverage Reports] ──> [6. Build React Frontend] ──> [7. SonarQube Analysis] ──> [8. Quality Gate]
       │
       ▼
[9. Build Docker Images] ──> [10. Validate Images] ──> [11. Release Metadata]
       │
       ▼
[12. Optional Publish (Registry)] ──> [13. Manual Approval & Production Deploy]
```

### Key Stages Explained:
1. **1. Checkout Source Code**: Checks out Git commit and reads semantic version from `VERSION`.
2. **2. Install Dependencies**: Runs `npm ci` for backend and frontend.
3. **3. Run Frontend Tests**: Executes Vitest suite.
4. **4. Run Backend Tests**: Executes Jest suite.
5. **5. Generate Coverage Reports**: Asserts existence of `backend/coverage/lcov.info` and `frontend/coverage/lcov.info`.
6. **6. Build React Frontend**: Compiles production assets into `frontend/dist`.
7. **7. SonarQube Analysis**: Runs scanner using Jenkins credential `SONAR_TOKEN`.
8. **8. Quality Gate**: Waits up to 5 minutes for SonarQube Quality Gate webhook and aborts pipeline on failure.
9. **9. Build Docker Images**: Builds versioned images `smartbite-backend:${VERSION}` and `smartbite-frontend:${VERSION}`.
10. **10. Validate Images**: Inspects image integrity using `docker image inspect`.
11. **11. Prepare Versioned Release Metadata**: Archives build number, commit hash, `VERSION`, and `CHANGELOG.md`.
12. **12. Optionally Publish Images**: Authenticates to registry using `DOCKER_REGISTRY_CREDENTIALS` if `PUBLISH_DOCKER` is checked.
13. **13. Require Explicit Approval Before Production Deployment**: Displays a manual interactive prompt requiring authorized approval before deploying via Docker Compose.

---

## 9. Docker Containerization & Docker Compose

### Container Structure
- **Backend Container (`backend/Dockerfile`)**:
  - Base: `node:22-alpine`
  - Non-root user: `node`
  - Persistent volume: Mounted at `/app/data` for `canteen.db`
  - Health check: HTTP GET `/api/health` via `curl`
- **Frontend Container (`frontend/Dockerfile`)**:
  - Base: Multi-stage with `node:22-alpine` builder and `nginx:alpine` runner
  - SPA routing: `try_files $uri $uri/ /index.html;`
  - Reverse proxy: Routes `/api/` traffic directly to `http://backend:5000/api/`

### Running the System with Docker Compose
```bash
# Build images and start all services in the background
docker compose up -d --build

# Inspect running containers
docker compose ps

# View real-time container logs
docker compose logs -f

# View backend logs specifically
docker compose logs -f backend

# Stop the containers without losing database data
docker compose down
```

---

## 10. Release Management & Rollback Strategy

Detailed release procedures are documented in [`RELEASE.md`](./RELEASE.md) and tracked in [`CHANGELOG.md`](./CHANGELOG.md).

### Creating a New Release:
1. Ensure all tests and Quality Gate checks pass.
2. Update semantic version in `VERSION` (e.g. `1.1.0`).
3. Document additions and bugfixes in `CHANGELOG.md`.
4. Commit and push an annotated Git tag:
   ```bash
   git add VERSION CHANGELOG.md
   git commit -m "chore(release): prepare v1.1.0"
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   ```
5. Build and tag release Docker images:
   ```bash
   docker build -t smartbite-backend:1.1.0 -t smartbite-backend:latest ./backend
   docker build -t smartbite-frontend:1.1.0 -t smartbite-frontend:latest ./frontend
   ```

### Instant Rollback (Disaster Recovery):
If an issue occurs in production, revert containers to the previous version tag without data loss:
```bash
docker compose down
# Launch previous release image
docker run -d --name smartbite-backend-rollback \
  -p 5000:5000 \
  -v smartbite_canteen_data:/app/data \
  smartbite-backend:1.0.0
```

---

## 11. REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new student account.
- `POST /api/auth/login`: Authenticate with email/password; returns JWT token.
- `GET /api/auth/me`: Retrieve current user profile (requires Bearer token).
- `POST /api/auth/logout`: Invalidate session.

### Food Catalog (`/api/foods`)
- `GET /api/foods`: List all menu items with query filters (`category`, `search`, `is_veg`, `available_only`).
- `GET /api/foods/categories`: Retrieve category counts.
- `GET /api/foods/:id`: Get detailed food item by ID.
- `POST /api/foods`: Create new dish (Admin only).
- `PUT /api/foods/:id`: Update dish details or stock (Admin only).
- `DELETE /api/foods/:id`: Delete or archive dish (Admin only).

### Orders (`/api/orders`)
- `POST /api/orders/checkout`: Place order with atomic stock validation and deduction (Student only).
- `GET /api/orders/my-orders`: List user's past orders with items (Student only).
- `GET /api/orders/:id`: Get single order details (Owner or Admin).
- `POST /api/orders/:id/cancel`: Cancel order before preparation begins; restores item stock (Owner or Admin).

### Administrator Analytics & Queue (`/api/admin`)
- `GET /api/admin/stats`: KPI overview (total orders, daily sales, low stock alerts).
- `GET /api/admin/orders`: List all canteen orders with status, date, and keyword filters.
- `PUT /api/admin/orders/:id/status`: Transition order status (`Placed` $\rightarrow$ `Confirmed` $\rightarrow$ `Preparing` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Completed`).

---

## 12. Troubleshooting & FAQ

- **Port 5000 or 5173 already in use**:
  Check running processes using `netstat -ano | findstr :5000` or change `PORT` in `.env`.
- **Database lock or permission error in Docker**:
  The SQLite database file must be in `/app/data`, which is owned by user `node:node` in the container. The provided `Dockerfile` and `docker-compose.yml` configure this automatically.
- **Lost student or admin password**:
  Re-run `node src/seed.js` inside the `backend` folder to reset the default admin and demo student credentials.

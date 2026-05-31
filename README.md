# Employee Management System

A full-stack web application for managing companies, departments, employees, and HR managers — with role-based access control, JWT authentication, and a modern React interface.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend Framework** | Django | 5.0 |
| **REST API** | Django REST Framework | 3.x |
| **Authentication** | SimpleJWT (with token blacklist) | 5.x |
| **Database** | PostgreSQL | 18 |
| **DB Adapter** | psycopg2-binary | 2.9 |
| **CORS** | django-cors-headers | — |
| **Config** | python-decouple | — |
| **Image Handling** | Pillow | 11.x |
| **Frontend Framework** | React + TypeScript | 19 / 6 |
| **Build Tool** | Vite | 8.x |
| **Styling** | Tailwind CSS | 3.x |
| **Routing** | React Router DOM | 7.x |
| **HTTP Client** | Axios | 1.x |
| **Forms** | React Hook Form | 7.x |
| **Icons** | Lucide React | — |
| **Notifications** | React Hot Toast | 2.x |

---

## Architecture & Database Design

### Entities & Fields

| Entity | Key Fields |
|---|---|
| **User** | `id`, `email` (unique), `role` (admin / hr_manager / employee), `company` (FK, nullable), `is_active` |
| **Company** | `id`, `name` (unique), `logo` (image, optional), `created_at`, `updated_at` |
| **Department** | `id`, `name`, `company` (FK), `created_at`, `updated_at` |
| **Employee** | `id`, `user` (OneToOne FK), `company` (FK), `department` (FK), `name`, `email`, `mobile`, `address`, `title`, `hire_date`, `status` (active / inactive) |

### Relationships

```
Company ──< Department      (one company has many departments)
Company ──< Employee        (one company has many employees)
Company ──< User            (one company has many users)
Department ──< Employee     (one department has many employees)
User ──── Employee          (one-to-one: each employee has exactly one user account)
```

### ERD

![ERD](backend/docs/Employee%20Management%20System%20-%20ERD.png)

---

## Features

- **JWT Authentication** — access + refresh token pair, automatic silent refresh, token blacklisting on logout
- **Three-tier Role System** — System Admin, HR Manager, Employee with enforced permissions at both API and UI level
- **Company Management** — full CRUD for admins; read-only view for HR managers
- **Department Management** — full CRUD scoped per company for admins and HR managers
- **Employee Management** — full CRUD scoped per company; employees can view their own profile
- **HR Manager Creation** — admins can create HR manager accounts linked to a specific company
- **Employee Status Sync** — toggling an employee inactive automatically disables their login
- **Computed Fields** — `days_employed` calculated server-side from hire date; `total_departments` and `total_employees` aggregated on Company
- **Summary Dashboard** — animated stat cards (companies, departments, employees), recent employees table, department overview; default landing page for Admin and HR Manager
- **Employee Report** — printable/exportable table of active employees with name/email/mobile/title/hire date/days employed/company/department; filter by company, department, or name search
- **Responsive UI** — sidebar navigation, stat cards, data tables, modal forms with validation
- **Role Badge** — sidebar displays color-coded role label (System Admin / HR Manager / Employee)

---

## Role-Based Access Control

| Action | System Admin | HR Manager | Employee |
|---|:---:|:---:|:---:|
| View all companies | ✅ | ✅ | ❌ |
| Add / Edit / Delete company | ✅ | ❌ | ❌ |
| View departments | ✅ all | ✅ own company | ❌ |
| Add / Edit / Delete department | ✅ | ✅ own company | ❌ |
| View employees | ✅ all | ✅ own company | ✅ own profile |
| Add / Edit / Delete employee | ✅ | ✅ own company | ❌ |
| Create HR Manager accounts | ✅ | ❌ | ❌ |
| View HR Manager list | ✅ | ❌ | ❌ |
| View own profile (`/profile`) | ✅ | ✅ | ✅ |
| View dashboard (`/dashboard`) | ✅ | ✅ | ❌ |
| View employee report (`/report`) | ✅ | ✅ | ❌ |

---

## Project Structure

```
Employee-management-system/
│
├── backend/
│   ├── accounts/               # Custom User model, JWT auth, permissions, HR Manager API
│   │   ├── models.py           # User (email-based, role choices)
│   │   ├── serializers.py      # LoginSerializer, UserSerializer, HRManagerCreateSerializer
│   │   ├── views.py            # LoginView, LogoutView, RefreshView, UserListCreateView
│   │   ├── permissions.py      # IsAdmin, IsHRManager, IsAdminOrHRManager
│   │   └── urls.py
│   │
│   ├── companies/              # Company CRUD
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py            # CompanyViewSet (admin write, hr_manager read)
│   │   └── urls.py
│   │
│   ├── departments/            # Department CRUD (company-scoped)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py            # DepartmentViewSet
│   │   └── urls.py
│   │
│   ├── employees/              # Employee CRUD (company-scoped)
│   │   ├── models.py
│   │   ├── serializers.py      # EmployeeSerializer, EmployeeCreateSerializer
│   │   ├── views.py            # EmployeeViewSet (includes /me endpoint)
│   │   └── urls.py
│   │
│   ├── core/                   # Django project config
│   │   ├── settings.py
│   │   └── urls.py             # Root URL dispatcher
│   │
│   ├── docs/
│   │   └── Employee Management System - ERD.png
│   │
│   ├── manage.py
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts        # Axios instance, request interceptor, auto token refresh
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Layout.tsx
│   │   │       ├── Sidebar.tsx       # Navigation + role badge
│   │   │       └── ProtectedRoute.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # JWT state, login/logout, role helpers
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx         # Summary stats, recent employees, dept overview
│   │   │   ├── Companies.tsx
│   │   │   ├── Departments.tsx
│   │   │   ├── Employees.tsx         # Employees + HR Managers tabs
│   │   │   ├── EmployeeReport.tsx    # Printable active-employee report
│   │   │   └── Profile.tsx
│   │   ├── types/
│   │   │   └── index.ts              # User, Company, Department, Employee interfaces
│   │   └── App.tsx                   # Routes + role-based guards
│   │
│   ├── index.html
│   ├── vite.config.ts
│   └── .env
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt            # Django-only dependencies
│   └── .env.example
├── frontend/
│   └── Dockerfile
├── docker-compose.yml
├── requirements.txt                # Root (global/unrelated — not used by Docker)
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 22+ and npm (Vite 8 requires Node 22.12+)
- PostgreSQL 18

---

### Backend Setup

**1. Create and activate a virtual environment**

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

**2. Install dependencies**

```bash
pip install django djangorestframework djangorestframework-simplejwt \
            django-cors-headers psycopg2-binary Pillow python-decouple
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=employee_management
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**4. Create the PostgreSQL database**

```sql
CREATE DATABASE employee_management;
```

**5. Run migrations and create a superuser**

```bash
python manage.py migrate
python manage.py createsuperuser
```

**6. Start the development server**

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.

---

### Frontend Setup

**1. Install dependencies**

```bash
cd frontend
npm install
```

**2. Configure environment variables**

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

**3. Start the development server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`.

---

## Docker Setup

> Boot the entire stack — database, backend API, and frontend — with a single command.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/) v2+

### Quick Start

**1. Create the backend environment file**

```bash
cp backend/.env.example backend/.env
```

The defaults in `.env.example` work out of the box for local Docker. Optionally set a strong `SECRET_KEY` before running.

> **Important:** Any `SECRET_KEY` value containing special characters like `$` must be wrapped in single quotes in `.env` to prevent Docker Compose from misinterpreting them as variable references:
> ```env
> SECRET_KEY='your$ecret!key'
> ```

**2. Boot everything**

```bash
docker compose --env-file backend/.env up -d --build
```

| Service | URL | Container |
|---|---|---|
| **Frontend** | http://localhost:5173 | `ems-frontend` |
| **Backend API** | http://localhost:8000/api | `ems-backend` |
| **PostgreSQL** | localhost:5432 | `ems-db` |

Migrations run automatically on backend startup. The backend waits for the database to pass its health check before starting.

**3. Create a superuser (first run only)**

```bash
docker exec -it ems-backend python manage.py createsuperuser
```

**4. View logs**

```bash
docker compose --env-file backend/.env logs -f backend
docker compose --env-file backend/.env logs -f frontend
```

### Stop & Clean Up

```bash
docker compose --env-file backend/.env down        # stop containers, keep database
docker compose --env-file backend/.env down -v     # stop containers + wipe database volume
```

> **Note:** When you wipe the volume (`-v`) you must re-run `createsuperuser` on the next boot. If you update npm dependencies, also remove the frontend node_modules volume:
> ```bash
> docker volume rm employee-management-system_frontend_node_modules
> ```

---

## API Documentation

All protected endpoints require the header:
```
Authorization: Bearer <access_token>
```

---

### Authentication — `/api/auth/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login/` | Public | Login; returns `access`, `refresh`, `user` |
| `POST` | `/api/auth/logout/` | Required | Blacklists the refresh token |
| `POST` | `/api/auth/refresh/` | Public | Exchange refresh token for new access token |

**Login request body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Login response:**
```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": { "id": 1, "email": "user@example.com", "role": "admin", "company_id": null }
}
```

---

### User Management — `/api/accounts/`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/accounts/users/` | Admin | List all users; filter with `?role=hr_manager` |
| `POST` | `/api/accounts/users/` | Admin | Create an HR Manager account |

**Create HR Manager request body:**
```json
{ "email": "hr@company.com", "password": "secret123", "company": 1 }
```

---

### Companies — `/api/companies/`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/companies/` | Admin, HR Manager | List all companies |
| `POST` | `/api/companies/` | Admin | Create a company |
| `GET` | `/api/companies/{id}/` | Admin, HR Manager | Retrieve a company |
| `PATCH` | `/api/companies/{id}/` | Admin | Update a company |
| `DELETE` | `/api/companies/{id}/` | Admin | Delete a company (cascades) |

---

### Departments — `/api/departments/`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/departments/` | Admin, HR Manager | List departments (HR Manager sees own company only) |
| `POST` | `/api/departments/` | Admin, HR Manager | Create a department (scoped to own company) |
| `GET` | `/api/departments/{id}/` | Admin, HR Manager | Retrieve a department |
| `PATCH` | `/api/departments/{id}/` | Admin, HR Manager | Update (own company only) |
| `DELETE` | `/api/departments/{id}/` | Admin, HR Manager | Delete (own company only) |

---

### Employees — `/api/employees/`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/employees/` | Admin, HR Manager | List employees (HR Manager sees own company only) |
| `POST` | `/api/employees/` | Admin, HR Manager | Create employee + linked user account |
| `GET` | `/api/employees/{id}/` | Admin, HR Manager, Employee* | Retrieve employee profile |
| `PATCH` | `/api/employees/{id}/` | Admin, HR Manager | Partial update (own company only) |
| `DELETE` | `/api/employees/{id}/` | Admin, HR Manager | Delete employee + user account |
| `GET` | `/api/employees/me/` | Any authenticated | Returns the current user's employee profile |

\* Employees can only retrieve their own profile.

**Create employee request body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "mobile": "+1 555 000 0000",
  "address": "123 Main St",
  "title": "Software Engineer",
  "hire_date": "2024-01-15",
  "status": "active",
  "company": 1,
  "department": 2,
  "initial_password": "secret123"
}


```

---

## Default Test Credentials

After running `python manage.py createsuperuser`, use the credentials you set during that step.

| Role | How to create |
|---|---|
| **System Admin** | `python manage.py createsuperuser` |
| **HR Manager** | Admin creates via the HR Managers tab in the app, or `POST /api/accounts/users/` |
| **Employee** | Admin or HR Manager creates via the Employees tab or `POST /api/employees/` |

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

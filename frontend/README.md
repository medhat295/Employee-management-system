# Frontend

React 19 + TypeScript + Vite frontend for the Employee Management System.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Environment

Create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Notes

- Admin and HR Manager users land on `/dashboard` after login.
- Employee users land on `/profile`.
- Authentication uses JWT access/refresh tokens stored in `localStorage`.
- Axios automatically refreshes expired access tokens through `/api/auth/refresh/`.

# Foodie — Food Delivery Platform

React/Vite frontend + Express backend + MongoDB. Authentication is handled by
**Firebase Authentication**, and authorization is enforced on the **backend**
using the Firebase Admin SDK + the real role stored in MongoDB.

## Roles

| Role | Dashboard URL | Login URL |
|------|---------------|-----------|
| customer | `/customer/dashboard` | `/customer/login` |
| restaurantOwner | `/restaurant-owner/dashboard` | `/restaurant-owner/login` |
| rider | `/rider/dashboard` | `/rider/login` |
| admin | `/admin/dashboard` | `/admin/login` |

Only users whose **real MongoDB role** matches the portal are allowed in. E.g. an
admin logging in at `/customer/login` is rejected (`403`).

## Environment variables

### Frontend (`/.env`)
Public Firebase web config (these are **not** secrets):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_API_URL=http://localhost:5000
```

### Backend (`/backend/src/.env`)
Private/secret config:

```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://...
DB_NAME=Food-Delivery001

# REQUIRED — Firebase Admin SDK credentials (one of):
FIREBASE_SERVICE_ACCOUNT={ "type": "service_account", ... }
# or
FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\to\service-account.json
```

Get the service account from Firebase Console → Project Settings → Service
accounts → Generate new private key. **Never commit this file.**

## Setup / run

1. `npm install` (frontend root)
2. `npm install` in `backend/src`
3. Add your Mongo URI + Firebase Admin service account to `backend/src/.env`
4. Add your Firebase web config to `/.env`
5. `npm run setup` (in `backend/src`) to create collections/indexes
6. Start backend: `npm run dev` (in `backend/src`)
7. Start frontend: `npm run dev` (root)

## Security model

- Backend middleware `verifyFirebaseToken` validates the `Authorization: Bearer
  <firebase-id-token>` header with the Firebase Admin SDK.
- `verifyRole(...roles)` loads the **real** role/status from MongoDB (never the
  client-sent role) and rejects unauthorized requests with `HTTP 403`.
- Frontend `<RequireAuth allowedRoles={[...]}>` provides UI protection only; it
  is **not** the security boundary.
- Protected APIs must be mounted with `verifyRole`, e.g.:
  ```js
  app.use("/api/user", verifyRole("customer"), ordersRouter);
  ```
- `GET /api/auth/me` returns the authenticated user's real profile/role and is
  used to restore sessions after refresh.
- `POST /api/auth/resolve-email` (`{identifier}`) is used by the customer login
  page's **Email / Phone** field: a phone number is resolved to the account
  email in MongoDB before the Firebase sign-in (Firebase requires an email).

## Customer signup fields (stored in MongoDB `login`)

`name`, `email`, `phone`, `role`, `address.full` (delivery address),
`avatar_url` (uploaded to Firebase Storage), `terms_accepted` /
`terms_accepted_at`. Storage bucket used: `food-delivery-5a96e.firebasestorage.app`.

## Frontend auth routes

- Customer unified forms: `/login` (Email/Phone, Password, Remember Me,
  Forgot Password, Google placeholder, Sign Up) and `/signup` (Full Name, Email,
  Phone, Password, Confirm, Delivery Address, Profile Photo, Terms).
- Staff role portals (unchanged): `/restaurant-owner/login`, `/rider/login`,
  `/admin/login` and the `/auth` role-selector landing page.

# ============================================================
# MongoDB Data Model — Food-Delivery001
# ============================================================
Database: Food-Delivery001

The schema is document-based with explicit referential relationships
(ObjectId references). This keeps documents self-contained for fast UI
rendering while preserving relations between the five collections.

Collections:
  1. food-collection         -> menu items
  2. login                   -> authenticated users (customers/owners/admins/riders)
  3. order-summary           -> customer orders (analytic + history)
  4. payment-intg            -> payment records
  5. resturent-collection    -> restaurants

Relationships
------------------------------------------------------------
  login  (1) -- (N) order-summary        via order-summary.user_id
  resturent-collection (1) -- (N) food-collection  via food-collection.restaurant_id
  resturent-collection (1) -- (N) order-summary    via order-summary.restaurant_id
  order-summary (1) -- (1) payment-intg            via payment-intg.order_id
  order-summary (1) -- (N) food-collection         via order-summary.items[].food_id
------------------------------------------------------------
```

## 1. `login` — user accounts & authentication

Stores the profile + role for every platform user. `role` routes the user to
the correct portal (customer / restaurantOwner / rider / admin).

Authentication is delegated to **Firebase Authentication** — the password is
NOT stored here (no `password_hash`). The backend verifies the Firebase ID
token via the Firebase Admin SDK and links it to this record by `uid`/`email`.
The REAL role is always read from this collection — a role sent by the client
is never trusted.

```json
{
  "_id": "ObjectId",
  "uid": "FirebaseUid",                          // from Firebase Admin (unique, sparse)
  "name": "Mamun Ahmed",
  "email": "mamun@example.com",                  // unique index
  "phone": "+8801XXXXXXXXX",
  "address": {                                   // delivery address (customers)
    "district": "Dhaka",
    "street": "Road 5",
    "houseNo": "House 12"
  },
  "role": "customer",                            // customer | restaurantOwner | rider | admin
  "status": "active",                            // active | inactive | blocked
  "avatar_url": "https://...",
  "restaurant_id": null,                         // set only when role = restaurantOwner
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

Notes:
- No password is stored — Firebase Authentication handles password/identity.
- `status` gates access: `inactive` and `blocked` accounts are rejected (HTTP 403).
- `blocked` returns a "contact support" style error; `inactive` a "re-enable" error.

Indexes: unique on `email`; unique (sparse) on `uid`; index on `role`; index on `status`.

Role assignment rules:
- Public signup may create `customer`, `restaurantOwner`, `rider`.
- `admin` is NEVER assigned from public signup — only via controlled seed/admin setup scripts.

## 2. `resturent-collection` — restaurants

Business data owned by a `login` record with `role:"restaurantOwner"`. Foods
belong to it via `restaurant_id`.

```json
{
  "_id": "ObjectId",
  "name": "MAMUN Kitchen",
  "logo_url": "https://...",
  "cover_url": "https://...",
  "owner_login_id": "ObjectId(login._id)",   // -> login
  "cuisine": "Mixed",
  "address": "123 Food Street, Dhaka",
  "phone": "+8801XXXXXXXXX",
  "is_open": true,
  "rating": 4.9,
  "delivery_charge": 3.99,
  "min_order": 5,
  "created_at": "ISODate"
}
```

Indexes: index on `owner_login_id`.

## 3. `food-collection` — menu items

Foods offered by a restaurant. `price` is the current shelf price; orders
snapshot their own unit price so historical orders never change.

```json
{
  "_id": "ObjectId",
  "restaurant_id": "ObjectId(resturent-collection._id)",  // -> restaurant
  "food_name": "Margherita Pizza",
  "category": "Pizza",
  "description": "Classic cheese pizza with fresh basil.",
  "price": 8.99,
  "image_url": "https://...",
  "is_available": true,
  "rating": 4.8,
  "created_at": "ISODate"
}
```

Indexes: index on `restaurant_id`; index on `category`.

## 4. `order-summary` — orders (history + analytics)

The analytic query targets this collection: per-user + time-range scans
using the composite index `(user_id, created_at)`. Restaurant name/logo
are de-normalised so order cards render without a join. Price per line is
snapshotted from `food-collection` at purchase time.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId(login._id)",          // -> login
  "restaurant_id": "ObjectId(resturent-collection._id)", // -> restaurant
  "restaurant_name": "MAMUN Kitchen",        // de-normalised for cards
  "restaurant_logo": "https://...",

  "items": [
    {
      "food_id": "ObjectId(food-collection._id)", // -> food
      "food_name": "Margherita Pizza",
      "quantity": 2,
      "unit_price": 8.99                       // price snapshot
    }
  ],

  "subtotal": 17.98,
  "delivery_fee": 3.99,
  "total_amount": 21.97,                       // subtotal + delivery_fee

  "status": "Delivered",                       // Pending|Preparing|On The Way|Delivered|Cancelled
  "payment_id": "ObjectId(payment-intg._id)",  // -> payment-intg

  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

Indexes (KEY for the analytics feature):
  - `{ user_id: 1, created_at: -1 }`       -> fast per-user date-range scans
  - `{ user_id: 1, created_at: -1, status: 1 }` -> covering index for status filters
  - `{ restaurant_id: 1 }`, `{ status: 1 }`

## 5. `payment-intg` — payment records

One payment record per completed order; `order-summary.payment_id` points
here. Keep all payment-gateway metadata for reconciliation.

```json
{
  "_id": "ObjectId",
  "order_id": "ObjectId(order-summary._id)",   // -> order-summary
  "user_id": "ObjectId(login._id)",            // -> login
  "method": "bKash",                           // Cash on Delivery | bKash | Nagad | Card | Stripe
  "amount": 21.97,
  "currency": "BDT",
  "status": "completed",                       // pending | completed | failed | refunded
  "transaction_id": "TXN-XXXXX",
  "gateway_response": {},
  "created_at": "ISODate"
}
```

Indexes: index on `order_id` (unique); index on `user_id`.

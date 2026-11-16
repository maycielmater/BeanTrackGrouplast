# BeanTrack

Coffee Shop Ordering, Inventory, and Stock Management System built with Node.js, Express, Sequelize, MySQL, Handlebars `.xian` views.

## Included modules
- Customer kiosk ordering
- Admin dashboard and product/photo management
- Order list and status management
- Ingredient inventory and stock adjustments
- Product recipes (ingredients used per serving)
- Automatic ingredient deduction when a kiosk order is placed
- Supplier records and purchasing
- Purchase receiving automatically increases ingredient stock
- Login, registration, and admin/customer roles

## Requirements
- Node.js (LTS recommended)
- MySQL / Laragon
- npm

## Setup
1. Create a MySQL database:
   ```sql
   CREATE DATABASE beantrack;
   ```
2. Copy `.env.example` to `.env` and enter your MySQL password if needed.
3. Install packages:
   ```powershell
   npm install
   ```
4. Start:
   ```powershell
   npm run xian
   ```
5. Open `http://localhost:3000`.

## Create the first admin
Registration intentionally creates customer accounts only. Register a normal account first, then promote that account to admin using your MySQL client:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Log out and log in again. Admin dashboard is at `/admin`.

## Important workflow
1. Admin adds products under Products.
2. Admin adds ingredients under Inventory.
3. Admin creates each product's recipe under Recipes (quantity of each ingredient used for one serving).
4. Customer orders from `/kiosk`.
5. Ingredient stock is automatically deducted using the recipe.
6. Admin records received purchases under Purchasing; the received quantity is added to stock.

## Notes
- One shared MySQL database is used by all modules.
- The project uses standard Express routes and server-rendered Handlebars templates with the `.xian` extension; it does not require a JSON API.
- Automatic stock deduction only happens for ingredients configured in Recipes. Products without recipe entries will not deduct ingredient stock.
- This is a classroom starter project. Before public deployment, add production session storage, CSRF protection, stronger validation, database backups, and a proper cancellation/refund stock-restoration workflow.

# Alzafar Backend

A large-scale, enterprise-grade REST API for an e-commerce mobile application and admin panel.

## Technology Stack
- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **Security**: Role-Based Access Control (RBAC)
- **Validation**: class-validator & class-transformer

## Project Structure
```text
src/
├── auth/           # Authentication logic (Login, Register, JWT Strategy)
├── users/          # User management & Schema (Customer, Admin)
├── products/       # Product catalog & Inventory management
├── categories/     # Product categorization
├── orders/         # Checkout and order history
├── common/         # Shared Guards, Decorators, Filters, and Utils
└── app.module.ts   # Root module linking all components
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or on Atlas)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/alzafar
   JWT_SECRET=your_secret_key
   JWT_EXPIRATION=7d
   ```

### Running the App
```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Features
- **Swagger Documentation**: Available at `/api/docs`
- **Containerization**: Fully Dockerized for development and production.
- **Public Routes**: Product listing, search, category browsing.
- **Customer Routes**: Profile management, order placement (Firebase protected).
- **Admin Routes**: Full CRUD on products, categories, and order management (Firebase + Role protected).

## Docker Development
To start the entire stack (Node.js + MongoDB):
```bash
docker-compose up --build
```

## API Documentation
The API is fully documented using Swagger. Once the app is running, visit:
`http://localhost:3000/api/docs`

## Admin Access
To create an admin user, register via `/auth/register` with `role: "admin"`. In production, this should be restricted via an `ADMIN_SECRET` or manual database entry.

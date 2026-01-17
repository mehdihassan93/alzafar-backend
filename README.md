# Al-Zafar Enterprise Backend 🚀

A high-performance, secure, and scalable RESTful API built for a premium E-commerce platform. Designed for mobile app integration and administrative oversight.

## 🏗️ Technical Architecture

- **Core**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM) with Optimized Indexes & Text Search.
- **Identity**: [Firebase Admin SDK](https://firebase.google.com/docs/admin) (Secure Token Verification & IAM).
- **Media**: [AWS S3 / DigitalOcean Spaces](https://aws.amazon.com/s3/) with automated WebP Image Processing (Sharp).
- **Communications**: [Transactional Emails](https://nodemailer.com/) via Handlebars templating.
- **Security**: 
  - Role-Based Access Control (RBAC).
  - NoSQL Injection Protection.
  - Global Request Timeout & Helmet.js security headers.
  - Comprehensive Rate Limiting (Fraud Detection).

## 🌟 Key Features

- **🛒 Smart E-commerce**: Full cart, wishlist, and inventory-aware order management.
- **🖼️ Intelligent Media**: Automatic image tiering (Large/Medium/Thumbnail) on upload.
- **🎫 Dynamic Coupons**: Category-specific and amount-based discount validation.
- **📈 Admin BI Dashboard**: Advanced analytics for revenue, top sellers, and low stock alerts.
- **📩 Transactional Lifecycle**: Automated emails for welcome, order confirmations, and status updates.
- **📉 Price Drop Alerts**: Automatic notifications to wishlist users when prices change.

## 📂 Project Structure

```text
src/
├── analytics/      # Admin Business Intelligence & Revenue metrics
├── auth/           # Firebase Token validation & Guard logic
├── email/          # Transactional email service & HBS templates
├── media/          # S3 Uploads & Image processing pipeline
├── orders/         # Inventory-aware checkout & order timeline
├── products/       # Search-indexed catalog with rating denormalization
├── common/         # Global Pipes, Interceptors, Filters, and Guards
└── health/         # System health & Connectivity monitoring
```

## 🛠️ Getting Started

### Environment Configuration
Create a `.env` file in the root directory:

```env
# Server
PORT=3000
MONGODB_URI=mongodb+srv://<your-mongodb-uri>

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."

# AWS S3 / Media
AWS_S3_REGION=...
AWS_S3_ACCESS_KEY=...
AWS_S3_SECRET_KEY=...
AWS_S3_BUCKET=...

# Email (SMTP)
MAIL_HOST=...
MAIL_PORT=587
MAIL_USER=...
MAIL_PASS=...
MAIL_FROM="Al-Zafar Team <noreply@alzafar.com>"
```

### Installation & Execution
```bash
npm install
npm run start:dev        # Development mode
npm test                 # Run core test suite
```

## 📚 Documentation
The API is fully documented with **Swagger**. Explore interactive endpoints, schemas, and authentication details:
👉 `http://localhost:3000/api/docs`

## 🛡️ Stability & Performance
- **99.9% Resilient**: Global exception filters and health checks.
- **Ultra-Fast**: Optimized `.lean()` queries and rating denormalization for O(1) read performance.
- **Audit Ready**: Every order includes a status timeline with audit trails.

---
Built with ❤️ for Al-Zafar.

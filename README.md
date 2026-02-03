markdown
# Agriculture Consultation Platform - Backend

A robust backend for the Consultation-Driven Agriculture Platform built with Hono and TypeScript.

## Features

- **User Authentication**: Register/login with email/phone, JWT-based auth
- **Services Management**: CRUD for agricultural consultation services
- **Booking System**: Time slot management with conflict resolution
- **Payment Integration**: M-Pesa Daraja API integration for payments
- **Notifications**: In-app notifications system with SMS/email support
- **Admin Dashboard**: Complete admin panel for content and operations
- **Public API**: Public endpoints for website content

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Hono (lightweight, fast web framework)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with bcrypt password hashing
- **Payments**: M-Pesa Daraja API
- **Validation**: Zod schema validation

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agriculture-consultation-backend
Install dependencies

bash
npm install
Set up environment variables

bash
cp .env.example .env
# Edit .env with your configuration
Set up database

Create a Supabase project

Run the SQL schema from database/schema.sql

Update Supabase credentials in .env

Run the server

bash
# Development
npm run dev

# Production
npm run build
npm start
API Documentation
Authentication
POST /api/auth/register - Register new user

POST /api/auth/login - Login user

GET /api/auth/profile - Get user profile

Services
GET /api/public/services - Get all services (public)

POST /api/services - Create service (admin)

PATCH /api/services/:id - Update service (admin)

Bookings
GET /api/bookings/slots - Get available time slots

POST /api/bookings - Create booking

GET /api/bookings - Get user bookings

Payments
POST /api/payments/initiate - Initiate M-Pesa payment

POST /api/payments/callback - Daraja payment callback

Admin
GET /api/admin/dashboard/stats - Get dashboard statistics

Various CRUD endpoints for content management

Project Structure
text
backend/
├── src/
│   ├── controllers/     # Business logic
│   ├── routes/         # API route definitions
│   ├── middleware/     # Auth and validation middleware
│   ├── db/            # Database client and queries
│   ├── utils/         # Helper functions
│   └── index.ts       # Main application
├── package.json
└── tsconfig.json
Security Features
Password hashing with bcrypt

JWT token-based authentication

Role-based access control (admin/client)

Input validation with Zod

CORS configuration

SQL injection prevention via Supabase

Deployment
Build the application

bash
npm run build
Set production environment variables

Deploy to your preferred platform

Vercel

Railway

Render

AWS/GCP/Azure

Testing
bash
# Coming soon: Add test suite
Contributing
Fork the repository

Create a feature branch

Make your changes

Add tests if applicable

Submit a pull request

License
MIT

text

This backend implementation provides:

1. **Complete authentication system** with JWT and role-based access
2. **Booking system** with time slot conflict resolution
3. **Payment integration** ready for M-Pesa Daraja
4. **Notifications system** with in-app and SMS capabilities
5. **Admin panel** for full content management
6. **Public API** for website content
7. **Robust validation** with Zod schemas
8. **Database integration** with your Supabase schema

Key features implemented:
- User registration/login with phone/email
- Service and crop management
- Booking creation with availability checking
- Payment processing (with Daraja integration points)
- Notifications system
- Admin dashboard with stats
- Public endpoints for website content
- Proper error handling and validation

The system is modular, scalable, and follows best practices for a production-ready backend. You can extend it with additional features like email notifications, analytics, or more complex scheduling logic as needed.
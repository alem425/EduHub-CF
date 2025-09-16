# EDU Platform Backend API

A Node.js/Express API for managing courses and enrollments using Azure Cosmos DB.

## Features

- ✅ Course management (CRUD operations)
- ✅ Student enrollment system
- ✅ Azure Cosmos DB integration
- ✅ TypeScript support
- ✅ Input validation with Joi
- ✅ Security middleware (Helmet, CORS, Rate limiting)
- 🔄 Authentication (JWT ready)
- 🔄 Role-based authorization

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
cp env.example .env
# Edit .env with your Azure Cosmos DB credentials
```

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Courses

- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course (teacher only)
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/students` - List enrolled students

### Health Check

- `GET /health` - API health status

## Sample API Usage

### List All Courses

```bash
curl http://localhost:3001/api/courses
```

### Create a Course

```bash
curl -X POST http://localhost:3001/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to JavaScript",
    "description": "Learn the basics of JavaScript programming",
    "instructorId": "instructor-123",
    "instructorName": "John Doe",
    "category": "Programming",
    "level": "beginner",
    "duration": 40,
    "maxStudents": 30,
    "tags": ["javascript", "programming", "web-development"]
  }'
```

### Enroll in a Course

```bash
curl -X POST http://localhost:3001/api/courses/course-id/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-123",
    "studentName": "Jane Smith",
    "studentEmail": "jane@example.com"
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts         # Cosmos DB configuration
│   ├── controllers/
│   │   └── courseController.ts # Course API controllers
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── models/
│   │   └── Course.ts          # Data models
│   ├── routes/
│   │   └── courseRoutes.ts    # Express routes
│   ├── services/
│   │   └── courseService.ts   # Business logic
│   └── server.ts              # Express server setup
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps

1. **Set up Azure Cosmos DB** (see AZURE_SETUP.md)
2. **Add Authentication** (JWT middleware ready)
3. **Add User Management** endpoints
4. **Integrate with Frontend**
5. **Add Testing** (Jest setup included)
6. **Deploy to Azure App Service**

## Environment Variables

Copy `env.example` to `.env` and configure:

- `COSMOS_DB_ENDPOINT` - Your Cosmos DB endpoint URL
- `COSMOS_DB_KEY` - Your Cosmos DB primary key
- `COSMOS_DB_DATABASE_ID` - Database name (default: EduDB)
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

# API Testing Guide

## Prerequisites

1. **Create `.env` file** (copy from `env.example`):

   ```bash
   cp env.example .env
   ```

2. **Update `.env` with your Azure Cosmos DB credentials**:

   ```
   COSMOS_DB_ENDPOINT=https://your-cosmosdb-account.documents.azure.com:443/
   COSMOS_DB_KEY=your-primary-key-here
   COSMOS_DB_DATABASE_ID=EduDB
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Step 1: Start the Server

```bash
npm run dev
```

You should see:

```
🚀 Server running on port 3001
📊 Health check: http://localhost:3001/health
📚 Courses API: http://localhost:3001/api/courses
Database and containers initialized successfully
```

## Step 2: Test API Endpoints

### Option A: Use the Test Script

```bash
node test-api.js
```

### Option B: Manual Testing with curl

#### 1. Health Check

```bash
curl http://localhost:3001/health
```

#### 2. Get All Courses (initially empty)

```bash
curl http://localhost:3001/api/courses
```

#### 3. Create a Course

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

#### 4. Get All Courses (should show your course)

```bash
curl http://localhost:3001/api/courses
```

#### 5. Enroll a Student (replace COURSE_ID with actual ID from step 3)

```bash
curl -X POST http://localhost:3001/api/courses/COURSE_ID/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-456",
    "studentName": "Jane Smith",
    "studentEmail": "jane.smith@example.com"
  }'
```

#### 6. Get Enrolled Students

```bash
curl http://localhost:3001/api/courses/COURSE_ID/students
```

### Option C: Use Postman or Thunder Client

Import the following requests:

1. **GET** `http://localhost:3001/health`
2. **GET** `http://localhost:3001/api/courses`
3. **POST** `http://localhost:3001/api/courses` (with JSON body from step 3 above)
4. **POST** `http://localhost:3001/api/courses/{courseId}/enroll` (with enrollment JSON)
5. **GET** `http://localhost:3001/api/courses/{courseId}/students`

## Expected Results

### Health Check Response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Course Creation Response:

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "generated-uuid",
    "title": "Introduction to JavaScript",
    "description": "Learn the basics of JavaScript programming",
    "instructorId": "instructor-123",
    "instructorName": "John Doe",
    "category": "Programming",
    "level": "beginner",
    "duration": 40,
    "maxStudents": 30,
    "currentEnrollments": 0,
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z",
    "tags": ["javascript", "programming", "web-development"]
  }
}
```

### Enrollment Response:

```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "id": "enrollment-uuid",
    "courseId": "course-uuid",
    "studentId": "student-456",
    "studentName": "Jane Smith",
    "studentEmail": "jane.smith@example.com",
    "enrolledAt": "2024-01-01T12:00:00.000Z",
    "status": "enrolled",
    "progress": 0
  }
}
```

## Troubleshooting

### Server Won't Start

- Check `.env` file has correct Cosmos DB credentials
- Ensure Cosmos DB account is accessible
- Check if port 3001 is available

### Database Connection Issues

- Verify Cosmos DB endpoint URL format
- Check primary key is correct
- Ensure Cosmos DB account has proper permissions

### API Errors

- Check request format (JSON, headers)
- Verify endpoint URLs
- Look at server console for detailed error messages

## Verification Checklist

- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Can create courses
- [ ] Can retrieve courses
- [ ] Can enroll students
- [ ] Can get enrolled students
- [ ] Data persists in Cosmos DB
- [ ] Validation works (try invalid data)

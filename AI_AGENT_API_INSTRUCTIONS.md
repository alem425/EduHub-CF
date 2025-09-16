# AI Agent API Instructions - EDU Platform Backend API

## Base URL

`https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net`

## 🤖 AI Agent Optimization

**This API is optimized for AI agents** with static URLs and clear parameter schemas. All endpoints use either:

- **Static URLs** with no placeholders
- **Query parameters** (`?param=value`)
- **Request body parameters** (JSON)

**No URL path parameters** with `{}` placeholders that cause issues for AI agents.

---

## Database Structure Overview

### Collections:

1. **Courses**: Store course information with embedded student enrollment data
2. **Enrollments**: Individual enrollment records (for detailed tracking)
3. **Students**: Student profiles with their enrolled courses
4. **Users**: User authentication and profile data

### Course Data Structure:

- `maxStudents`: Maximum allowed students
- `currentEnrollments`: Current count of enrolled students
- `enrolledStudents`: Array with student names and UIDs directly in course

---

## Available Endpoints

### 1. Health Check Endpoint

**URL**: `/health`  
**Method**: GET  
**Purpose**: Basic connectivity and service health verification

#### When to Use:

- ✅ **First call** in any workflow to verify service availability
- ✅ Before making any complex operations
- ✅ Troubleshooting connectivity issues
- ✅ Simple "is the service running?" checks

#### Decision Logic:

```
IF starting any workflow THEN call /health first
IF other endpoints fail THEN call /health to verify service status
IF need to check basic connectivity THEN use /health
```

#### No Parameters Required:

```json
{}
```

#### Expected Response:

```json
{
  "status": "OK",
  "timestamp": "2025-09-16T04:07:56.179Z"
}
```

---

### 2. Get All Courses Endpoint

**URL**: `/api/courses`  
**Method**: GET  
**Purpose**: Retrieve complete course catalog with enrollment information

#### When to Use:

- ✅ **Before creating courses** to avoid duplicates
- ✅ **Before enrolling students** to get course IDs and check capacity
- ✅ Displaying course listings to users
- ✅ Checking database read operations
- ✅ Getting course IDs for enrollment operations

#### Decision Logic:

```
IF need to see available courses THEN call GET /api/courses
IF need course ID for enrollment THEN call GET /api/courses first
IF want to check enrollment capacity THEN call GET /api/courses
IF creating courses THEN call GET /api/courses first to avoid duplicates
```

#### No Parameters Required:

```json
{}
```

#### Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "course-123",
      "title": "Introduction to JavaScript",
      "description": "Learn the basics of JavaScript programming",
      "instructorId": "instructor-123",
      "instructorName": "John Doe",
      "category": "Programming",
      "level": "beginner",
      "duration": 40,
      "maxStudents": 30,
      "currentEnrollments": 5,
      "enrolledStudents": [
        {
          "studentId": "student-001",
          "studentName": "Alice Johnson",
          "enrolledAt": "2025-09-16T04:10:00.000Z"
        }
      ],
      "isActive": true,
      "tags": ["javascript", "programming", "web-development"],
      "createdAt": "2025-09-16T04:10:00.000Z",
      "updatedAt": "2025-09-16T04:15:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Create Course Endpoint

**URL**: `/api/courses`  
**Method**: POST  
**Purpose**: Create a new course in the system

#### When to Use:

- ✅ Adding new courses to the catalog
- ✅ **After checking existing courses** to avoid duplicates
- ✅ Testing database write operations
- ✅ Setting up test scenarios with known course data

#### Decision Logic:

```
IF need new course for testing THEN create course after checking existing ones
IF setting up enrollment scenarios THEN create course first, save courseId
IF need specific course configuration THEN create custom course
IF testing write operations THEN create course after health check
```

#### Required Parameters Schema:

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Course title/name (3-100 characters). Should be descriptive and unique."
    },
    "description": {
      "type": "string",
      "description": "Detailed course description (10-1000 characters). Explain what students will learn."
    },
    "instructorId": {
      "type": "string",
      "description": "Unique instructor identifier. Use a unique string like 'instructor-123'."
    },
    "instructorName": {
      "type": "string",
      "description": "Instructor's full display name. This will be shown to students."
    },
    "category": {
      "type": "string",
      "description": "Course category (e.g., 'Programming', 'Design', 'Business'). Used for organization."
    },
    "level": {
      "type": "string",
      "description": "Course difficulty level. Must be exactly: 'beginner', 'intermediate', or 'advanced'."
    },
    "duration": {
      "type": "number",
      "description": "Course duration in hours. Must be a positive number."
    },
    "maxStudents": {
      "type": "number",
      "description": "Maximum number of students allowed to enroll. Must be a positive number."
    },
    "isActive": {
      "type": "boolean",
      "description": "Whether the course is active and available for enrollment. Optional, defaults to true."
    },
    "tags": {
      "type": "array",
      "description": "Array of relevant tags for the course. Optional. Example: ['javascript', 'frontend', 'web']."
    },
    "syllabus": {
      "type": "array",
      "description": "Array of lesson/module titles. Optional. Example: ['Lesson 1: Introduction', 'Lesson 2: Variables']."
    },
    "prerequisites": {
      "type": "array",
      "description": "Array of prerequisite course titles or skills. Optional."
    }
  },
  "required": [
    "title",
    "description",
    "instructorId",
    "instructorName",
    "category",
    "level",
    "duration",
    "maxStudents"
  ]
}
```

#### Example Request:

```json
{
  "title": "Advanced React Development",
  "description": "Master advanced React concepts including hooks, context, and performance optimization",
  "instructorId": "instructor-456",
  "instructorName": "Sarah Johnson",
  "category": "Web Development",
  "level": "advanced",
  "duration": 60,
  "maxStudents": 25,
  "tags": ["react", "javascript", "frontend", "hooks", "performance"]
}
```

#### Expected Response:

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "course-456",
    "title": "Advanced React Development",
    "maxStudents": 25,
    "currentEnrollments": 0,
    "enrolledStudents": [],
    "createdAt": "2025-09-16T04:15:00.000Z"
  }
}
```

---

### 4. Enroll Student Endpoint (AI Agent Optimized)

**URL**: `/api/courses/enroll`  
**Method**: POST  
**Purpose**: Enroll a student in a course using request body for all parameters

#### When to Use:

- ✅ **After verifying course exists and has capacity**
- ✅ Student registration workflows
- ✅ Testing enrollment functionality
- ✅ Creating test data with enrolled students
- ✅ **Preferred for AI agents** - no URL parameters needed

#### Decision Logic:

```
IF need to enroll student THEN:
  1. Call GET /api/courses to verify course exists and has capacity
  2. Check currentEnrollments < maxStudents
  3. Call POST /api/courses/enroll with courseId in request body

IF testing enrollment limits THEN:
  1. Create course with low maxStudents
  2. Enroll students until capacity reached
  3. Test enrollment rejection
```

#### Required Parameters Schema:

```json
{
  "type": "object",
  "properties": {
    "courseId": {
      "type": "string",
      "description": "Unique identifier of the course to enroll the student in. Obtain this from the course creation response or GET /api/courses endpoint."
    },
    "studentId": {
      "type": "string",
      "description": "Unique identifier for the student (UID). This should be a unique string that will serve as the primary key for the student in the database."
    },
    "studentName": {
      "type": "string",
      "description": "Full display name of the student. This will be stored in both the course's enrolledStudents array and the student's profile document."
    },
    "studentEmail": {
      "type": "string",
      "description": "Valid email address for the student. Must be a properly formatted email address. This will be used for the student's profile and must be unique per student."
    }
  },
  "required": ["courseId", "studentId", "studentName", "studentEmail"]
}
```

#### Example Request:

```json
{
  "courseId": "course-456",
  "studentId": "student-789",
  "studentName": "Alex Chen",
  "studentEmail": "alex.chen@email.com"
}
```

#### Expected Response:

```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "id": "enrollment-123",
    "courseId": "course-456",
    "studentId": "student-789",
    "studentName": "Alex Chen",
    "studentEmail": "alex.chen@email.com",
    "enrolledAt": "2025-09-16T04:20:00.000Z",
    "status": "enrolled",
    "progress": 0
  }
}
```

---

### 5. Get Course Students Endpoint (AI Agent Optimized)

**URL**: `/api/courses/students?courseId={courseId}`  
**Method**: GET  
**Purpose**: Get enrolled students using query parameter

#### When to Use:

- ✅ **After enrolling students** to verify enrollment worked
- ✅ Viewing course enrollment lists
- ✅ Checking enrollment capacity and current count
- ✅ Generating course rosters
- ✅ **Preferred for AI agents** - uses query parameter instead of URL path

#### Decision Logic:

```
IF need to verify enrollment worked THEN call after enrollment
IF need student list for course THEN use this endpoint
IF checking course capacity THEN call to see current enrollments
IF course management task THEN use to see enrolled students
```

#### Query Parameter Setup:

- **Parameter Type**: `Url` (query parameter)
- **Parameter Name**: `courseId`
- **Parameter Value**: Use actual course ID (e.g., `course-456`)

#### Parameter Schema:

```json
{
  "type": "object",
  "properties": {
    "courseId": {
      "type": "string",
      "description": "Unique identifier of the course to retrieve enrolled students for. This should be a valid course ID that exists in the database, typically obtained from the course creation response or from the GET /api/courses endpoint. Pass this as a query parameter: ?courseId=your-course-id"
    }
  },
  "required": ["courseId"]
}
```

#### Example URL:

```
https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/courses/students?courseId=course-456
```

#### Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-123",
      "courseId": "course-456",
      "studentId": "student-789",
      "studentName": "Alex Chen",
      "studentEmail": "alex.chen@email.com",
      "enrolledAt": "2025-09-16T04:20:00.000Z",
      "status": "enrolled",
      "progress": 0
    }
  ],
  "count": 1
}
```

---

### 6. Get All Students Endpoint

**URL**: `/api/students`  
**Method**: GET  
**Purpose**: Retrieve all student profiles with their enrolled courses

#### When to Use:

- ✅ **After enrollment operations** to verify student documents were created
- ✅ Student management and reporting
- ✅ Checking cross-course enrollment patterns
- ✅ Verifying student data integrity

#### Decision Logic:

```
IF need to see all students in system THEN call GET /api/students
IF want to verify student documents created THEN call after enrollment
IF need student database overview THEN use this endpoint
IF checking student enrollment patterns THEN call this endpoint
```

#### No Parameters Required:

```json
{}
```

#### Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "student-789",
      "name": "Alex Chen",
      "email": "alex.chen@email.com",
      "enrolledCourses": ["course-456", "course-123"],
      "createdAt": "2025-09-16T04:20:00.000Z",
      "updatedAt": "2025-09-16T04:25:00.000Z",
      "isActive": true
    }
  ],
  "count": 1
}
```

---

### 7. Get Student by ID Endpoint (AI Agent Optimized)

**URL**: `/api/students/profile?studentId={studentId}`  
**Method**: GET  
**Purpose**: Get specific student using query parameter

#### When to Use:

- ✅ **After creating specific student** to verify their data
- ✅ Looking up individual student information
- ✅ Checking specific student's enrollment history
- ✅ Student profile management
- ✅ **Preferred for AI agents** - uses query parameter instead of URL path

#### Decision Logic:

```
IF need specific student details THEN call GET /api/students/profile?studentId=X
IF verifying student creation THEN call after enrollment with studentId
IF need student's course list THEN use this endpoint
IF student profile lookup THEN use this endpoint
```

#### Query Parameter Setup:

- **Parameter Type**: `Url` (query parameter)
- **Parameter Name**: `studentId`
- **Parameter Value**: Use actual student ID (e.g., `student-789`)

#### Parameter Schema:

```json
{
  "type": "object",
  "properties": {
    "studentId": {
      "type": "string",
      "description": "Unique identifier of the student to retrieve. This should be a valid student ID/UID that exists in the database, typically obtained from enrollment operations or student listings. Pass this as a query parameter: ?studentId=your-student-id"
    }
  },
  "required": ["studentId"]
}
```

#### Example URL:

```
https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/students/profile?studentId=student-789
```

#### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "student-789",
    "name": "Alex Chen",
    "email": "alex.chen@email.com",
    "enrolledCourses": ["course-456"],
    "createdAt": "2025-09-16T04:20:00.000Z",
    "updatedAt": "2025-09-16T04:20:00.000Z",
    "isActive": true
  }
}
```

---

## Comprehensive Decision Tree

### **Starting Any Workflow:**

```
1. Call GET /health (verify service)
2. IF health OK THEN proceed with workflow
3. IF health fails THEN stop and report connectivity issue
```

### **Course Management Workflow:**

```
1. GET /health (verify service)
2. GET /api/courses (check existing courses)
3. IF need new course THEN POST /api/courses
4. IF need to see course details THEN use course data from GET response
```

### **Student Enrollment Workflow:**

```
1. GET /health (verify service)
2. GET /api/courses (find target course and check capacity)
3. IF course exists AND has capacity THEN POST /api/courses/enroll
4. GET /api/courses/students?courseId=X (verify enrollment)
5. GET /api/students/profile?studentId=X (verify student document created)
```

### **Data Verification Workflow:**

```
1. GET /health (verify service)
2. GET /api/courses (check course data integrity)
3. GET /api/students (check student data integrity)
4. For each course: GET /api/courses/students?courseId=X (verify enrollments)
```

### **Testing Database Operations:**

```
1. GET /health (verify service)
2. GET /api/courses (test read operations)
3. POST /api/courses (test write operations)
4. POST /api/courses/enroll (test complex operations)
5. GET /api/students (verify cross-collection updates)
```

---

## Error Handling Guide

### **400 Bad Request:**

- **Cause**: Missing required fields, invalid data types, validation errors
- **Action**: Check request body against parameter schema
- **Common Issues**: Invalid email format, missing required fields, wrong data types

### **404 Not Found:**

- **Cause**: Course ID doesn't exist, student ID doesn't exist
- **Action**: Call GET /api/courses to verify course exists
- **Next Step**: Use valid ID from course listing

### **500 Internal Server Error:**

- **Cause**: Database connectivity issues, server errors
- **Action**: Call GET /health to verify service status
- **Next Step**: If health fails, wait and retry; if health OK, check request format

---

## Best Practices for AI Agents

### **Always Follow This Order:**

1. **Health Check First**: Every workflow starts with GET /health
2. **Read Before Write**: Call GET endpoints before POST operations
3. **Verify Results**: Call GET endpoints after POST operations to confirm success
4. **Save Important IDs**: Store courseId and studentId for subsequent operations

### **Data Integrity Practices:**

1. **Check Course Capacity**: Verify currentEnrollments < maxStudents before enrollment
2. **Use Meaningful Data**: Create courses with realistic titles and descriptions
3. **Unique Identifiers**: Use unique studentId values to avoid conflicts
4. **Track Operations**: Store operation results for debugging and verification

### **AI Agent Workflow Patterns:**

#### **Simple Testing:**

```
GET /health → GET /api/courses → POST /api/courses → GET /api/courses
```

#### **Complete Enrollment Test:**

```
GET /health → GET /api/courses → POST /api/courses →
POST /api/courses/enroll → GET /api/courses/students?courseId=X →
GET /api/students
```

#### **Data Verification:**

```
GET /health → GET /api/courses → GET /api/students →
GET /api/students/profile?studentId=X → GET /api/courses/students?courseId=X
```

---

## 🎯 AI Agent Quick Reference

### **Static URLs (No placeholders):**

✅ `/health`  
✅ `/api/courses`  
✅ `/api/students`  
✅ `/api/courses/enroll`

### **Query Parameter URLs:**

✅ `/api/courses/students?courseId=COURSE_ID`  
✅ `/api/students/profile?studentId=STUDENT_ID`

### **Parameter Types for AI Agents:**

- **No Parameters**: Health check, get all courses, get all students
- **Request Body**: Course creation, student enrollment
- **Query Parameters**: Get course students, get student by ID

### **Common Parameter Values:**

- **Course IDs**: `course-123`, `course-456` (from course creation responses)
- **Student IDs**: `student-001`, `student-789` (unique identifiers you create)
- **Emails**: Must be valid format (e.g., `student@example.com`)

---

## Database Integration Notes

- **Enrollment creates/updates 3 collections**: Course (enrolledStudents array), Enrollments (individual records), Students (profile with enrolled courses)
- **Course capacity tracking**: Both currentEnrollments count and enrolledStudents array are maintained
- **Student profiles**: Automatically created during first enrollment, updated for subsequent enrollments
- **Data consistency**: All related documents are updated atomically during enrollment operations

The API uses Azure Cosmos DB for data persistence and supports CORS for web browser access. All POST requests require proper JSON formatting and Content-Type headers.

All endpoints are optimized for AI agents with static URLs, clear parameter schemas, and comprehensive error handling.

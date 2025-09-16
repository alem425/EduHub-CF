# AI Agent API Instructions - EDU Platform Backend API

## Available Endpoints

### 1. Health Check Endpoint

**URL**: `https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/health`  
**Method**: GET  
**Purpose**: Basic connectivity and health testing

#### When to Use:

- Initial connectivity tests
- Health checks before making other requests
- Verify the service is online and responding
- Simple "are you there?" checks

#### Expected Response:

```json
{
  "status": "OK",
  "timestamp": "2025-09-16T04:07:56.179Z"
}
```

#### No Parameters Required:

```json
{}
```

---

### 2. Get All Courses Endpoint

**URL**: `https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/courses`  
**Method**: GET  
**Purpose**: Retrieve all available courses from the database

#### When to Use:

- Fetch complete course catalog
- Display course listings to users
- Verify database connectivity
- Check available course data

#### Expected Response:

```json
[
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
    "currentStudents": 0,
    "tags": ["javascript", "programming", "web-development"],
    "createdAt": "2025-09-16T04:10:00.000Z"
  }
]
```

#### No Parameters Required:

```json
{}
```

---

### 3. Create Course Endpoint

**URL**: `https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/courses`  
**Method**: POST  
**Purpose**: Create a new course in the system

#### When to Use:

- Adding new courses to the catalog
- Testing database write operations
- Bulk course creation
- Course management operations

#### Parameter Schema (Required):

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Course title/name"
    },
    "description": {
      "type": "string",
      "description": "Detailed course description"
    },
    "instructorId": {
      "type": "string",
      "description": "Unique instructor identifier"
    },
    "instructorName": {
      "type": "string",
      "description": "Instructor's display name"
    },
    "category": {
      "type": "string",
      "description": "Course category (e.g., 'Programming', 'Design')"
    },
    "level": {
      "type": "string",
      "enum": ["beginner", "intermediate", "advanced"],
      "description": "Course difficulty level"
    },
    "duration": {
      "type": "number",
      "description": "Course duration in hours"
    },
    "maxStudents": {
      "type": "number",
      "description": "Maximum number of students allowed"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Array of relevant tags for the course"
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

#### Example Valid Request:

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
    "id": "generated-course-id",
    "title": "Advanced React Development",
    "description": "Master advanced React concepts...",
    "instructorId": "instructor-456",
    "instructorName": "Sarah Johnson",
    "category": "Web Development",
    "level": "advanced",
    "duration": 60,
    "maxStudents": 25,
    "currentStudents": 0,
    "tags": ["react", "javascript", "frontend", "hooks", "performance"],
    "createdAt": "2025-09-16T04:15:00.000Z"
  }
}
```

---

### 4. Enroll Student Endpoint

**URL**: `https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/courses/{courseId}/enroll`  
**Method**: POST  
**Purpose**: Enroll a student in a specific course

#### When to Use:

- Student registration for courses
- Testing enrollment functionality
- Managing course capacity
- Student management operations

#### URL Parameters:

- `{courseId}`: Replace with actual course ID from course creation/listing

#### Parameter Schema (Required):

```json
{
  "type": "object",
  "properties": {
    "studentId": {
      "type": "string",
      "description": "Unique student identifier"
    },
    "studentName": {
      "type": "string",
      "description": "Student's full name"
    },
    "studentEmail": {
      "type": "string",
      "format": "email",
      "description": "Student's email address"
    }
  },
  "required": ["studentId", "studentName", "studentEmail"]
}
```

#### Example Valid Request:

```json
{
  "studentId": "student-789",
  "studentName": "Alex Chen",
  "studentEmail": "alex.chen@email.com"
}
```

#### Expected Response:

```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "enrollmentId": "enrollment-123",
    "courseId": "course-456",
    "studentId": "student-789",
    "studentName": "Alex Chen",
    "studentEmail": "alex.chen@email.com",
    "enrolledAt": "2025-09-16T04:20:00.000Z"
  }
}
```

---

### 5. Get Course Students Endpoint

**URL**: `https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/courses/{courseId}/students`  
**Method**: GET  
**Purpose**: Retrieve all students enrolled in a specific course

#### When to Use:

- View course enrollment lists
- Check enrollment capacity
- Student management
- Generate course rosters

#### URL Parameters:

- `{courseId}`: Replace with actual course ID

#### Expected Response:

```json
{
  "success": true,
  "data": {
    "courseId": "course-456",
    "courseTitle": "Advanced React Development",
    "totalStudents": 2,
    "maxStudents": 25,
    "students": [
      {
        "enrollmentId": "enrollment-123",
        "studentId": "student-789",
        "studentName": "Alex Chen",
        "studentEmail": "alex.chen@email.com",
        "enrolledAt": "2025-09-16T04:20:00.000Z"
      }
    ]
  }
}
```

#### No Parameters Required:

```json
{}
```

---

## Usage Decision Tree

### Use GET /health when:

- ✅ Testing basic connectivity
- ✅ Performing health checks before API operations
- ✅ Verifying service availability
- ✅ No data needs to be sent or tested

### Use GET /api/courses when:

- ✅ Retrieving course catalog
- ✅ Testing database connectivity
- ✅ Checking available courses before enrollment
- ✅ Displaying course listings

### Use POST /api/courses when:

- ✅ Creating new courses
- ✅ Testing database write operations
- ✅ Course management tasks
- ✅ Bulk course creation

### Use POST /api/courses/{courseId}/enroll when:

- ✅ Enrolling students in courses
- ✅ Testing enrollment workflow
- ✅ Managing student registrations
- ✅ Need a valid courseId from previous course creation

### Use GET /api/courses/{courseId}/students when:

- ✅ Viewing enrollment lists
- ✅ Checking course capacity
- ✅ Student management tasks
- ✅ Need a valid courseId with existing enrollments

---

## Implementation Examples

### **Basic Workflow:**

1. **Health Check**: Call GET /health to verify service availability
2. **View Courses**: Call GET /api/courses to see existing courses
3. **Create Course**: Call POST /api/courses to add new course
4. **Enroll Student**: Call POST /api/courses/{courseId}/enroll
5. **View Enrollments**: Call GET /api/courses/{courseId}/students

### **Database Testing Flow:**

1. Call GET /health to ensure service is online
2. Call GET /api/courses to test database read operations
3. Call POST /api/courses to test database write operations
4. Verify course creation by calling GET /api/courses again

### **Error Handling:**

- **400 Response**: Bad request - check required fields and data types
- **404 Response**: Course not found - verify courseId exists
- **500 Response**: Server error - check database connectivity
- **Network Error**: Service unavailable - try GET /health first

---

## **Best Practices for AI Agents:**

1. **Always start with health check**: Verify connectivity before complex operations
2. **Check existing data first**: Call GET /api/courses before creating to avoid duplicates
3. **Save course IDs**: Store courseId from course creation for enrollment operations
4. **Validate before enrollment**: Ensure course exists and has capacity
5. **Use meaningful data**: Create courses with realistic titles and descriptions
6. **Include request tracking**: Add unique identifiers in course/student data for debugging
7. **Test incrementally**: Start with simple operations, then test complex workflows

**Base URL**: `https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net`

All endpoints support CORS and can be called from web browsers or any HTTP client. The API uses Azure Cosmos DB for data persistence and requires proper JSON formatting for POST requests.

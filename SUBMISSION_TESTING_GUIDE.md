# Assignment Submission API Testing Guide

## 🧪 Complete Submission Workflow Testing

### Base URL

```
https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net
```

---

## Step 1: Get Course and Assignment IDs

### 1.1 Get Available Courses

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/courses"
```

### 1.2 Get Assignments for a Course

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/course?courseId=REPLACE_WITH_COURSE_ID"
```

---

## Step 2: Student Submission Testing

### 2.1 Submit Text Assignment

```bash
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-001",
    "studentName": "Alice Johnson",
    "studentEmail": "alice.johnson@student.edu",
    "submissionText": "This is my assignment submission. I have completed all the required tasks and included detailed explanations for each solution."
  }'
```

### 2.2 Submit Assignment with File Attachments

```bash
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-002",
    "studentName": "Bob Smith",
    "studentEmail": "bob.smith@student.edu",
    "submissionText": "Please see attached files for my complete solution.",
    "attachments": [
      {
        "id": "file-001",
        "filename": "assignment-solution.pdf",
        "originalFilename": "My Assignment Solution.pdf",
        "fileSize": 1048576,
        "mimeType": "application/pdf",
        "uploadUrl": "https://example.blob.core.windows.net/submissions/assignment-solution.pdf",
        "uploadedAt": "2025-09-16T10:30:00.000Z"
      },
      {
        "id": "file-002",
        "filename": "code-implementation.js",
        "originalFilename": "implementation.js",
        "fileSize": 2048,
        "mimeType": "text/javascript",
        "uploadUrl": "https://example.blob.core.windows.net/submissions/code-implementation.js",
        "uploadedAt": "2025-09-16T10:32:00.000Z"
      }
    ]
  }'
```

### 2.3 Submit Multiple Attempts (if allowed)

```bash
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-001",
    "studentName": "Alice Johnson",
    "studentEmail": "alice.johnson@student.edu",
    "submissionText": "This is my revised submission with corrections based on feedback."
  }'
```

### 2.4 Test Late Submission

```bash
# For assignments past due date
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-003",
    "studentName": "Charlie Brown",
    "studentEmail": "charlie.brown@student.edu",
    "submissionText": "Late submission - had technical difficulties."
  }'
```

---

## Step 3: Teacher Review Testing

### 3.1 View All Submissions for Assignment

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submissions"
```

### 3.2 View Submissions with Pagination

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submissions?page=1&limit=10"
```

### 3.3 Filter Submissions by Status

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submissions?status=submitted"
```

### 3.4 Grade a Submission

```bash
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/SUBMISSION_ID/grade" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": 85,
    "feedback": "Great work! Your solution is well-structured and demonstrates good understanding of the concepts. Minor improvements needed in the error handling section.",
    "gradedBy": "instructor-123"
  }'
```

---

## Step 4: Individual Submission Access

### 4.1 Get Specific Submission

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/SUBMISSION_ID"
```

### 4.2 Get Student's Submissions (AI-friendly)

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/student?studentId=student-001"
```

### 4.3 Get Student's Submissions for Specific Course

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/student?studentId=student-001&courseId=COURSE_ID"
```

---

## Step 5: Submission Management

### 5.1 Update Submission Status

```bash
curl -X PUT "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/SUBMISSION_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "returned"
  }'
```

### 5.2 Delete Submission

```bash
curl -X DELETE "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/SUBMISSION_ID"
```

---

## Step 6: AI Agent-Friendly Endpoints

### 6.1 Get Assignment Submissions by Query

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/assignment?assignmentId=ASSIGNMENT_ID&page=1&limit=20"
```

### 6.2 Get Submission Details by Query

```bash
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/details?submissionId=SUBMISSION_ID"
```

---

## 🔧 Testing Workflow Examples

### Complete Student Workflow

1. **Get course and assignment IDs:**

   ```bash
   curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/courses"
   curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/course?courseId=COURSE_ID"
   ```

2. **Submit assignment:**

   ```bash
   curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submit" \
     -H "Content-Type: application/json" \
     -d '{
       "studentId": "test-student-001",
       "studentName": "Test Student",
       "studentEmail": "test@student.edu",
       "submissionText": "My test submission"
     }'
   ```

3. **Verify submission created:**
   ```bash
   curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/student?studentId=test-student-001"
   ```

### Complete Teacher Workflow

1. **View all submissions:**

   ```bash
   curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submissions"
   ```

2. **Grade submission:**

   ```bash
   curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/SUBMISSION_ID/grade" \
     -H "Content-Type: application/json" \
     -d '{
       "grade": 90,
       "feedback": "Excellent work!",
       "gradedBy": "test-instructor"
     }'
   ```

3. **Return to student:**
   ```bash
   curl -X PUT "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/SUBMISSION_ID/status" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "returned"
     }'
   ```

---

## 📝 Expected Response Formats

### Successful Submission Response

```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "submissionId": "submission-uuid-here",
    "assignmentId": "assignment-uuid-here",
    "status": "submitted",
    "submittedAt": "2025-09-16T10:30:00.000Z",
    "isLate": false,
    "submissionNumber": 1
  }
}
```

### Assignment Submissions List Response

```json
{
  "success": true,
  "data": [
    {
      "id": "submission-1",
      "studentId": "student-001",
      "studentName": "Alice Johnson",
      "submittedAt": "2025-09-16T10:30:00.000Z",
      "status": "submitted",
      "isLate": false,
      "submissionNumber": 1,
      "grade": null
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  },
  "assignmentInfo": {
    "title": "JavaScript Fundamentals Quiz",
    "dueDate": "2025-12-31T23:59:59.000Z",
    "maxPoints": 100,
    "submissionFormat": "text"
  }
}
```

### Graded Submission Response

```json
{
  "success": true,
  "message": "Submission graded successfully",
  "data": {
    "submissionId": "submission-uuid-here",
    "grade": 85,
    "maxPoints": 100,
    "feedback": "Great work! Minor improvements needed.",
    "gradedAt": "2025-09-16T14:30:00.000Z",
    "status": "graded"
  }
}
```

---

## ⚠️ Error Testing Scenarios

### Test Invalid Submissions

```bash
# Missing required fields
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-001"
  }'
```

### Test Unauthorized Access

```bash
# Student trying to view other submissions
curl -X GET "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submissions"
```

### Test Invalid Grade

```bash
# Grade exceeding max points
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/submissions/SUBMISSION_ID/grade" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": 150,
    "gradedBy": "instructor-123"
  }'
```

---

## 🚀 File Upload Implementation (Future Phase)

For the next phase, file uploads will be implemented with Azure Blob Storage:

### 1. File Upload Endpoint

```bash
# Upload file first
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/files/upload" \
  -F "file=@./my-assignment.pdf" \
  -F "assignmentId=ASSIGNMENT_ID" \
  -F "studentId=student-001"
```

### 2. Use Uploaded File in Submission

```bash
# Then submit with file reference
curl -X POST "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net/api/assignments/ASSIGNMENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-001",
    "studentName": "Alice Johnson",
    "studentEmail": "alice.johnson@student.edu",
    "attachments": ["file-id-from-upload-response"]
  }'
```

This comprehensive testing guide covers all the submission workflow scenarios and provides a solid foundation for testing the assignment submission system!

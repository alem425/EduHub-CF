# AI Agent Assignment & Submission Management - EDU Platform

## Base URL

`https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net`

## 🤖 AI Agent Role & Responsibilities

The **AI Agent** is responsible for processing **ALL assignment creation and submission operations** in the EDU Platform. This includes:

### ✅ **What the AI Agent Handles:**

- **ALL Assignment Creation** - Both with and without file attachments
- **ALL Student Submissions** - Text submissions, file uploads, or both
- **File Processing & Conversion** - Converting attached files to base64 for JSON payload
- **Dynamic File Creation** - Creating code files, text documents, and other content on-demand
- **Secure File Download Management** - Generating temporary download URLs for file access
- **File Format Validation** - Ensuring uploaded files meet requirements
- **Blob Storage Integration** - Managing Azure Blob Storage operations seamlessly

### 🔄 **File Handling Logic:**

- **User Provides Files**: Agent converts to base64 and includes in JSON payload
- **User Requests File Creation**: Agent creates content (code, text, documents) and converts to base64
- **Text-Only Operations**: Agent still handles through same endpoints for consistency
- **Mixed Content**: Agent manages both text submissions and file attachments together

### ❌ **What the AI Agent Does NOT Handle:**

- User authentication (handled by platform middleware)
- Course creation/management (use regular course endpoints)
- File downloads for end users (generates secure URLs instead)

---

## 🔄 Assignment & Submission Workflow

### Assignment Creation Flow:

```
1. Teacher provides assignment details (text-only OR with files)
   ↓
2. AI Agent processes any file attachments:
   - If files provided → Convert to base64
   - If file creation requested → Generate content + convert to base64
   - If text-only → Process without files
   ↓
3. AI Agent validates request schema and file formats
   ↓
4. AI Agent decodes base64 files (if any) and uploads to Azure Blob Storage
   ↓
5. AI Agent creates assignment record with blob URLs
   ↓
6. Return assignment details with attachment URLs
```

### Submission Upload Flow:

```
1. Student provides submission details (text, files, or both)
   ↓
2. AI Agent processes submission content:
   - If files provided → Convert to base64
   - If file creation requested → Generate content + convert to base64
   - If text-only → Process text submission
   ↓
3. AI Agent validates submission format requirements
   ↓
4. AI Agent checks assignment rules (due date, format, multiple submissions)
   ↓
5. AI Agent decodes base64 files (if any) and uploads to Azure Blob Storage
   ↓
6. AI Agent creates submission record with attachment metadata
   ↓
7. Return submission confirmation with file details
```

### File Creation Scenarios:

```
Scenario 1: User says "Create a starter Python file for this assignment"
   ↓ AI Agent generates Python code → converts to base64 → includes in attachments

Scenario 2: User provides actual files for upload
   ↓ AI Agent reads files → converts to base64 → includes in attachments

Scenario 3: User wants text-only assignment
   ↓ AI Agent processes with empty attachments array → creates assignment

Scenario 4: User wants mixed content (text + generated files + uploaded files)
   ↓ AI Agent combines all content → converts files to base64 → single request
```

---

## 📋 Available AI Agent Endpoints

### 1. Create Assignment (Text-Only)

**URL**: `/api/ai/assignments/create`  
**Method**: POST  
**Purpose**: Creates a new text-only assignment without file attachments

#### Request Schema:

```json
{
  "courseId": "string (required) - UUID of the course",
  "title": "string (required) - Assignment title (3-200 chars)",
  "description": "string (required) - Assignment description (10-2000 chars)",
  "instructions": "string (optional) - Detailed instructions (max 5000 chars)",
  "dueDate": "string (required) - ISO date string, must be in future",
  "maxPoints": "number (required) - Maximum points (positive number)",
  "assignmentType": "string (required) - One of: homework, quiz, exam, project, essay",
  "submissionFormat": "string (required) - One of: text, file, both",
  "createdBy": "string (required) - Instructor ID",
  "isActive": "boolean (optional) - Default: true"
}
```

#### Example Request:

```json
{
  "courseId": "bd046644-b94c-4b9d-b2e1-b3507480baac",
  "title": "Essay Assignment - Climate Change",
  "description": "Write a 1000-word essay on the impacts of climate change",
  "instructions": "Your essay should include at least 3 peer-reviewed sources and follow APA format",
  "dueDate": "2024-12-31T23:59:59Z",
  "maxPoints": 100,
  "assignmentType": "essay",
  "submissionFormat": "text",
  "createdBy": "instructor-123",
  "isActive": true
}
```

#### Success Response:

```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": "assignment-uuid-here",
    "courseId": "bd046644-b94c-4b9d-b2e1-b3507480baac",
    "title": "Essay Assignment - Climate Change",
    "description": "Write a 1000-word essay on the impacts of climate change",
    "instructions": "Your essay should include at least 3 peer-reviewed sources and follow APA format",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "maxPoints": 100,
    "assignmentType": "essay",
    "submissionFormat": "text",
    "createdBy": "instructor-123",
    "isActive": true,
    "createdAt": "2024-09-16T14:30:00.000Z",
    "updatedAt": "2024-09-16T14:30:00.000Z"
  }
}
```

---

### 2. Create Assignment with File Attachments

**URL**: `/api/ai/assignments/create-with-files`  
**Method**: POST  
**Purpose**: Creates a new assignment with file attachments encoded as base64

#### Request Schema:

```json
{
  "courseId": "string (required) - UUID of the course",
  "title": "string (required) - Assignment title (3-200 chars)",
  "description": "string (required) - Assignment description (10-2000 chars)",
  "instructions": "string (optional) - Detailed instructions (max 5000 chars)",
  "dueDate": "string (required) - ISO date string, must be in future",
  "maxPoints": "number (required) - Maximum points (positive number)",
  "assignmentType": "string (required) - One of: homework, quiz, exam, project, essay",
  "submissionFormat": "string (required) - One of: text, file, both",
  "createdBy": "string (required) - Instructor ID",
  "isActive": "boolean (optional) - Default: true",
  "attachments": [
    {
      "filename": "string (required) - Original filename with extension",
      "mimeType": "string (required) - MIME type (e.g., text/plain, application/pdf)",
      "data": "string (required) - Base64 encoded file content",
      "size": "number (optional) - File size in bytes"
    }
  ]
}
```

#### Supported File Types:

- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
- **Images**: JPG, JPEG, PNG, GIF, WEBP
- **Archives**: ZIP, RAR
- **Code Files**: JS, TS, HTML, CSS, JSON
- **Max File Size**: 10MB per file
- **Max Files**: 5 files per request

#### Example Request:

```json
{
  "courseId": "bd046644-b94c-4b9d-b2e1-b3507480baac",
  "title": "Programming Assignment 1",
  "description": "Implement a fibonacci function with proper documentation",
  "instructions": "Complete the starter code and submit your solution with test cases",
  "dueDate": "2024-12-31T23:59:59Z",
  "maxPoints": 100,
  "assignmentType": "homework",
  "submissionFormat": "both",
  "createdBy": "instructor-123",
  "attachments": [
    {
      "filename": "instructions.pdf",
      "mimeType": "application/pdf",
      "data": "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwov..."
    },
    {
      "filename": "starter-code.js",
      "mimeType": "text/javascript",
      "data": "ZnVuY3Rpb24gZmlib25hY2NpKG4pIHsKLy8gVE9ETw=="
    }
  ]
}
```

#### Success Response:

```json
{
  "success": true,
  "message": "Assignment created successfully with attachments",
  "data": {
    "id": "assignment-uuid-here",
    "courseId": "bd046644-b94c-4b9d-b2e1-b3507480baac",
    "title": "Programming Assignment 1",
    "description": "Implement a fibonacci function with proper documentation",
    "attachments": [
      "https://cfeduhubstorage.blob.core.windows.net/edu-attachments/assignments/2024/09/course-id/assignment-id/instructions.pdf",
      "https://cfeduhubstorage.blob.core.windows.net/edu-attachments/assignments/2024/09/course-id/assignment-id/starter-code.js"
    ],
    "dueDate": "2024-12-31T23:59:59.000Z",
    "maxPoints": 100,
    "assignmentType": "homework",
    "submissionFormat": "both",
    "createdBy": "instructor-123",
    "isActive": true,
    "createdAt": "2024-09-16T14:30:00.000Z",
    "updatedAt": "2024-09-16T14:30:00.000Z"
  },
  "attachmentsUploaded": 2
}
```

---

### 3. Create Submission (Text-Only)

**URL**: `/api/ai/submissions/create`  
**Method**: POST  
**Purpose**: Students submit text-only assignment responses without file attachments

#### Request Schema:

```json
{
  "assignmentId": "string (required) - UUID of the assignment",
  "studentId": "string (required) - Student identifier",
  "studentName": "string (required) - Student full name (2-100 chars)",
  "studentEmail": "string (required) - Valid email address",
  "submissionText": "string (required) - Text submission content (max 10000 chars)"
}
```

#### Example Request:

```json
{
  "assignmentId": "assignment-uuid-from-step-1",
  "studentId": "student-123",
  "studentName": "John Doe",
  "studentEmail": "john.doe@university.edu",
  "submissionText": "Climate change represents one of the most pressing challenges of our time. The scientific consensus indicates that human activities, particularly the emission of greenhouse gases, are the primary drivers of recent global warming trends. This essay examines the multifaceted impacts of climate change on our planet's ecosystems, human societies, and economic systems..."
}
```

#### Success Response:

```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "submissionId": "submission-uuid-here",
    "assignmentId": "assignment-uuid",
    "status": "submitted",
    "submittedAt": "2024-09-16T15:45:00.000Z",
    "isLate": false,
    "submissionNumber": 1,
    "submissionText": "Climate change represents one of the most pressing challenges..."
  }
}
```

---

### 4. Create Submission with File Attachments

**URL**: `/api/ai/submissions/create-with-files`  
**Method**: POST  
**Purpose**: Students submit assignment work with file attachments

#### Request Schema:

```json
{
  "assignmentId": "string (required) - UUID of the assignment",
  "studentId": "string (required) - Student identifier",
  "studentName": "string (required) - Student full name (2-100 chars)",
  "studentEmail": "string (required) - Valid email address",
  "submissionText": "string (optional) - Text submission content (max 10000 chars)",
  "attachments": [
    {
      "filename": "string (required) - Original filename with extension",
      "mimeType": "string (required) - MIME type",
      "data": "string (required) - Base64 encoded file content",
      "size": "number (optional) - File size in bytes"
    }
  ]
}
```

#### Submission Format Validation:

- **"text"**: `submissionText` is required, files are optional
- **"file"**: At least one file attachment is required
- **"both"**: Either `submissionText` OR file attachments (or both) required

#### Example Request:

```json
{
  "assignmentId": "assignment-uuid-from-step-1",
  "studentId": "student-123",
  "studentName": "John Doe",
  "studentEmail": "john.doe@university.edu",
  "submissionText": "Here is my solution to the fibonacci assignment. I implemented both recursive and iterative approaches for comparison.",
  "attachments": [
    {
      "filename": "fibonacci-solution.js",
      "mimeType": "text/javascript",
      "data": "ZnVuY3Rpb24gZmlib25hY2NpUmVjdXJzaXZlKG4pIHsKICAgIGlmIChuIDw9IDEpIHJldHVybiBuOwogICAgcmV0dXJuIGZpYm9uYWNjaShuIC0gMSkgKyBmaWJvbmFjY2kobiAtIDIpOwp9"
    },
    {
      "filename": "test-results.txt",
      "mimeType": "text/plain",
      "data": "VGVzdCBSZXN1bHRzOgpGKDApID0gMApeKDEpID0gMQpeKDUpID0gNQpGKDEwKSA9IDU1CkFsbCB0ZXN0cyBwYXNzZWQh"
    }
  ]
}
```

#### Success Response:

```json
{
  "success": true,
  "message": "Submission created successfully with attachments",
  "data": {
    "submissionId": "submission-uuid-here",
    "assignmentId": "assignment-uuid",
    "status": "submitted",
    "submittedAt": "2024-09-16T15:45:00.000Z",
    "isLate": false,
    "submissionNumber": 1,
    "attachmentsUploaded": 2
  }
}
```

---

### 5. Get Assignment Attachment Download URL

**URL**: `/api/ai/assignments/get-download-url`  
**Method**: POST  
**Purpose**: Generate secure download URL for assignment attachment files

#### Request Schema:

```json
{
  "assignmentId": "string (required) - UUID of the assignment",
  "filename": "string (required) - Exact filename of the attachment"
}
```

#### Example Request:

```json
{
  "assignmentId": "assignment-uuid-here",
  "filename": "instructions.pdf"
}
```

#### Success Response:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cfeduhubstorage.blob.core.windows.net/edu-attachments/assignments/2024/09/course-id/assignment-id/instructions.pdf?sv=2022-11-02&ss=b&srt=o&sp=r&se=2024-09-16T16:45:00Z&st=2024-09-16T15:45:00Z&spr=https&sig=...",
    "filename": "instructions.pdf",
    "expiresInMinutes": 60,
    "assignmentId": "assignment-uuid-here",
    "assignmentTitle": "Programming Assignment 1"
  }
}
```

---

### 6. Get Submission Attachment Download URL

**URL**: `/api/ai/submissions/get-download-url`  
**Method**: POST  
**Purpose**: Generate secure download URL for submission attachment files

#### Request Schema:

```json
{
  "submissionId": "string (required) - UUID of the submission",
  "filename": "string (required) - Exact filename of the attachment"
}
```

#### Example Request:

```json
{
  "submissionId": "submission-uuid-here",
  "filename": "fibonacci-solution.js"
}
```

#### Success Response:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cfeduhubstorage.blob.core.windows.net/edu-attachments/submissions/2024/09/course-id/submission-id/fibonacci-solution.js?sv=2022-11-02&ss=b&srt=o&sp=r&se=2024-09-16T16:45:00Z&st=2024-09-16T15:45:00Z&spr=https&sig=...",
    "filename": "fibonacci-solution.js",
    "expiresInMinutes": 60,
    "submissionId": "submission-uuid-here",
    "assignmentId": "assignment-uuid",
    "studentName": "John Doe"
  }
}
```

---

## 🔐 Security & File Management

### File Storage Organization:

```
edu-attachments/
├── assignments/
│   └── YYYY/
│       └── MM/
│           └── {courseId}/
│               └── {assignmentId}/
│                   ├── instructions.pdf
│                   └── starter-code.js
└── submissions/
    └── YYYY/
        └── MM/
            └── {courseId}/
                └── {submissionId}/
                    ├── solution.js
                    └── report.txt
```

### Security Features:

- **Private Blob Container**: Files not publicly accessible
- **SAS Token URLs**: Temporary download links expire in 1 hour
- **File Type Validation**: Only allowed MIME types accepted
- **Size Limits**: 10MB per file, 5 files maximum per request
- **Base64 Encoding**: Secure file transfer in JSON payloads

### File Access Control:

- **Assignment Files**: Accessible to course instructors and enrolled students
- **Submission Files**: Accessible to submitting student and course instructors
- **Download URLs**: Generated on-demand with expiration

---

## ❌ Error Handling

### Common Error Responses:

#### Validation Error:

```json
{
  "success": false,
  "message": "Validation error",
  "details": [
    {
      "message": "\"maxPoints\" must be a positive number",
      "path": ["maxPoints"],
      "type": "number.positive"
    }
  ]
}
```

#### File Upload Error:

```json
{
  "success": false,
  "message": "Failed to upload attachments",
  "error": "File type 'application/exe' is not allowed. Allowed types: application/pdf, text/plain, ..."
}
```

#### Assignment Not Found:

```json
{
  "success": false,
  "message": "Assignment not found"
}
```

#### Submission Format Error:

```json
{
  "success": false,
  "message": "File submission is required for this assignment."
}
```

---

## 🧪 Testing with Base64 Files

### Creating Base64 Encoded Files:

#### Command Line (Linux/Mac):

```bash
# Text file
echo "Hello World" | base64

# Existing file
base64 -i myfile.txt
```

#### Command Line (Windows):

```powershell
# Text to base64
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("Hello World"))

# File to base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("myfile.txt"))
```

#### Online Tools:

- Use any "File to Base64" converter online
- Paste the base64 output into the `data` field

### Example Base64 Files:

#### Simple Text File:

```json
{
  "filename": "hello.txt",
  "mimeType": "text/plain",
  "data": "SGVsbG8gV29ybGQ="
}
```

_Decodes to: "Hello World"_

#### Simple JavaScript File:

```json
{
  "filename": "test.js",
  "mimeType": "text/javascript",
  "data": "Y29uc29sZS5sb2coIkhlbGxvIFdvcmxkIik7"
}
```

_Decodes to: console.log("Hello World");_

### AI Agent File Creation Examples:

#### Generated Python Starter Code:

```json
{
  "filename": "fibonacci_starter.py",
  "mimeType": "text/x-python",
  "data": "ZGVmIGZpYm9uYWNjaSeIjByDQyOgo="
}
```

_Decodes to Python code for fibonacci function starter_

#### Generated HTML Assignment Template:

```json
{
  "filename": "assignment_template.html",
  "mimeType": "text/html",
  "data": "PCFET0NUWVBFIGh0bWw+CjxodG1sPg=="
}
```

_Decodes to HTML document template_

#### Generated Test Instructions:

```json
{
  "filename": "testing_instructions.md",
  "mimeType": "text/markdown",
  "data": "IyBUZXN0aW5nIEluc3RydWN0aW9ucwo="
}
```

_Decodes to Markdown testing instructions_

---

## 🔄 Integration Workflow

### For Assignment Creation:

1. **Process User Request**: Determine if files need to be created or converted
2. **File Handling**:
   - **User Provides Files**: Convert all attachment files to base64
   - **User Requests File Creation**: Generate content and convert to base64
   - **Mixed Request**: Combine generated files + provided files
3. **Build Request**: Include assignment details + base64 attachments (if any)
4. **Send to AI Agent**: POST to `/api/ai/assignments/create-with-files`
5. **Store Assignment ID**: Save returned assignment ID for future reference
6. **Share with Students**: Students can now access assignment and attachments

### For Student Submissions:

1. **Get Assignment ID**: From assignment creation or course listing
2. **Process Submission Content**:
   - **Student Provides Files**: Convert student files to base64
   - **Student Creates Content**: Generate files (code solutions, reports) and convert to base64
   - **Text + Files**: Combine text submission with file attachments
3. **Build Request**: Include submission details + base64 attachments (if any)
4. **Send to AI Agent**: POST to `/api/ai/submissions/create-with-files`
5. **Confirm Submission**: Store submission ID for tracking

### For File Downloads:

1. **Get File Reference**: From assignment or submission data
2. **Request Download URL**: POST to appropriate download endpoint
3. **Use Temporary URL**: Download file within 1 hour expiration
4. **Handle Expiry**: Request new URL if needed after expiration

### AI Agent Decision Matrix:

| User Input                            | AI Agent Action        | Endpoint Used                           | Attachments     |
| ------------------------------------- | ---------------------- | --------------------------------------- | --------------- |
| "Create assignment with starter code" | Generate code → base64 | `/api/ai/assignments/create-with-files` | Generated files |
| "Create text-only assignment"         | Process text only      | `/api/ai/assignments/create`            | None            |
| "Upload these PDFs to assignment"     | Convert files → base64 | `/api/ai/assignments/create-with-files` | Uploaded files  |
| "Submit my solution files"            | Convert files → base64 | `/api/ai/submissions/create-with-files` | Student files   |
| "Generate and submit code solution"   | Create code → base64   | `/api/ai/submissions/create-with-files` | Generated code  |
| "Submit text answer only"             | Process text           | `/api/ai/submissions/create`            | None            |

### 🔀 **Endpoint Selection Logic:**

#### **For Assignments:**

- **Text-Only**: Use `/api/ai/assignments/create`
- **With Files**: Use `/api/ai/assignments/create-with-files`

#### **For Submissions:**

- **Text-Only**: Use `/api/ai/submissions/create`
- **With Files**: Use `/api/ai/submissions/create-with-files`

#### **Key Differences:**

| Feature          | Text-Only Endpoints    | File Upload Endpoints          |
| ---------------- | ---------------------- | ------------------------------ |
| **URL**          | `/create`              | `/create-with-files`           |
| **Payload**      | Simple JSON schema     | JSON with base64 attachments   |
| **File Support** | None                   | Base64 encoded files           |
| **Use Case**     | Essays, text responses | Code, documents, mixed content |
| **Complexity**   | Lower                  | Higher                         |

---

## 💡 Best Practices

### File Naming:

- Use descriptive filenames with proper extensions
- Avoid special characters and spaces
- Use consistent naming conventions

### Base64 Encoding:

- Always include proper MIME types
- Validate file sizes before encoding
- Consider compression for large files

### Error Handling:

- Always check response status before proceeding
- Handle file upload failures gracefully
- Provide meaningful error messages to users

### Performance:

- Limit file sizes to necessary amounts
- Use appropriate file formats (PDF for docs, JPG for images)
- Consider batch operations for multiple files

---

This AI Agent system provides a secure, scalable solution for handling all file upload operations in the EDU Platform while maintaining compatibility with AI agent requirements for static URLs and JSON parameter schemas.

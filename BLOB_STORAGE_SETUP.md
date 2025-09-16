# Azure Blob Storage Setup for EDU Platform

## 🎯 Overview

Your EDU platform now supports file attachments for both assignments and submissions using Azure Blob Storage. This guide will help you complete the setup.

## 📋 What's Been Implemented

### ✅ Core Components Added

1. **Blob Storage Service** (`src/services/blobStorageService.ts`)

   - File upload/download functionality
   - SAS token generation for secure access
   - File validation (size, type)
   - Automatic folder organization

2. **Upload Middleware** (`src/middleware/uploadMiddleware.ts`)

   - Multer configuration for file handling
   - File type validation
   - Size limits (10MB per file, max 5 files)

3. **Updated Controllers**

   - **Assignment Controller**: File upload support for assignment attachments
   - **Submission Controller**: File upload support for student submissions

4. **Updated Routes**

   - Assignment creation with file uploads
   - Submission creation with file uploads
   - Secure download URLs for attachments

5. **Database Integration**
   - Blob storage initialization on server startup
   - Attachment metadata stored in Cosmos DB

## 🔧 Azure Setup Required

### 1. Create Azure Storage Account

```bash
# Using Azure CLI (if you have it installed)
az storage account create \
  --name yourstorageaccount \
  --resource-group your-resource-group \
  --location eastus \
  --sku Standard_LRS
```

**Or via Azure Portal:**

1. Go to Azure Portal → Storage Accounts
2. Click "Create"
3. Fill in:
   - **Subscription**: Your subscription
   - **Resource Group**: Same as your Cosmos DB
   - **Storage Account Name**: `eduhubstorage` (must be globally unique)
   - **Region**: Same as your other resources
   - **Performance**: Standard
   - **Redundancy**: LRS (for development)

### 2. Get Connection String

**Via Azure Portal:**

1. Go to your Storage Account
2. Settings → Access Keys
3. Copy the "Connection string" for key1

**Via Azure CLI:**

```bash
az storage account show-connection-string --name yourstorageaccount --resource-group your-resource-group
```

### 3. Update Environment Variables

Update your `.env` file with these new variables:

```env
# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=yourstorageaccount;AccountKey=your-key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=edu-attachments
BLOB_BASE_URL=https://yourstorageaccount.blob.core.windows.net
```

## 📁 File Organization Structure

Files are automatically organized in blob storage:

```
edu-attachments/
├── assignments/
│   └── 2024/
│       └── 09/
│           └── {courseId}/
│               └── {assignmentId}/
│                   ├── file1.pdf
│                   └── file2.docx
└── submissions/
    └── 2024/
        └── 09/
            └── {courseId}/
                └── {submissionId}/
                    ├── submission1.pdf
                    └── code.zip
```

## 🔌 API Endpoints

### Assignment Endpoints

#### Create Assignment with Attachments

```http
POST /api/courses/{courseId}/assignments
Content-Type: multipart/form-data

# Form fields:
title: "Assignment 1"
description: "Complete the programming exercise"
dueDate: "2024-10-15T23:59:59Z"
maxPoints: 100
assignmentType: "homework"
submissionFormat: "both"
createdBy: "teacher123"
attachments: [file1.pdf, file2.docx]  # Files
```

#### Download Assignment Attachment

```http
GET /api/assignments/{assignmentId}/attachments/{filename}/download
```

### Submission Endpoints

#### Submit Assignment with Files

```http
POST /api/assignments/{assignmentId}/submit
Content-Type: multipart/form-data

# Form fields:
studentId: "student123"
studentName: "John Doe"
studentEmail: "john@example.com"
submissionText: "My submission text"  # Optional
attachments: [submission.pdf, code.zip]  # Files
```

#### Download Submission Attachment

```http
GET /api/submissions/{submissionId}/attachments/{filename}/download
```

## 🧪 Testing the Setup

### 1. Test Assignment Creation with Files

```bash
curl -X POST "http://localhost:3001/api/courses/{courseId}/assignments" \
  -F "title=Test Assignment" \
  -F "description=This is a test assignment" \
  -F "dueDate=2024-12-31T23:59:59Z" \
  -F "maxPoints=100" \
  -F "assignmentType=homework" \
  -F "submissionFormat=both" \
  -F "createdBy=teacher123" \
  -F "attachments=@path/to/file1.pdf" \
  -F "attachments=@path/to/file2.docx"
```

### 2. Test Submission with Files

```bash
curl -X POST "http://localhost:3001/api/assignments/{assignmentId}/submit" \
  -F "studentId=student123" \
  -F "studentName=John Doe" \
  -F "studentEmail=john@example.com" \
  -F "submissionText=My submission text" \
  -F "attachments=@path/to/submission.pdf"
```

## 🛡️ Security Features

### File Validation

- **Allowed Types**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG, GIF, ZIP, RAR, JS, TS, HTML, CSS, JSON
- **Size Limits**: 10MB per file, maximum 5 files per upload
- **Secure URLs**: Generated with SAS tokens, expire in 1 hour

### Access Control

- Private blob container (not publicly accessible)
- Temporary download URLs with expiration
- File access tied to user permissions (TODO: implement authentication)

## 🔄 File Lifecycle

1. **Upload**: Files uploaded to blob storage with unique names
2. **Storage**: Metadata stored in Cosmos DB, files in blob storage
3. **Access**: Secure download URLs generated on-demand
4. **Cleanup**: Failed uploads automatically cleaned up

## 🚨 Important Notes

### Required Environment Variables

Make sure these are set in your `.env` file:

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER_NAME`
- `BLOB_BASE_URL`

### Error Handling

- Upload failures trigger automatic cleanup
- Validation errors return clear messages
- Network issues are handled gracefully

### Performance Considerations

- Files are uploaded in parallel for better performance
- SAS URLs are generated on-demand (not cached)
- File metadata stored separately from blob data

## 🔮 Next Steps

1. **Set up Azure Storage Account** (required)
2. **Configure environment variables** (required)
3. **Test file uploads** (recommended)
4. **Add authentication middleware** (recommended)
5. **Implement file cleanup policies** (optional)
6. **Add file compression** (optional)
7. **Implement file previews** (optional)

## 🆘 Troubleshooting

### Common Issues

**"AZURE_STORAGE_CONNECTION_STRING environment variable is required"**

- Make sure your `.env` file has the correct connection string

**"Failed to upload file: Invalid file type"**

- Check if your file type is in the allowed list
- File must have proper MIME type

**"File too large"**

- Default limit is 10MB per file
- Adjust in `uploadMiddleware.ts` if needed

**"Too many files"**

- Default limit is 5 files per upload
- Adjust in route configurations if needed

### Debug Mode

Set `NODE_ENV=development` to see detailed upload logs.

## 📞 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify your Azure Storage Account is properly configured
3. Ensure all environment variables are correctly set
4. Test with small files first before larger uploads

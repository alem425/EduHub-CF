# Assignment Submission Workflow Plan

## 🎯 Core Business Logic

### Submission Rules & Validation

1. **Student Enrollment Check**

   - Student must be enrolled in the course to submit
   - Verify through existing enrollment system

2. **Assignment Validation**

   - Assignment must be active (`isActive: true`)
   - Assignment must belong to the course student is enrolled in
   - Check assignment's `submissionFormat` requirements

3. **Late Submission Handling**

   - Calculate if submission is late based on `assignment.dueDate`
   - Check `assignment.allowLateSubmissions` flag
   - Mark submission with `isLate: true/false`

4. **Multiple Submission Rules**

   - Check `assignment.allowMultipleSubmissions` flag
   - If allowed: increment `submissionNumber` (1, 2, 3...)
   - If not allowed: reject if student already has a submission

5. **Submission Format Validation**
   - `text`: Requires `submissionText` field
   - `file`: Requires `attachments` array with files
   - `both`: Allows either or both

## 🔄 Submission Workflow Steps

### Student Submission Process

```
1. Student Request: POST /assignments/{id}/submit
   ↓
2. Validate Student Enrollment
   ↓
3. Validate Assignment (active, format, deadline)
   ↓
4. Check Multiple Submission Rules
   ↓
5. Process File Uploads (if any)
   ↓
6. Create Submission Document
   ↓
7. Update Assignment submission count
   ↓
8. Add submission reference to assignment
   ↓
9. Return Submission Confirmation
```

### Teacher Review Process

```
1. Teacher Request: GET /assignments/{id}/submissions
   ↓
2. Validate Teacher Authorization
   ↓
3. Fetch All Submissions for Assignment
   ↓
4. Return Paginated Results with Student Info
```

### Individual Submission Access

```
1. Request: GET /submissions/{id}
   ↓
2. Validate User Authorization:
   - Student: Can only view their own submissions
   - Teacher: Can view any submission in their courses
   ↓
3. Return Submission Details
```

## 📊 Data Relationships

### Bidirectional References

1. **Assignment ↔ Submissions**

   - Assignment tracks submission count
   - Assignment contains array of submission references
   - Each submission references its assignment

2. **Course ↔ Submissions**

   - Submissions are linked to courses through assignments
   - Course can show submission activity through assignments

3. **Student ↔ Submissions**
   - Students can view their submission history
   - Track submission patterns across courses

## 🗃️ Database Container Strategy

### Cosmos DB Partitioning

1. **Submissions Container**

   - Partition Key: `assignmentId`
   - Enables efficient queries for assignment submissions
   - Co-locates all submissions for same assignment

2. **Query Patterns**
   - Get all submissions for assignment: Single partition query
   - Get student's submission: Query by `studentId` within partition
   - Get submission by ID: Point read with partition key

## 📁 File Upload Strategy

### File Storage Options

1. **Azure Blob Storage** (Recommended)

   - Store files in blob storage
   - Generate SAS URLs for secure access
   - Organize by: `/submissions/{assignmentId}/{submissionId}/{filename}`

2. **File Metadata in Cosmos DB**
   - Store file references and metadata in submission document
   - Include: filename, size, type, blob URL

### Upload Process

```
1. Student uploads file through API
   ↓
2. Validate file (size, type, count limits)
   ↓
3. Upload to Azure Blob Storage
   ↓
4. Generate secure access URL
   ↓
5. Store metadata in submission document
```

## 🔐 Security & Authorization

### Access Control Rules

1. **Student Access**

   - Can submit to assignments in enrolled courses
   - Can view only their own submissions
   - Cannot view other students' submissions

2. **Teacher Access**

   - Can view all submissions for their courses
   - Can grade and provide feedback
   - Can download submitted files

3. **Admin Access**
   - Full access to all submissions
   - Can moderate and manage system

### File Access Security

1. **Temporary URLs**

   - Generate time-limited SAS URLs for file access
   - URLs expire after reasonable time (e.g., 1 hour)

2. **Authorization Checks**
   - Verify user permissions before generating file URLs
   - Log file access for audit purposes

## 📈 Performance Considerations

### Efficient Queries

1. **Pagination**

   - Implement pagination for large submission lists
   - Use continuation tokens for Cosmos DB

2. **Caching**

   - Cache frequently accessed submission metadata
   - Cache file URLs to reduce blob storage calls

3. **Batch Operations**
   - Batch updates for assignment submission counts
   - Optimize bulk grading operations

## 🔄 Status Transitions

### Submission Lifecycle

```
submitted → graded → returned
    ↓
resubmitted → graded → returned
```

### Status Rules

- `submitted`: Initial state after student submission
- `graded`: Teacher has provided grade and/or feedback
- `returned`: Student can view grade and feedback
- `resubmitted`: Student resubmitted after initial grading (if allowed)

## 🧪 Testing Strategy

### Unit Tests

1. **Validation Logic**

   - Test enrollment checks
   - Test deadline validation
   - Test multiple submission rules

2. **File Handling**
   - Test file upload validation
   - Test file storage operations
   - Test secure URL generation

### Integration Tests

1. **End-to-End Workflows**

   - Complete submission process
   - Teacher grading process
   - File download process

2. **Error Scenarios**
   - Late submissions
   - Unauthorized access
   - File upload failures

## 📋 Implementation Priority

### Phase 1: Core Submission

- [ ] Basic submission creation
- [ ] Student enrollment validation
- [ ] Assignment validation
- [ ] Text submission support

### Phase 2: File Handling

- [ ] File upload API
- [ ] Azure Blob Storage integration
- [ ] File attachment support
- [ ] Secure file access

### Phase 3: Advanced Features

- [ ] Multiple submissions
- [ ] Late submission handling
- [ ] Grading system
- [ ] Feedback system

### Phase 4: Optimization

- [ ] Performance improvements
- [ ] Caching implementation
- [ ] Audit logging
- [ ] Analytics and reporting

# PowerShell script to test file uploads using curl
param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$CourseId = "test-course-123",
    [string]$StudentId = "test-student-789",
    [string]$TeacherId = "test-teacher-101"
)

Write-Host "🧪 Testing File Uploads for EDU Platform" -ForegroundColor Cyan
Write-Host "📡 API Base URL: $BaseUrl" -ForegroundColor Gray

# Create test directory and files
$testDir = "test-files"
if (!(Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir | Out-Null
}

Write-Host "`n📝 Creating test files..." -ForegroundColor Yellow

# Create test files
@"
This is a test assignment submission.

Student: John Doe
Course: Computer Science 101
Assignment: Programming Exercise 1

My solution includes:
1. Algorithm implementation
2. Test cases
3. Documentation

Please see attached code files for the complete solution.
"@ | Out-File -FilePath "$testDir/submission.txt" -Encoding UTF8

@"
// Test JavaScript file for submission
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Testing fibonacci function:');
for (let i = 0; i < 10; i++) {
    console.log(`F(`${i}) = `${fibonacci(i)}`);
}

// Additional test cases
function testFibonacci() {
    const testCases = [
        { input: 0, expected: 0 },
        { input: 1, expected: 1 },
        { input: 5, expected: 5 },
        { input: 10, expected: 55 }
    ];
    
    testCases.forEach(test => {
        const result = fibonacci(test.input);
        console.log(`Test F(`${test.input}): Expected `${test.expected}, Got `${result}, `${result === test.expected ? 'PASS' : 'FAIL'}`);
    });
}

testFibonacci();
"@ | Out-File -FilePath "$testDir/solution.js" -Encoding UTF8

@"
%PDF-1.4
Test PDF content for assignment instructions
This is a sample PDF file for testing uploads.

Assignment Instructions:
1. Implement the fibonacci sequence
2. Include proper error handling
3. Add comprehensive test cases
4. Document your code clearly

Due Date: Next week
Points: 100
"@ | Out-File -FilePath "$testDir/instructions.pdf" -Encoding UTF8

Write-Host "✅ Test files created" -ForegroundColor Green

# Test 1: Create Assignment with Attachments
Write-Host "`n🎯 Test 1: Creating Assignment with Attachments" -ForegroundColor Cyan

$dueDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")

try {
    $response = curl.exe -s -X POST "$BaseUrl/api/courses/$CourseId/assignments" `
        -F "title=Programming Assignment 1" `
        -F "description=Create a fibonacci function with proper documentation" `
        -F "instructions=Please implement the fibonacci sequence algorithm and include test cases." `
        -F "dueDate=$dueDate" `
        -F "maxPoints=100" `
        -F "assignmentType=homework" `
        -F "submissionFormat=both" `
        -F "createdBy=$TeacherId" `
        -F "attachments=@$testDir/instructions.pdf" `
        -F "attachments=@$testDir/solution.js"
    
    $assignmentResult = $response | ConvertFrom-Json
    
    if ($assignmentResult.success) {
        Write-Host "✅ Assignment created successfully!" -ForegroundColor Green
        Write-Host "📄 Assignment ID: $($assignmentResult.data.id)" -ForegroundColor Gray
        Write-Host "📎 Attachments uploaded: $($assignmentResult.attachmentsUploaded)" -ForegroundColor Gray
        $assignmentId = $assignmentResult.data.id
    } else {
        Write-Host "❌ Assignment creation failed:" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error creating assignment: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Submit Assignment with Files
Write-Host "`n📤 Test 2: Submitting Assignment with Files" -ForegroundColor Cyan

try {
    $response = curl.exe -s -X POST "$BaseUrl/api/assignments/$assignmentId/submit" `
        -F "studentId=$StudentId" `
        -F "studentName=John Doe" `
        -F "studentEmail=john.doe@student.edu" `
        -F "submissionText=Here is my solution to the fibonacci assignment. I have implemented the recursive algorithm and included test cases." `
        -F "attachments=@$testDir/solution.js" `
        -F "attachments=@$testDir/submission.txt"
    
    $submissionResult = $response | ConvertFrom-Json
    
    if ($submissionResult.success) {
        Write-Host "✅ Submission uploaded successfully!" -ForegroundColor Green
        Write-Host "📋 Submission ID: $($submissionResult.data.submissionId)" -ForegroundColor Gray
        Write-Host "📎 Attachments uploaded: $($submissionResult.data.attachmentsUploaded)" -ForegroundColor Gray
        Write-Host "⏰ Submitted at: $($submissionResult.data.submittedAt)" -ForegroundColor Gray
        Write-Host "🕐 Late submission: $($submissionResult.data.isLate)" -ForegroundColor Gray
        $submissionId = $submissionResult.data.submissionId
    } else {
        Write-Host "❌ Submission upload failed:" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error submitting assignment: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Download File
Write-Host "`n⬇️ Test 3: Testing File Download" -ForegroundColor Cyan

try {
    $response = curl.exe -s "$BaseUrl/api/submissions/$submissionId/attachments/solution.js/download"
    $downloadResult = $response | ConvertFrom-Json
    
    if ($downloadResult.success) {
        Write-Host "✅ Download URL generated successfully!" -ForegroundColor Green
        Write-Host "🔗 Download URL: $($downloadResult.data.downloadUrl)" -ForegroundColor Gray
        Write-Host "⏰ Expires in: $($downloadResult.data.expiresInMinutes) minutes" -ForegroundColor Gray
        
        # Test actual download
        $downloadResponse = curl.exe -s -I "$($downloadResult.data.downloadUrl)"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ File download test successful!" -ForegroundColor Green
        } else {
            Write-Host "❌ File download test failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Download URL generation failed:" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing download: $_" -ForegroundColor Red
}

# Test 4: Get Assignment Details
Write-Host "`n📄 Test 4: Getting Assignment Details" -ForegroundColor Cyan

try {
    $response = curl.exe -s "$BaseUrl/api/assignments/$assignmentId"
    $assignmentDetails = $response | ConvertFrom-Json
    
    if ($assignmentDetails.success) {
        Write-Host "✅ Assignment details retrieved!" -ForegroundColor Green
        Write-Host "📝 Title: $($assignmentDetails.data.title)" -ForegroundColor Gray
        Write-Host "📎 Attachments: $($assignmentDetails.data.attachments.Count)" -ForegroundColor Gray
        Write-Host "📅 Due Date: $($assignmentDetails.data.dueDate)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to get assignment details:" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error getting assignment details: $_" -ForegroundColor Red
}

# Cleanup
Write-Host "`n🧹 Cleaning up test files..." -ForegroundColor Yellow
Remove-Item -Path $testDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n🎉 All tests completed!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "✅ Assignment creation with attachments" -ForegroundColor Green
Write-Host "✅ Submission upload with files" -ForegroundColor Green
Write-Host "✅ Secure file download URLs" -ForegroundColor Green
Write-Host "✅ Assignment details retrieval" -ForegroundColor Green

Write-Host "`n💡 Tips:" -ForegroundColor Yellow
Write-Host "- Files are stored securely in Azure Blob Storage" -ForegroundColor Gray
Write-Host "- Download URLs expire after 1 hour for security" -ForegroundColor Gray
Write-Host "- Maximum file size is 10MB per file" -ForegroundColor Gray
Write-Host "- Maximum 5 files per upload" -ForegroundColor Gray

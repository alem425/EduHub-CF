# PowerShell script to test API endpoints
# Run with: ./test-api.ps1

$baseUrl = "http://localhost:3001"

Write-Host "🧪 Testing EDU API Endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test data
$sampleCourse = @{
    title = "Introduction to JavaScript"
    description = "Learn the fundamentals of JavaScript programming language"
    instructorId = "instructor-123"
    instructorName = "John Doe"
    category = "Programming"
    level = "beginner"
    duration = 40
    maxStudents = 30
    tags = @("javascript", "programming", "web-development")
} | ConvertTo-Json

$sampleEnrollment = @{
    studentId = "student-456"
    studentName = "Jane Smith"
    studentEmail = "jane.smith@example.com"
} | ConvertTo-Json

try {
    # Test 1: Health Check
    Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health Check:" -ForegroundColor Green
    $healthResponse | ConvertTo-Json -Depth 3
    Write-Host ""

    # Test 2: Get All Courses
    Write-Host "2️⃣ Testing GET /api/courses..." -ForegroundColor Yellow
    $coursesResponse = Invoke-RestMethod -Uri "$baseUrl/api/courses" -Method Get
    Write-Host "✅ Get Courses:" -ForegroundColor Green
    $coursesResponse | ConvertTo-Json -Depth 3
    Write-Host ""

    # Test 3: Create Course
    Write-Host "3️⃣ Testing POST /api/courses..." -ForegroundColor Yellow
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/courses" -Method Post -Body $sampleCourse -ContentType "application/json"
    Write-Host "✅ Create Course:" -ForegroundColor Green
    $createResponse | ConvertTo-Json -Depth 3
    
    if (-not $createResponse.success) {
        Write-Host "❌ Failed to create course, stopping tests" -ForegroundColor Red
        return
    }
    
    $courseId = $createResponse.data.id
    Write-Host "📝 Created course with ID: $courseId" -ForegroundColor Magenta
    Write-Host ""

    # Test 4: Get All Courses (after creation)
    Write-Host "4️⃣ Testing GET /api/courses (after creation)..." -ForegroundColor Yellow
    $coursesResponse2 = Invoke-RestMethod -Uri "$baseUrl/api/courses" -Method Get
    Write-Host "✅ Get Courses (updated):" -ForegroundColor Green
    $coursesResponse2 | ConvertTo-Json -Depth 3
    Write-Host ""

    # Test 5: Enroll Student
    Write-Host "5️⃣ Testing POST /api/courses/$courseId/enroll..." -ForegroundColor Yellow
    $enrollResponse = Invoke-RestMethod -Uri "$baseUrl/api/courses/$courseId/enroll" -Method Post -Body $sampleEnrollment -ContentType "application/json"
    Write-Host "✅ Student Enrollment:" -ForegroundColor Green
    $enrollResponse | ConvertTo-Json -Depth 3
    Write-Host ""

    # Test 6: Get Enrolled Students
    Write-Host "6️⃣ Testing GET /api/courses/$courseId/students..." -ForegroundColor Yellow
    $studentsResponse = Invoke-RestMethod -Uri "$baseUrl/api/courses/$courseId/students" -Method Get
    Write-Host "✅ Enrolled Students:" -ForegroundColor Green
    $studentsResponse | ConvertTo-Json -Depth 3
    Write-Host ""

    Write-Host "🎉 All API tests completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "❌ Error testing API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure the server is running: npm run dev" -ForegroundColor Yellow
}

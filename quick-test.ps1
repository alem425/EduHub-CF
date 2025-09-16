# Quick API connectivity test
$baseUrl = "https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net"

Write-Host "🔍 Testing API connectivity..." -ForegroundColor Cyan
Write-Host "📡 Base URL: $baseUrl" -ForegroundColor Gray

# Test 1: Health check
Write-Host "`n1️⃣ Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 30
    Write-Host "✅ Health check successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get all assignments
Write-Host "`n2️⃣ Testing assignments endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/assignments" -Method Get -TimeoutSec 30
    Write-Host "✅ Assignments endpoint successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Assignments endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Simple assignment creation (no files)
Write-Host "`n3️⃣ Testing simple assignment creation..." -ForegroundColor Yellow
$assignmentData = @{
    title = "Test Assignment"
    description = "Simple test without files"
    dueDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
    maxPoints = 100
    assignmentType = "homework"
    submissionFormat = "text"
    createdBy = "test-teacher"
    courseId = "test-course-123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/assignments/create" -Method Post -Body $assignmentData -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ Assignment creation successful!" -ForegroundColor Green
    Write-Host "Assignment ID: $($response.data.id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Assignment creation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n🏁 Connectivity test completed!" -ForegroundColor Cyan

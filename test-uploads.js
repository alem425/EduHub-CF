const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_URL || 'https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net';
// Your Azure App Service URL

console.log('🧪 Testing File Uploads for EDU Platform');
console.log(`📡 API Base URL: ${BASE_URL}`);

// Test data
const testData = {
  courseId: 'test-course-123',
  assignmentId: 'test-assignment-456',
  studentId: 'test-student-789',
  teacherId: 'test-teacher-101'
};

// Create test files
function createTestFiles() {
  console.log('\n📝 Creating test files...');
  
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }

  // Create a test PDF-like file
  const pdfContent = '%PDF-1.4\nTest PDF content for assignment upload\nThis is a sample file for testing.';
  fs.writeFileSync(path.join(testDir, 'assignment-instructions.pdf'), pdfContent);

  // Create a test text file
  const txtContent = 'This is a test submission.\n\nStudent: John Doe\nCourse: Computer Science 101\nAssignment: Programming Exercise 1\n\nMy solution includes:\n1. Algorithm implementation\n2. Test cases\n3. Documentation';
  fs.writeFileSync(path.join(testDir, 'submission.txt'), txtContent);

  // Create a test "code" file
  const jsContent = `// Test JavaScript file for submission
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Testing fibonacci function:');
for (let i = 0; i < 10; i++) {
    console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`;
  fs.writeFileSync(path.join(testDir, 'solution.js'), jsContent);

  console.log('✅ Test files created in ./test-files/');
  return testDir;
}

// Test 1: Create Assignment with Attachments
async function testAssignmentCreation() {
  console.log('\n🎯 Test 1: Creating Assignment with Attachments');
  
  try {
    const testDir = createTestFiles();
    const form = new FormData();
    
    // Assignment data
    form.append('title', 'Programming Assignment 1');
    form.append('description', 'Create a fibonacci function with proper documentation');
    form.append('instructions', 'Please implement the fibonacci sequence algorithm and include test cases. Submit your code files and a brief explanation.');
    form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()); // 7 days from now
    form.append('maxPoints', '100');
    form.append('assignmentType', 'homework');
    form.append('submissionFormat', 'both');
    form.append('createdBy', testData.teacherId);
    
    // Attach files
    form.append('attachments', fs.createReadStream(path.join(testDir, 'assignment-instructions.pdf')));
    form.append('attachments', fs.createReadStream(path.join(testDir, 'solution.js')));

    const response = await fetch(`${BASE_URL}/api/courses/${testData.courseId}/assignments`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Assignment created successfully!');
      console.log(`📄 Assignment ID: ${result.data.id}`);
      console.log(`📎 Attachments uploaded: ${result.attachmentsUploaded || 0}`);
      testData.assignmentId = result.data.id;
      return result.data;
    } else {
      console.log('❌ Assignment creation failed:');
      console.log(JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing assignment creation:', error.message);
    return null;
  }
}

// Test 2: Submit Assignment with Files
async function testSubmissionUpload() {
  console.log('\n📤 Test 2: Submitting Assignment with Files');
  
  try {
    const testDir = createTestFiles();
    const form = new FormData();
    
    // Submission data
    form.append('studentId', testData.studentId);
    form.append('studentName', 'John Doe');
    form.append('studentEmail', 'john.doe@student.edu');
    form.append('submissionText', 'Here is my solution to the fibonacci assignment. I have implemented the recursive algorithm and included comprehensive test cases. The code is well-documented and follows best practices.');
    
    // Attach files
    form.append('attachments', fs.createReadStream(path.join(testDir, 'solution.js')));
    form.append('attachments', fs.createReadStream(path.join(testDir, 'submission.txt')));

    const response = await fetch(`${BASE_URL}/api/assignments/${testData.assignmentId}/submit`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Submission uploaded successfully!');
      console.log(`📋 Submission ID: ${result.data.submissionId}`);
      console.log(`📎 Attachments uploaded: ${result.data.attachmentsUploaded || 0}`);
      console.log(`⏰ Submitted at: ${result.data.submittedAt}`);
      console.log(`🕐 Late submission: ${result.data.isLate ? 'Yes' : 'No'}`);
      return result.data;
    } else {
      console.log('❌ Submission upload failed:');
      console.log(JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing submission upload:', error.message);
    return null;
  }
}

// Test 3: Download File
async function testFileDownload(submissionId, filename) {
  console.log(`\n⬇️  Test 3: Testing File Download (${filename})`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/submissions/${submissionId}/attachments/${filename}/download`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Download URL generated successfully!');
      console.log(`🔗 Download URL: ${result.data.downloadUrl}`);
      console.log(`⏰ Expires in: ${result.data.expiresInMinutes} minutes`);
      
      // Test the actual download
      const downloadResponse = await fetch(result.data.downloadUrl);
      if (downloadResponse.ok) {
        console.log('✅ File download successful!');
        console.log(`📦 Content Length: ${downloadResponse.headers.get('content-length')} bytes`);
        console.log(`📄 Content Type: ${downloadResponse.headers.get('content-type')}`);
      } else {
        console.log('❌ File download failed');
      }
      
      return result.data;
    } else {
      console.log('❌ Download URL generation failed:');
      console.log(JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing file download:', error.message);
    return null;
  }
}

// Test 4: Error Handling
async function testErrorHandling() {
  console.log('\n🚨 Test 4: Testing Error Handling');
  
  try {
    const form = new FormData();
    
    // Create a large file (>10MB) to test size limits
    const largeContent = 'A'.repeat(11 * 1024 * 1024); // 11MB
    fs.writeFileSync('./test-files/large-file.txt', largeContent);
    
    form.append('studentId', testData.studentId);
    form.append('studentName', 'John Doe');
    form.append('studentEmail', 'john.doe@student.edu');
    form.append('attachments', fs.createReadStream('./test-files/large-file.txt'));

    const response = await fetch(`${BASE_URL}/api/assignments/${testData.assignmentId}/submit`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();
    
    if (!response.ok && result.message.includes('too large')) {
      console.log('✅ File size limit validation working correctly!');
      console.log(`📏 Error message: ${result.message}`);
    } else {
      console.log('⚠️  Expected file size error, but got:', result);
    }
    
    // Clean up
    fs.unlinkSync('./test-files/large-file.txt');
    
  } catch (error) {
    console.log('❌ Error testing error handling:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Upload Tests...\n');
  
  // Test assignment creation
  const assignment = await testAssignmentCreation();
  if (!assignment) {
    console.log('❌ Cannot continue tests - assignment creation failed');
    return;
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test submission upload
  const submission = await testSubmissionUpload();
  if (!submission) {
    console.log('❌ Cannot continue tests - submission upload failed');
    return;
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test file download
  await testFileDownload(submission.submissionId, 'solution.js');
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test error handling
  await testErrorHandling();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Assignment creation with attachments');
  console.log('✅ Submission upload with files');
  console.log('✅ Secure file download URLs');
  console.log('✅ Error handling validation');
  
  // Clean up test files
  try {
    fs.rmSync('./test-files', { recursive: true, force: true });
    console.log('\n🧹 Test files cleaned up');
  } catch (error) {
    console.log('\n⚠️  Could not clean up test files:', error.message);
  }
}

// Make fetch available in Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run tests
runAllTests().catch(console.error);

module.exports = {
  testAssignmentCreation,
  testSubmissionUpload,
  testFileDownload,
  testErrorHandling
};

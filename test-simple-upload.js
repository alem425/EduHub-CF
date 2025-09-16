const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net';

console.log('🧪 Simple Upload Test');

// Test 1: Assignment creation WITHOUT files first
async function testAssignmentWithoutFiles() {
    console.log('\n🎯 Test 1: Assignment creation WITHOUT files');
    
    try {
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                courseId: 'test-course-123',
                title: 'Simple Test Assignment',
                description: 'Testing assignment creation without files',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                maxPoints: 100,
                assignmentType: 'homework',
                submissionFormat: 'text',
                createdBy: 'test-teacher'
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Assignment created successfully (no files)!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            return result.data.id;
        } else {
            console.log('❌ Assignment creation failed:');
            console.log(JSON.stringify(result, null, 2));
            return null;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return null;
    }
}

// Test 2: Assignment creation WITH files (minimal form)
async function testAssignmentWithFiles() {
    console.log('\n🎯 Test 2: Assignment creation WITH files');
    
    try {
        // Create a simple test file
        const testContent = 'This is a simple test file for upload testing.';
        fs.writeFileSync('simple-test.txt', testContent);
        
        const form = new FormData();
        
        // Add form fields one by one
        form.append('courseId', 'test-course-123');
        form.append('title', 'File Upload Test Assignment');
        form.append('description', 'Testing file uploads');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'both');
        form.append('createdBy', 'test-teacher');
        
        // Add a single file
        form.append('attachments', fs.createReadStream('simple-test.txt'));
        
        console.log('📤 Sending form data...');
        
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Assignment with files created successfully!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            console.log(`📎 Attachments: ${result.attachmentsUploaded || 0}`);
        } else {
            console.log('❌ Assignment with files failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
        
        // Clean up
        fs.unlinkSync('simple-test.txt');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Test 3: Check what the course endpoint expects
async function testCourseEndpoint() {
    console.log('\n🎯 Test 3: Testing course-specific endpoint');
    
    try {
        // Create a simple test file
        const testContent = 'Course endpoint test file.';
        fs.writeFileSync('course-test.txt', testContent);
        
        const form = new FormData();
        
        // Use course-specific endpoint format
        form.append('title', 'Course Endpoint Test');
        form.append('description', 'Testing course-specific upload');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'both');
        form.append('createdBy', 'test-teacher');
        form.append('attachments', fs.createReadStream('course-test.txt'));
        
        console.log('📤 Testing course endpoint...');
        
        const response = await fetch(`${BASE_URL}/api/courses/test-course-123/assignments`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Course endpoint assignment created successfully!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            console.log(`📎 Attachments: ${result.attachmentsUploaded || 0}`);
        } else {
            console.log('❌ Course endpoint failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
        
        // Clean up
        fs.unlinkSync('course-test.txt');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Run tests
async function runTests() {
    // Make fetch available
    if (typeof fetch === 'undefined') {
        global.fetch = require('node-fetch');
    }
    
    console.log(`📡 Testing: ${BASE_URL}`);
    
    // Test without files first
    await testAssignmentWithoutFiles();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test with files (assignments endpoint)
    await testAssignmentWithFiles();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test course endpoint
    await testCourseEndpoint();
    
    console.log('\n🏁 Simple tests completed!');
}

runTests().catch(console.error);

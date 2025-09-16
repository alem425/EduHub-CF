const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net';

console.log('🔍 Raw Form Data Test');

// Test with minimal form data
async function testMinimalForm() {
    console.log('\n📋 Testing minimal form data...');
    
    try {
        const form = new FormData();
        
        // Add only required fields, no files
        form.append('courseId', 'bd046644-b94c-4b9d-b2e1-b3507480baac'); // Use the course ID from debug test
        form.append('title', 'Minimal Form Test');
        form.append('description', 'Testing minimal form');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'text');
        form.append('createdBy', 'test-teacher');
        
        console.log('📤 Sending minimal form (no files)...');
        
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Minimal form worked!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            return result.data.id;
        } else {
            console.log('❌ Minimal form failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
            return null;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return null;
    }
}

// Test with empty file field
async function testEmptyFileField() {
    console.log('\n📋 Testing with empty attachments field...');
    
    try {
        const form = new FormData();
        
        form.append('courseId', 'bd046644-b94c-4b9d-b2e1-b3507480baac');
        form.append('title', 'Empty Attachments Test');
        form.append('description', 'Testing empty attachments field');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'both');
        form.append('createdBy', 'test-teacher');
        
        // Add empty attachments field
        form.append('attachments', '');
        
        console.log('📤 Sending with empty attachments field...');
        
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Empty attachments field worked!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
        } else {
            console.log('❌ Empty attachments field failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Test with single small file
async function testSingleSmallFile() {
    console.log('\n📋 Testing with single small file...');
    
    try {
        // Create a very small file
        const smallContent = 'test';
        fs.writeFileSync('tiny.txt', smallContent);
        
        const form = new FormData();
        
        form.append('courseId', 'bd046644-b94c-4b9d-b2e1-b3507480baac');
        form.append('title', 'Small File Test');
        form.append('description', 'Testing single small file');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'both');
        form.append('createdBy', 'test-teacher');
        
        // Add single small file
        form.append('attachments', fs.createReadStream('tiny.txt'), {
            filename: 'tiny.txt',
            contentType: 'text/plain'
        });
        
        console.log('📤 Sending with single small file...');
        console.log(`📏 File size: ${fs.statSync('tiny.txt').size} bytes`);
        
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Single small file worked!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            console.log(`📎 Attachments: ${result.attachmentsUploaded || 0}`);
        } else {
            console.log('❌ Single small file failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
        
        // Clean up
        fs.unlinkSync('tiny.txt');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Test using course endpoint instead
async function testCourseEndpoint() {
    console.log('\n📋 Testing course endpoint directly...');
    
    try {
        // Create a small file
        const smallContent = 'course endpoint test';
        fs.writeFileSync('course-tiny.txt', smallContent);
        
        const form = new FormData();
        
        // Don't include courseId since it's in the URL
        form.append('title', 'Course Endpoint Test');
        form.append('description', 'Testing course endpoint');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'both');
        form.append('createdBy', 'test-teacher');
        
        form.append('attachments', fs.createReadStream('course-tiny.txt'), {
            filename: 'course-tiny.txt',
            contentType: 'text/plain'
        });
        
        console.log('📤 Sending to course endpoint...');
        
        const response = await fetch(`${BASE_URL}/api/courses/bd046644-b94c-4b9d-b2e1-b3507480baac/assignments`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Course endpoint worked!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            console.log(`📎 Attachments: ${result.attachmentsUploaded || 0}`);
        } else {
            console.log('❌ Course endpoint failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
        
        // Clean up
        fs.unlinkSync('course-tiny.txt');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Run tests
async function runRawFormTests() {
    if (typeof fetch === 'undefined') {
        global.fetch = require('node-fetch');
    }
    
    console.log(`📡 Testing: ${BASE_URL}\n`);
    
    await testMinimalForm();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testEmptyFileField();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testSingleSmallFile();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCourseEndpoint();
    
    console.log('\n🏁 Raw form tests completed!');
}

runRawFormTests().catch(console.error);

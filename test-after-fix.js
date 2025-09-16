const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net';

console.log('🔧 Testing After Body Parser Fix');

async function quickUploadTest() {
    if (typeof fetch === 'undefined') {
        global.fetch = require('node-fetch');
    }
    
    console.log(`📡 Testing: ${BASE_URL}`);
    
    try {
        // Create a simple test file
        const content = 'This is a test file after the body parser fix.';
        fs.writeFileSync('fix-test.txt', content);
        
        const form = new FormData();
        
        form.append('courseId', 'bd046644-b94c-4b9d-b2e1-b3507480baac'); // Use existing course
        form.append('title', 'Body Parser Fix Test');
        form.append('description', 'Testing after fixing body parser conflict');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'both');
        form.append('createdBy', 'test-teacher');
        
        form.append('attachments', fs.createReadStream('fix-test.txt'), {
            filename: 'fix-test.txt',
            contentType: 'text/plain'
        });
        
        console.log('\n📤 Testing file upload after fix...');
        
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('🎉 SUCCESS! File upload is now working!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            console.log(`📎 Attachments uploaded: ${result.attachmentsUploaded || 0}`);
            
            // Test submission too
            await testSubmission(result.data.id);
            
        } else {
            console.log('❌ Still failing after fix:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
        
        // Clean up
        fs.unlinkSync('fix-test.txt');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

async function testSubmission(assignmentId) {
    console.log('\n📤 Testing submission upload...');
    
    try {
        const content = 'This is my submission after the fix.';
        fs.writeFileSync('submission-fix.txt', content);
        
        const form = new FormData();
        
        form.append('studentId', 'test-student-456');
        form.append('studentName', 'Test Student');
        form.append('studentEmail', 'student@test.edu');
        form.append('submissionText', 'My submission text after the body parser fix.');
        
        form.append('attachments', fs.createReadStream('submission-fix.txt'), {
            filename: 'submission-fix.txt',
            contentType: 'text/plain'
        });
        
        const response = await fetch(`${BASE_URL}/api/assignments/${assignmentId}/submit`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('🎉 Submission upload also working!');
            console.log(`📋 Submission ID: ${result.data.submissionId}`);
            console.log(`📎 Attachments: ${result.data.attachmentsUploaded || 0}`);
        } else {
            console.log('❌ Submission still failing:');
            console.log(JSON.stringify(result, null, 2));
        }
        
        fs.unlinkSync('submission-fix.txt');
        
    } catch (error) {
        console.log('❌ Submission error:', error.message);
    }
}

quickUploadTest().catch(console.error);

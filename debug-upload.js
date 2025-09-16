const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net';

console.log('🔍 Debug Upload Issues');

// Step 1: Create a course first
async function createCourse() {
    console.log('\n📚 Step 1: Creating a course...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Test Course for Uploads',
                description: 'A test course for file upload testing',
                instructorId: 'test-instructor-123',
                instructorName: 'Test Instructor',
                category: 'Computer Science',
                level: 'beginner',
                duration: 10,
                maxStudents: 50,
                tags: ['test', 'uploads']
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Course created successfully!');
            console.log(`📚 Course ID: ${result.data.id}`);
            return result.data.id;
        } else {
            console.log('❌ Course creation failed:');
            console.log(JSON.stringify(result, null, 2));
            return 'test-course-123'; // Use fallback
        }
    } catch (error) {
        console.log('❌ Error creating course:', error.message);
        return 'test-course-123'; // Use fallback
    }
}

// Step 2: Test assignment without files
async function testAssignmentNoFiles(courseId) {
    console.log('\n📝 Step 2: Creating assignment without files...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                courseId: courseId,
                title: 'No Files Test Assignment',
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
            console.log('✅ Assignment (no files) created successfully!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            return result.data.id;
        } else {
            console.log('❌ Assignment (no files) creation failed:');
            console.log(JSON.stringify(result, null, 2));
            return null;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return null;
    }
}

// Step 3: Test with proper file types
async function testWithProperFileTypes(courseId) {
    console.log('\n📎 Step 3: Testing with proper file types...');
    
    try {
        // Create files with explicit MIME types that should be allowed
        const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF';
        fs.writeFileSync('test.pdf', pdfContent);
        
        const txtContent = 'This is a plain text file for testing uploads.\nIt should be allowed as text/plain MIME type.';
        fs.writeFileSync('test.txt', txtContent);
        
        const form = new FormData();
        
        // Add form fields
        form.append('courseId', courseId);
        form.append('title', 'Proper File Types Test');
        form.append('description', 'Testing with PDF and TXT files');
        form.append('dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        form.append('maxPoints', '100');
        form.append('assignmentType', 'homework');
        form.append('submissionFormat', 'both');
        form.append('createdBy', 'test-teacher');
        
        // Add files with explicit MIME types
        form.append('attachments', fs.createReadStream('test.pdf'), {
            filename: 'test.pdf',
            contentType: 'application/pdf'
        });
        
        form.append('attachments', fs.createReadStream('test.txt'), {
            filename: 'test.txt',
            contentType: 'text/plain'
        });
        
        console.log('📤 Sending with proper MIME types...');
        
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Assignment with proper files created!');
            console.log(`📄 Assignment ID: ${result.data.id}`);
            console.log(`📎 Attachments: ${result.attachmentsUploaded || 0}`);
        } else {
            console.log('❌ Assignment with proper files failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
        
        // Clean up
        fs.unlinkSync('test.pdf');
        fs.unlinkSync('test.txt');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Step 4: Test submission upload
async function testSubmission(assignmentId) {
    if (!assignmentId) {
        console.log('\n⚠️ Skipping submission test - no assignment ID');
        return;
    }
    
    console.log('\n📤 Step 4: Testing submission upload...');
    
    try {
        const form = new FormData();
        
        // Create a simple submission file
        const submissionContent = 'This is my submission for the assignment.\n\nI have completed all the required tasks.';
        fs.writeFileSync('submission.txt', submissionContent);
        
        form.append('studentId', 'test-student-123');
        form.append('studentName', 'Test Student');
        form.append('studentEmail', 'student@test.com');
        form.append('submissionText', 'Here is my submission text.');
        
        form.append('attachments', fs.createReadStream('submission.txt'), {
            filename: 'submission.txt',
            contentType: 'text/plain'
        });
        
        console.log('📤 Submitting assignment...');
        
        const response = await fetch(`${BASE_URL}/api/assignments/${assignmentId}/submit`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Submission uploaded successfully!');
            console.log(`📋 Submission ID: ${result.data.submissionId}`);
            console.log(`📎 Attachments: ${result.data.attachmentsUploaded || 0}`);
        } else {
            console.log('❌ Submission upload failed:');
            console.log(`Status: ${response.status}`);
            console.log(JSON.stringify(result, null, 2));
        }
        
        // Clean up
        fs.unlinkSync('submission.txt');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Run all debug steps
async function runDebugTests() {
    // Make fetch available
    if (typeof fetch === 'undefined') {
        global.fetch = require('node-fetch');
    }
    
    console.log(`📡 Debug Testing: ${BASE_URL}\n`);
    
    // Step 1: Create course
    const courseId = await createCourse();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Test assignment without files
    const assignmentId = await testAssignmentNoFiles(courseId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Test with proper file types
    await testWithProperFileTypes(courseId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Test submission
    await testSubmission(assignmentId);
    
    console.log('\n🏁 Debug tests completed!');
    console.log('\n💡 Key findings:');
    console.log('- Course creation: Check if successful');
    console.log('- Assignment without files: Should work');
    console.log('- File uploads: Check MIME type validation');
    console.log('- Form parsing: Check multer configuration');
}

runDebugTests().catch(console.error);

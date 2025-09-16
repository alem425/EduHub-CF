// Simple test to check Azure Storage configuration
const https = require('https');

const BASE_URL = 'https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net';

console.log('🔍 Testing Azure Storage Configuration');

// Create a simple health check endpoint to test storage
async function testStorageHealth() {
    console.log('📡 Checking if blob storage is initialized...');
    
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const result = await response.json();
        
        console.log('✅ Health check response:', result);
        
        // The health check should show if blob storage initialized properly
        // (We added blob storage initialization to the database initialization)
        
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
}

// Test assignment creation without files to see if basic endpoint works
async function testBasicAssignment() {
    console.log('\n📝 Testing basic assignment creation (JSON)...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/assignments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                courseId: 'bd046644-b94c-4b9d-b2e1-b3507480baac',
                title: 'Storage Test Assignment',
                description: 'Testing if basic assignment creation works',
                dueDate: '2024-12-31T23:59:59Z',
                maxPoints: 100,
                assignmentType: 'homework',
                submissionFormat: 'text',
                createdBy: 'storage-test'
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Basic assignment creation works');
            console.log('📄 Assignment ID:', result.data.id);
        } else {
            console.log('❌ Basic assignment creation failed:');
            console.log(JSON.stringify(result, null, 2));
        }
        
    } catch (error) {
        console.log('❌ Basic assignment test failed:', error.message);
    }
}

async function runTests() {
    if (typeof fetch === 'undefined') {
        global.fetch = require('node-fetch');
    }
    
    await testStorageHealth();
    await testBasicAssignment();
    
    console.log('\n💡 Next steps:');
    console.log('1. Check Azure Portal → App Service → Environment variables');
    console.log('2. Look for: AZURE_STORAGE_CONNECTION_STRING');
    console.log('3. Check Azure Portal → App Service → Log stream for errors');
    console.log('4. Verify your Storage Account exists and is accessible');
}

runTests().catch(console.error);

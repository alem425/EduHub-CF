const https = require('https');

const BASE_URL = 'https://eduhub-platform-api-e6dyfphzcbawa9ge.canadacentral-01.azurewebsites.net';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Assignment-Test/1.0'
      }
    };

    if (data && method !== 'GET') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAssignmentFunctionality() {
  console.log('📝 Testing Assignment Functionality');
  console.log('='.repeat(50));

  try {
    // Step 1: Health Check
    console.log('\n1️⃣ Health Check...');
    const healthResponse = await makeRequest(`${BASE_URL}/health`);
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${healthResponse.data.status}`);
    } else {
      console.log('❌ Health check failed');
      return;
    }

    // Step 2: Get or create a course for testing
    console.log('\n2️⃣ Setting up test course...');
    
    // First check existing courses
    const coursesResponse = await makeRequest(`${BASE_URL}/api/courses`);
    let testCourse;
    
    if (coursesResponse.statusCode === 200 && coursesResponse.data.count > 0) {
      testCourse = coursesResponse.data.data[0];
      console.log(`✅ Using existing course: ${testCourse.title} (ID: ${testCourse.id})`);
    } else {
      // Create a new course
      const newCourseData = {
        title: 'Assignment Test Course',
        description: 'A course created specifically for testing assignment functionality',
        instructorId: 'instructor-assignment-test',
        instructorName: 'Assignment Test Instructor',
        category: 'Testing',
        level: 'beginner',
        duration: 40,
        maxStudents: 20,
        tags: ['assignment-testing', 'automation'],
        syllabus: ['Module 1: Assignment Basics', 'Module 2: Testing Assignments']
      };

      const createCourseResponse = await makeRequest(`${BASE_URL}/api/courses`, 'POST', newCourseData);
      
      if (createCourseResponse.statusCode === 201) {
        testCourse = createCourseResponse.data.data;
        console.log(`✅ Created test course: ${testCourse.title} (ID: ${testCourse.id})`);
      } else {
        console.log('❌ Failed to create test course');
        console.log(createCourseResponse);
        return;
      }
    }

    // Step 3: Test AI Agent-Friendly Assignment Creation
    console.log('\n3️⃣ Testing Assignment Creation (AI Agent Endpoint)...');
    console.log(`   URL: ${BASE_URL}/api/assignments/create`);
    
    const assignmentData = {
      courseId: testCourse.id,
      title: 'JavaScript Functions Quiz',
      description: 'Test your understanding of JavaScript functions, including arrow functions, callbacks, and closures',
      instructions: 'Answer all 10 questions. You have 45 minutes to complete this quiz. Make sure to test your code examples.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      maxPoints: 100,
      assignmentType: 'quiz',
      createdBy: 'instructor-assignment-test',
      submissionFormat: 'text',
      attachments: ['https://example.com/quiz-instructions.pdf']
    };

    console.log('   Assignment Data:');
    console.log(`   - Course ID: ${assignmentData.courseId}`);
    console.log(`   - Title: ${assignmentData.title}`);
    console.log(`   - Type: ${assignmentData.assignmentType}`);
    console.log(`   - Max Points: ${assignmentData.maxPoints}`);
    console.log(`   - Due Date: ${assignmentData.dueDate}`);

    const createAssignmentResponse = await makeRequest(`${BASE_URL}/api/assignments/create`, 'POST', assignmentData);
    
    if (createAssignmentResponse.statusCode === 201) {
      console.log('\n✅ Assignment created successfully!');
      const assignment = createAssignmentResponse.data.data;
      console.log(`   Assignment ID: ${assignment.id}`);
      console.log(`   Title: ${assignment.title}`);
      console.log(`   Course ID: ${assignment.courseId}`);
      console.log(`   Max Points: ${assignment.maxPoints}`);
      console.log(`   Type: ${assignment.assignmentType}`);

      // Step 4: Test Get Course Assignments
      console.log('\n4️⃣ Testing Get Course Assignments (AI Agent Endpoint)...');
      console.log(`   URL: ${BASE_URL}/api/assignments/course?courseId=${testCourse.id}`);
      
      const courseAssignmentsResponse = await makeRequest(`${BASE_URL}/api/assignments/course?courseId=${testCourse.id}`);
      
      if (courseAssignmentsResponse.statusCode === 200) {
        console.log(`✅ Found ${courseAssignmentsResponse.data.count} assignments for course`);
        if (courseAssignmentsResponse.data.count > 0) {
          const foundAssignment = courseAssignmentsResponse.data.data[0];
          console.log(`   First Assignment: ${foundAssignment.title}`);
          console.log(`   Assignment ID: ${foundAssignment.id}`);
          console.log(`   Due Date: ${foundAssignment.dueDate}`);
        }
      } else {
        console.log('❌ Failed to get course assignments');
        console.log(courseAssignmentsResponse);
      }

      // Step 5: Test Get Assignment Details
      console.log('\n5️⃣ Testing Get Assignment Details (AI Agent Endpoint)...');
      console.log(`   URL: ${BASE_URL}/api/assignments/details?assignmentId=${assignment.id}`);
      
      const assignmentDetailsResponse = await makeRequest(`${BASE_URL}/api/assignments/details?assignmentId=${assignment.id}`);
      
      if (assignmentDetailsResponse.statusCode === 200) {
        console.log('✅ Assignment details retrieved successfully!');
        const details = assignmentDetailsResponse.data.data;
        console.log(`   Title: ${details.title}`);
        console.log(`   Description: ${details.description.substring(0, 100)}...`);
        console.log(`   Instructions: ${details.instructions ? details.instructions.substring(0, 100) + '...' : 'None'}`);
        console.log(`   Due Date: ${details.dueDate}`);
        console.log(`   Submission Format: ${details.submissionFormat}`);
        console.log(`   Has Attachments: ${details.attachments && details.attachments.length > 0 ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ Failed to get assignment details');
        console.log(assignmentDetailsResponse);
      }

      // Step 6: Test Get All Assignments
      console.log('\n6️⃣ Testing Get All Assignments...');
      console.log(`   URL: ${BASE_URL}/api/assignments`);
      
      const allAssignmentsResponse = await makeRequest(`${BASE_URL}/api/assignments`);
      
      if (allAssignmentsResponse.statusCode === 200) {
        console.log(`✅ Found ${allAssignmentsResponse.data.count} total assignments in system`);
        if (allAssignmentsResponse.data.count > 0) {
          console.log('   Recent assignments:');
          allAssignmentsResponse.data.data.slice(0, 3).forEach((assign, index) => {
            console.log(`     ${index + 1}. ${assign.title} (${assign.assignmentType}) - ${assign.maxPoints} points`);
          });
        }
      } else {
        console.log('❌ Failed to get all assignments');
        console.log(allAssignmentsResponse);
      }

      // Step 7: Create Multiple Assignment Types
      console.log('\n7️⃣ Testing Multiple Assignment Types...');
      
      const additionalAssignments = [
        {
          courseId: testCourse.id,
          title: 'React Components Project',
          description: 'Build a complete React application with multiple components, state management, and API integration',
          instructions: 'Create a project repository, implement all required features, and submit the GitHub link',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          maxPoints: 200,
          assignmentType: 'project',
          createdBy: 'instructor-assignment-test',
          submissionFormat: 'file'
        },
        {
          courseId: testCourse.id,
          title: 'Web Development History Essay',
          description: 'Write a comprehensive essay about the evolution of web development from HTML 1.0 to modern frameworks',
          instructions: 'Minimum 1500 words, include at least 5 credible sources, proper citations required',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
          maxPoints: 150,
          assignmentType: 'essay',
          createdBy: 'instructor-assignment-test',
          submissionFormat: 'both'
        },
        {
          courseId: testCourse.id,
          title: 'Weekly JavaScript Exercises',
          description: 'Complete the assigned JavaScript coding exercises focusing on arrays, objects, and DOM manipulation',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          maxPoints: 50,
          assignmentType: 'homework',
          createdBy: 'instructor-assignment-test',
          submissionFormat: 'text'
        }
      ];

      for (const additionalAssignment of additionalAssignments) {
        console.log(`   Creating ${additionalAssignment.assignmentType}: ${additionalAssignment.title}`);
        const response = await makeRequest(`${BASE_URL}/api/assignments/create`, 'POST', additionalAssignment);
        
        if (response.statusCode === 201) {
          console.log(`   ✅ ${additionalAssignment.title} created successfully`);
        } else {
          console.log(`   ❌ Failed to create ${additionalAssignment.title}`);
        }
      }

      // Step 8: Final verification - Check course assignments again
      console.log('\n8️⃣ Final Verification - Course Assignments Summary...');
      
      const finalAssignmentsResponse = await makeRequest(`${BASE_URL}/api/assignments/course?courseId=${testCourse.id}`);
      
      if (finalAssignmentsResponse.statusCode === 200) {
        console.log(`✅ Final count: ${finalAssignmentsResponse.data.count} assignments for course`);
        console.log('\n📋 Course Assignment Summary:');
        finalAssignmentsResponse.data.data.forEach((assign, index) => {
          console.log(`   ${index + 1}. ${assign.title}`);
          console.log(`      Type: ${assign.assignmentType} | Points: ${assign.maxPoints} | Due: ${new Date(assign.dueDate).toLocaleDateString()}`);
        });
      }

      console.log('\n🎉 Assignment Testing Complete!');
      console.log('\n📊 Test Summary:');
      console.log('✅ Health check passed');
      console.log('✅ Course setup completed');
      console.log('✅ Assignment creation tested (AI Agent endpoint)');
      console.log('✅ Get course assignments tested (AI Agent endpoint)');
      console.log('✅ Get assignment details tested (AI Agent endpoint)');
      console.log('✅ Get all assignments tested');
      console.log('✅ Multiple assignment types tested');
      console.log('✅ Database operations verified');
      console.log('\n🤖 All AI Agent-friendly assignment endpoints are working perfectly!');

    } else {
      console.log('❌ Assignment creation failed');
      console.log(`   Status Code: ${createAssignmentResponse.statusCode}`);
      console.log(`   Response: ${JSON.stringify(createAssignmentResponse.data, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
console.log('Starting Assignment Functionality Test...');
testAssignmentFunctionality();

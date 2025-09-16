import { cosmosClient } from '../config/database';
import { Submission, SubmissionAttachment, Assignment, SubmissionReference } from '../models/Course';
import { CourseService } from './courseService';
import { AssignmentService } from './assignmentService';
import { v4 as uuidv4 } from 'uuid';

export class SubmissionService {
  private submissionsContainer = cosmosClient.getSubmissionsContainer();
  private courseService = new CourseService();
  private assignmentService = new AssignmentService();

  /**
   * Create a new submission for an assignment
   */
  async createSubmission(submissionData: {
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    submissionText?: string;
    attachments?: SubmissionAttachment[];
  }): Promise<Submission> {
    try {
      // 1. Get assignment details and validate
      const assignment = await this.assignmentService.getAssignmentById(submissionData.assignmentId);
      if (!assignment || !assignment.isActive) {
        throw new Error('Assignment not found or inactive');
      }

      // 2. Check if student is enrolled in the course
      const course = await this.courseService.getCourseById(assignment.courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const isEnrolled = course.enrolledStudents.some(student => student.studentId === submissionData.studentId);
      if (!isEnrolled) {
        throw new Error('Student not enrolled in this course');
      }

      // 3. Validate submission format
      await this.validateSubmissionFormat(assignment, submissionData);

      // 4. Check multiple submission rules
      const submissionNumber = await this.getNextSubmissionNumber(submissionData.assignmentId, submissionData.studentId, assignment);

      // 5. Check if submission is late
      const isLate = new Date() > new Date(assignment.dueDate);
      if (isLate && !assignment.allowLateSubmissions) {
        throw new Error('Late submissions are not allowed for this assignment');
      }

      // 6. Create submission document
      const submission: Submission = {
        id: uuidv4(),
        assignmentId: submissionData.assignmentId,
        courseId: assignment.courseId,
        studentId: submissionData.studentId,
        studentName: submissionData.studentName,
        studentEmail: submissionData.studentEmail,
        submissionText: submissionData.submissionText,
        attachments: submissionData.attachments || [],
        submittedAt: new Date(),
        isLate,
        status: 'submitted',
        submissionNumber,
        maxPoints: assignment.maxPoints,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // 7. Save submission to database
      const { resource } = await this.submissionsContainer.items.create(submission);
      const createdSubmission = resource!;

      // 8. Update assignment submission count
      await this.updateAssignmentSubmissionCount(submissionData.assignmentId);

      console.log(`✅ Created submission ${createdSubmission.id} for assignment ${submissionData.assignmentId}`);
      return createdSubmission;

    } catch (error: any) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for a specific assignment (teacher view)
   */
  async getAssignmentSubmissions(assignmentId: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    submissions: Submission[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM c WHERE c.assignmentId = @assignmentId AND c.isActive = true';
      const parameters = [{ name: '@assignmentId', value: assignmentId }];

      if (options?.status) {
        query += ' AND c.status = @status';
        parameters.push({ name: '@status', value: options.status });
      }

      query += ' ORDER BY c.submittedAt DESC';

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT VALUE COUNT(1)');
      const { resources: countResult } = await this.submissionsContainer.items.query({
        query: countQuery,
        parameters
      }).fetchAll();
      const total = countResult[0] || 0;

      // Get paginated results
      query += ` OFFSET ${offset} LIMIT ${limit}`;
      const { resources } = await this.submissionsContainer.items.query({
        query,
        parameters
      }).fetchAll();

      return {
        submissions: resources,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
      throw new Error('Failed to fetch assignment submissions');
    }
  }

  /**
   * Get a specific submission by ID
   */
  async getSubmissionById(submissionId: string): Promise<Submission | null> {
    try {
      // Query across partitions since we don't know the assignmentId
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @submissionId AND c.isActive = true',
        parameters: [{ name: '@submissionId', value: submissionId }]
      };

      const { resources } = await this.submissionsContainer.items.query(querySpec).fetchAll();
      return resources.length > 0 ? resources[0] : null;
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw new Error('Failed to fetch submission');
    }
  }

  /**
   * Get all submissions by a specific student
   */
  async getStudentSubmissions(studentId: string, courseId?: string): Promise<Submission[]> {
    try {
      let query = 'SELECT * FROM c WHERE c.studentId = @studentId AND c.isActive = true';
      const parameters = [{ name: '@studentId', value: studentId }];

      if (courseId) {
        query += ' AND c.courseId = @courseId';
        parameters.push({ name: '@courseId', value: courseId });
      }

      query += ' ORDER BY c.submittedAt DESC';

      const { resources } = await this.submissionsContainer.items.query({
        query,
        parameters
      }).fetchAll();

      return resources;
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      throw new Error('Failed to fetch student submissions');
    }
  }

  /**
   * Grade a submission
   */
  async gradeSubmission(submissionId: string, gradeData: {
    grade: number;
    feedback?: string;
    gradedBy: string;
  }): Promise<Submission> {
    try {
      const submission = await this.getSubmissionById(submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Validate grade
      if (gradeData.grade < 0 || gradeData.grade > submission.maxPoints) {
        throw new Error(`Grade must be between 0 and ${submission.maxPoints}`);
      }

      // Update submission with grade and feedback
      const updatedSubmission: Submission = {
        ...submission,
        grade: gradeData.grade,
        feedback: gradeData.feedback,
        gradedAt: new Date(),
        gradedBy: gradeData.gradedBy,
        status: 'graded',
        updatedAt: new Date()
      };

      const { resource } = await this.submissionsContainer
        .item(submissionId, submission.assignmentId)
        .replace(updatedSubmission);

      console.log(`✅ Graded submission ${submissionId} with score ${gradeData.grade}/${submission.maxPoints}`);
      return resource!;
    } catch (error: any) {
      if (error.message === 'Submission not found') {
        throw error;
      }
      console.error('Error grading submission:', error);
      throw new Error('Failed to grade submission');
    }
  }

  /**
   * Update submission status (e.g., return to student)
   */
  async updateSubmissionStatus(submissionId: string, status: 'submitted' | 'graded' | 'returned' | 'resubmitted'): Promise<Submission> {
    try {
      const submission = await this.getSubmissionById(submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      const updatedSubmission: Submission = {
        ...submission,
        status,
        updatedAt: new Date()
      };

      const { resource } = await this.submissionsContainer
        .item(submissionId, submission.assignmentId)
        .replace(updatedSubmission);

      return resource!;
    } catch (error: any) {
      if (error.message === 'Submission not found') {
        throw error;
      }
      console.error('Error updating submission status:', error);
      throw new Error('Failed to update submission status');
    }
  }

  /**
   * Delete/deactivate a submission
   */
  async deleteSubmission(submissionId: string): Promise<void> {
    try {
      const submission = await this.getSubmissionById(submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Soft delete
      await this.updateSubmissionStatus(submissionId, 'submitted');
      const updatedSubmission = { ...submission, isActive: false, updatedAt: new Date() };
      
      await this.submissionsContainer
        .item(submissionId, submission.assignmentId)
        .replace(updatedSubmission);

      // Update assignment submission count
      await this.updateAssignmentSubmissionCount(submission.assignmentId);

      console.log(`✅ Deleted submission ${submissionId}`);
    } catch (error: any) {
      if (error.message === 'Submission not found') {
        throw error;
      }
      console.error('Error deleting submission:', error);
      throw new Error('Failed to delete submission');
    }
  }

  // Private helper methods

  private async validateSubmissionFormat(assignment: Assignment, submissionData: any): Promise<void> {
    const hasText = submissionData.submissionText && submissionData.submissionText.trim().length > 0;
    const hasFiles = submissionData.attachments && submissionData.attachments.length > 0;

    switch (assignment.submissionFormat) {
      case 'text':
        if (!hasText) {
          throw new Error('Text submission is required for this assignment');
        }
        break;
      case 'file':
        if (!hasFiles) {
          throw new Error('File submission is required for this assignment');
        }
        break;
      case 'both':
        if (!hasText && !hasFiles) {
          throw new Error('Either text or file submission is required for this assignment');
        }
        break;
      default:
        throw new Error('Invalid submission format specified in assignment');
    }
  }

  private async getNextSubmissionNumber(assignmentId: string, studentId: string, assignment: Assignment): Promise<number> {
    try {
      // Check existing submissions for this student on this assignment
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.assignmentId = @assignmentId AND c.studentId = @studentId AND c.isActive = true ORDER BY c.submissionNumber DESC',
        parameters: [
          { name: '@assignmentId', value: assignmentId },
          { name: '@studentId', value: studentId }
        ]
      };

      const { resources } = await this.submissionsContainer.items.query(querySpec).fetchAll();
      
      if (resources.length === 0) {
        // First submission
        return 1;
      }

      // Check if multiple submissions are allowed
      if (!assignment.allowMultipleSubmissions) {
        throw new Error('Multiple submissions are not allowed for this assignment');
      }

      // Return next submission number
      const lastSubmission = resources[0];
      return lastSubmission.submissionNumber + 1;

    } catch (error: any) {
      if (error.message === 'Multiple submissions are not allowed for this assignment') {
        throw error;
      }
      console.error('Error getting submission number:', error);
      throw new Error('Failed to determine submission number');
    }
  }

  private async updateAssignmentSubmissionCount(assignmentId: string): Promise<void> {
    try {
      // Count active submissions for this assignment
      const countQuery = {
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.assignmentId = @assignmentId AND c.isActive = true',
        parameters: [{ name: '@assignmentId', value: assignmentId }]
      };

      const { resources } = await this.submissionsContainer.items.query(countQuery).fetchAll();
      const submissionCount = resources[0] || 0;

      // Update assignment with new count
      const assignment = await this.assignmentService.getAssignmentById(assignmentId);
      if (assignment) {
        await this.assignmentService.updateAssignment(assignmentId, { submissionCount });
        console.log(`✅ Updated assignment ${assignmentId} submission count to ${submissionCount}`);
      }
    } catch (error) {
      console.error('Error updating assignment submission count:', error);
      // Don't throw error here as it's not critical for submission creation
    }
  }
}

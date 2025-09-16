import { cosmosClient } from '../config/database';
import { Assignment, AssignmentReference } from '../models/Course';
import { CourseService } from './courseService';
import { v4 as uuidv4 } from 'uuid';

export class AssignmentService {
  private assignmentsContainer = cosmosClient.getAssignmentsContainer();
  private coursesContainer = cosmosClient.getCoursesContainer();
  private courseService = new CourseService();

  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      console.log(`🔍 Looking for assignments for course ID: ${courseId}`);
      
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.courseId = @courseId AND c.isActive = true ORDER BY c.dueDate ASC',
        parameters: [{ name: '@courseId', value: courseId }]
      };
      
      console.log(`🔍 Query: ${querySpec.query} with courseId = ${courseId}`);
      
      const { resources } = await this.assignmentsContainer.items.query(querySpec).fetchAll();
      
      console.log(`🔍 Query returned ${resources.length} assignments for course`);
      
      return resources;
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      throw new Error('Failed to fetch course assignments');
    }
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    try {
      console.log(`🔍 Looking for assignment ID: ${assignmentId}`);
      
      // We need to query across partitions since we don't know the courseId
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @assignmentId',
        parameters: [{ name: '@assignmentId', value: assignmentId }]
      };
      
      console.log(`🔍 Query: ${querySpec.query} with assignmentId = ${assignmentId}`);
      
      const { resources } = await this.assignmentsContainer.items.query(querySpec).fetchAll();
      
      console.log(`🔍 Query returned ${resources.length} results`);
      if (resources.length > 0) {
        console.log(`🔍 Found assignment: ${resources[0].title}`);
      }
      
      return resources.length > 0 ? resources[0] : null;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw new Error('Failed to fetch assignment');
    }
  }

  async createAssignment(assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment> {
    try {
      // Verify course exists
      const course = await this.coursesContainer.item(assignmentData.courseId, assignmentData.courseId).read();
      if (!course.resource) {
        throw new Error('Course not found');
      }

      const assignment: Assignment = {
        ...assignmentData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create the assignment in the assignments container
      const { resource } = await this.assignmentsContainer.items.create(assignment);
      const createdAssignment = resource!;

      // Create assignment reference for the course
      const assignmentReference: AssignmentReference = {
        assignmentId: createdAssignment.id,
        title: createdAssignment.title,
        dueDate: createdAssignment.dueDate,
        assignmentType: createdAssignment.assignmentType,
        maxPoints: createdAssignment.maxPoints
      };

      // Add assignment reference to the course
      try {
        await this.courseService.addAssignmentToCourse(assignmentData.courseId, assignmentReference);
        console.log(`✅ Added assignment reference to course ${assignmentData.courseId}`);
      } catch (error) {
        console.error('Error adding assignment to course:', error);
        // Note: We could implement rollback here if needed, but for now we'll log the error
        // The assignment was created successfully, but the course reference failed
      }

      return createdAssignment;
    } catch (error: any) {
      if (error.message === 'Course not found') {
        throw error;
      }
      console.error('Error creating assignment:', error);
      throw new Error('Failed to create assignment');
    }
  }

  async updateAssignment(assignmentId: string, updateData: Partial<Assignment>): Promise<Assignment> {
    try {
      const existingAssignment = await this.getAssignmentById(assignmentId);
      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      const updatedAssignment: Assignment = {
        ...existingAssignment,
        ...updateData,
        id: assignmentId,
        updatedAt: new Date()
      };

      const { resource } = await this.assignmentsContainer
        .item(assignmentId, existingAssignment.courseId)
        .replace(updatedAssignment);
      
      const finalUpdatedAssignment = resource!;

      // Check if any fields that are in the course reference were updated
      const fieldsToCheck = ['title', 'dueDate', 'assignmentType', 'maxPoints'];
      const shouldUpdateCourseReference = fieldsToCheck.some(field => updateData.hasOwnProperty(field));

      if (shouldUpdateCourseReference) {
        // Update assignment reference in the course
        const assignmentReference: AssignmentReference = {
          assignmentId: finalUpdatedAssignment.id,
          title: finalUpdatedAssignment.title,
          dueDate: finalUpdatedAssignment.dueDate,
          assignmentType: finalUpdatedAssignment.assignmentType,
          maxPoints: finalUpdatedAssignment.maxPoints
        };

        try {
          await this.courseService.updateAssignmentInCourse(finalUpdatedAssignment.courseId, assignmentReference);
          console.log(`✅ Updated assignment reference in course ${finalUpdatedAssignment.courseId}`);
        } catch (error) {
          console.error('Error updating assignment reference in course:', error);
          // Note: Assignment was updated successfully, but course reference update failed
        }
      }
      
      return finalUpdatedAssignment;
    } catch (error: any) {
      if (error.message === 'Assignment not found') {
        throw error;
      }
      console.error('Error updating assignment:', error);
      throw new Error('Failed to update assignment');
    }
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      const existingAssignment = await this.getAssignmentById(assignmentId);
      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      // Soft delete by setting isActive to false
      await this.updateAssignment(assignmentId, { isActive: false });

      // Remove assignment reference from the course
      try {
        await this.courseService.removeAssignmentFromCourse(existingAssignment.courseId, assignmentId);
        console.log(`✅ Removed assignment reference from course ${existingAssignment.courseId}`);
      } catch (error) {
        console.error('Error removing assignment reference from course:', error);
        // Note: Assignment was soft deleted successfully, but course reference removal failed
      }
    } catch (error: any) {
      if (error.message === 'Assignment not found') {
        throw error;
      }
      console.error('Error deleting assignment:', error);
      throw new Error('Failed to delete assignment');
    }
  }

  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.isActive = true ORDER BY c.dueDate ASC'
      };
      
      const { resources } = await this.assignmentsContainer.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      throw new Error('Failed to fetch assignments');
    }
  }
}

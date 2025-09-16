import { cosmosClient } from '../config/database';
import { Assignment } from '../models/Course';
import { v4 as uuidv4 } from 'uuid';

export class AssignmentService {
  private assignmentsContainer = cosmosClient.getAssignmentsContainer();
  private coursesContainer = cosmosClient.getCoursesContainer();

  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.courseId = @courseId AND c.isActive = true ORDER BY c.dueDate ASC',
        parameters: [{ name: '@courseId', value: courseId }]
      };
      
      const { resources } = await this.assignmentsContainer.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      throw new Error('Failed to fetch course assignments');
    }
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    try {
      // We need to query by assignment ID since we're using courseId as partition key
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @assignmentId',
        parameters: [{ name: '@assignmentId', value: assignmentId }]
      };
      
      const { resources } = await this.assignmentsContainer.items.query(querySpec).fetchAll();
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

      const { resource } = await this.assignmentsContainer.items.create(assignment);
      return resource!;
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
      
      return resource!;
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

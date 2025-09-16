import { cosmosClient } from '../config/database';
import { Course, Enrollment } from '../models/Course';
import { v4 as uuidv4 } from 'uuid';

export class CourseService {
  private coursesContainer = cosmosClient.getCoursesContainer();
  private enrollmentsContainer = cosmosClient.getEnrollmentsContainer();

  async getAllCourses(): Promise<Course[]> {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.isActive = true ORDER BY c.createdAt DESC'
      };
      
      const { resources } = await this.coursesContainer.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const { resource } = await this.coursesContainer.item(courseId, courseId).read();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course');
    }
  }

  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'currentEnrollments'>): Promise<Course> {
    try {
      const course: Course = {
        ...courseData,
        id: uuidv4(),
        currentEnrollments: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { resource } = await this.coursesContainer.items.create(course);
      return resource!;
    } catch (error) {
      console.error('Error creating course:', error);
      throw new Error('Failed to create course');
    }
  }

  async enrollStudent(courseId: string, studentId: string, studentName: string, studentEmail: string): Promise<Enrollment> {
    try {
      // Check if course exists and has capacity
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      if (course.currentEnrollments >= course.maxStudents) {
        throw new Error('Course is full');
      }

      // Check if student is already enrolled
      const existingEnrollment = await this.getEnrollment(courseId, studentId);
      if (existingEnrollment) {
        throw new Error('Student already enrolled in this course');
      }

      // Create enrollment
      const enrollment: Enrollment = {
        id: uuidv4(),
        courseId,
        studentId,
        studentName,
        studentEmail,
        enrolledAt: new Date(),
        status: 'enrolled',
        progress: 0
      };

      await this.enrollmentsContainer.items.create(enrollment);

      // Update course enrollment count
      course.currentEnrollments += 1;
      course.updatedAt = new Date();
      await this.coursesContainer.item(courseId, courseId).replace(course);

      return enrollment;
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
  }

  async getEnrolledStudents(courseId: string): Promise<Enrollment[]> {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.courseId = @courseId AND c.status = "enrolled"',
        parameters: [{ name: '@courseId', value: courseId }]
      };

      const { resources } = await this.enrollmentsContainer.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      throw new Error('Failed to fetch enrolled students');
    }
  }

  private async getEnrollment(courseId: string, studentId: string): Promise<Enrollment | null> {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.courseId = @courseId AND c.studentId = @studentId',
        parameters: [
          { name: '@courseId', value: courseId },
          { name: '@studentId', value: studentId }
        ]
      };

      const { resources } = await this.enrollmentsContainer.items.query(querySpec).fetchAll();
      return resources.length > 0 ? resources[0] : null;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return null;
    }
  }
}

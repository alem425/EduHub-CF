import { cosmosClient } from '../config/database';
import { Course, Enrollment, Student, EnrolledStudent } from '../models/Course';
import { v4 as uuidv4 } from 'uuid';

export class CourseService {
  private coursesContainer = cosmosClient.getCoursesContainer();
  private enrollmentsContainer = cosmosClient.getEnrollmentsContainer();
  private studentsContainer = cosmosClient.getStudentsContainer();

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

  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'currentEnrollments' | 'enrolledStudents'>): Promise<Course> {
    try {
      const course: Course = {
        ...courseData,
        id: uuidv4(),
        currentEnrollments: 0,
        enrolledStudents: [],
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

      // Check if student is already enrolled (check both enrollments and course's enrolledStudents array)
      const existingEnrollment = await this.getEnrollment(courseId, studentId);
      if (existingEnrollment) {
        throw new Error('Student already enrolled in this course');
      }

      const isAlreadyInCourse = course.enrolledStudents.some(student => student.studentId === studentId);
      if (isAlreadyInCourse) {
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

      // Add student to course's enrolledStudents array
      const enrolledStudent: EnrolledStudent = {
        studentId,
        studentName,
        enrolledAt: new Date()
      };

      course.enrolledStudents.push(enrolledStudent);
      course.currentEnrollments += 1;
      course.updatedAt = new Date();
      await this.coursesContainer.item(courseId, courseId).replace(course);

      // Create or update student document
      await this.createOrUpdateStudent(studentId, studentName, studentEmail, courseId);

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

  private async createOrUpdateStudent(studentId: string, studentName: string, studentEmail: string, courseId: string): Promise<Student> {
    try {
      // Try to get existing student
      let student: Student;
      try {
        const { resource } = await this.studentsContainer.item(studentId, studentId).read();
        if (resource) {
          student = resource;
          
          // Add the course to their enrolled courses if not already present
          if (!student.enrolledCourses.includes(courseId)) {
            student.enrolledCourses.push(courseId);
            student.updatedAt = new Date();
            await this.studentsContainer.item(studentId, studentId).replace(student);
          }
        } else {
          // Resource is null, treat as not found
          throw { code: 404 };
        }
      } catch (error: any) {
        if (error.code === 404) {
          // Create new student
          student = {
            id: studentId,
            name: studentName,
            email: studentEmail,
            enrolledCourses: [courseId],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          };
          
          const { resource } = await this.studentsContainer.items.create(student);
          student = resource!;
        } else {
          throw error;
        }
      }
      
      return student;
    } catch (error) {
      console.error('Error creating/updating student:', error);
      throw new Error('Failed to create/update student');
    }
  }

  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const { resource } = await this.studentsContainer.item(studentId, studentId).read();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error fetching student:', error);
      throw new Error('Failed to fetch student');
    }
  }

  async getAllStudents(): Promise<Student[]> {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.isActive = true ORDER BY c.name ASC'
      };
      
      const { resources } = await this.studentsContainer.items.query(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }
  }
}

import { Request, Response } from 'express';
import { CourseService } from '../services/courseService';
import Joi from 'joi';

const courseService = new CourseService();

// Validation schemas
const createCourseSchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10).max(1000),
  instructorId: Joi.string().required(),
  instructorName: Joi.string().required(),
  category: Joi.string().required(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  duration: Joi.number().positive().required(),
  maxStudents: Joi.number().positive().required(),
  isActive: Joi.boolean().default(true),
  tags: Joi.array().items(Joi.string()).default([]),
  syllabus: Joi.array().items(Joi.string()).optional(),
  prerequisites: Joi.array().items(Joi.string()).optional()
});

const enrollmentSchema = Joi.object({
  studentId: Joi.string().required(),
  studentName: Joi.string().required(),
  studentEmail: Joi.string().email().required()
});

export class CourseController {
  // GET /courses → List all available courses
  async getAllCourses(req: Request, res: Response) {
    try {
      const courses = await courseService.getAllCourses();
      res.json({
        success: true,
        data: courses,
        count: courses.length
      });
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /courses (teacher-only) → Create a new course
  async createCourse(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = createCourseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      // TODO: Add authentication middleware to verify user is a teacher
      // For now, we'll assume the user is authenticated and is a teacher

      const course = await courseService.createCourse(value);
      
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      console.error('Error in createCourse:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /courses/{id}/enroll → Student enrolls in a course
  async enrollInCourse(req: Request, res: Response) {
    try {
      const { id: courseId } = req.params;
      
      // Validate request body
      const { error, value } = enrollmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      const { studentId, studentName, studentEmail } = value;

      const enrollment = await courseService.enrollStudent(courseId, studentId, studentName, studentEmail);
      
      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: enrollment
      });
    } catch (error: any) {
      console.error('Error in enrollInCourse:', error);
      
      if (error.message === 'Course not found') {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      if (error.message === 'Course is full' || error.message === 'Student already enrolled in this course') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /courses/{id}/students → List enrolled students
  async getEnrolledStudents(req: Request, res: Response) {
    try {
      const { id: courseId } = req.params;
      
      // TODO: Add authentication middleware to verify user is the course instructor or admin
      
      const enrolledStudents = await courseService.getEnrolledStudents(courseId);
      
      res.json({
        success: true,
        data: enrolledStudents,
        count: enrolledStudents.length
      });
    } catch (error) {
      console.error('Error in getEnrolledStudents:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /students → List all students
  async getAllStudents(req: Request, res: Response) {
    try {
      const students = await courseService.getAllStudents();
      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error('Error in getAllStudents:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /students/{id} → Get student by ID
  async getStudentById(req: Request, res: Response) {
    try {
      const { id: studentId } = req.params;
      const student = await courseService.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error in getStudentById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // AI Agent-friendly alternatives using query parameters

  // GET /courses/students?courseId=123 → List enrolled students (AI Agent friendly)
  async getEnrolledStudentsByQuery(req: Request, res: Response) {
    try {
      const { courseId } = req.query;
      
      if (!courseId || typeof courseId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'courseId query parameter is required'
        });
      }
      
      const enrolledStudents = await courseService.getEnrolledStudents(courseId);
      
      res.json({
        success: true,
        data: enrolledStudents,
        count: enrolledStudents.length
      });
    } catch (error) {
      console.error('Error in getEnrolledStudentsByQuery:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /courses/enroll → Student enrolls in a course (AI Agent friendly)
  async enrollInCourseByQuery(req: Request, res: Response) {
    try {
      const { courseId, studentId, studentName, studentEmail } = req.body;
      
      // Validate required fields
      if (!courseId || !studentId || !studentName || !studentEmail) {
        return res.status(400).json({
          success: false,
          message: 'courseId, studentId, studentName, and studentEmail are required in request body'
        });
      }

      const enrollment = await courseService.enrollStudent(courseId, studentId, studentName, studentEmail);
      
      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: enrollment
      });
    } catch (error: any) {
      console.error('Error in enrollInCourseByQuery:', error);
      
      if (error.message === 'Course not found') {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      if (error.message === 'Course is full' || error.message === 'Student already enrolled in this course') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /students/profile?studentId=123 → Get student by ID (AI Agent friendly)
  async getStudentByIdQuery(req: Request, res: Response) {
    try {
      const { studentId } = req.query;
      
      if (!studentId || typeof studentId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'studentId query parameter is required'
        });
      }
      
      const student = await courseService.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error in getStudentByIdQuery:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

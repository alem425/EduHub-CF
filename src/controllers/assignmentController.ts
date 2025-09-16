import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignmentService';
import Joi from 'joi';

const assignmentService = new AssignmentService();

// Validation schemas
const createAssignmentSchema = Joi.object({
  courseId: Joi.string().required(),
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10).max(2000),
  instructions: Joi.string().optional().max(5000),
  dueDate: Joi.date().required().greater('now'),
  maxPoints: Joi.number().positive().required(),
  assignmentType: Joi.string().valid('homework', 'quiz', 'exam', 'project', 'essay').required(),
  isActive: Joi.boolean().default(true),
  createdBy: Joi.string().required(),
  attachments: Joi.array().items(Joi.string()).optional(),
  submissionFormat: Joi.string().valid('text', 'file', 'both').required()
});

export class AssignmentController {
  // GET /courses/{id}/assignments → Get assignments for a course
  async getCourseAssignments(req: Request, res: Response) {
    try {
      const { id: courseId } = req.params;
      
      // TODO: Add authentication middleware to verify user has access to course
      
      const assignments = await assignmentService.getCourseAssignments(courseId);
      
      res.json({
        success: true,
        data: assignments,
        count: assignments.length
      });
    } catch (error) {
      console.error('Error in getCourseAssignments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /courses/{id}/assignments → Create assignment (teacher-only)
  async createCourseAssignment(req: Request, res: Response) {
    try {
      const { id: courseId } = req.params;
      
      // Add courseId from URL params to request body for validation
      const assignmentData = { ...req.body, courseId };
      
      // Validate request body
      const { error, value } = createAssignmentSchema.validate(assignmentData);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      // TODO: Add authentication middleware to verify user is a teacher
      // TODO: Verify teacher is instructor of this course
      
      const assignment = await assignmentService.createAssignment(value);
      
      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment
      });
    } catch (error: any) {
      console.error('Error in createCourseAssignment:', error);
      
      if (error.message === 'Course not found') {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /assignments/{id} → View assignment details
  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id: assignmentId } = req.params;
      
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }
      
      // TODO: Add authentication middleware to verify user has access to this assignment
      
      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      console.error('Error in getAssignmentById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // AI Agent-friendly alternatives

  // GET /assignments/course?courseId=123 → Get course assignments (AI Agent friendly)
  async getCourseAssignmentsByQuery(req: Request, res: Response) {
    try {
      const { courseId } = req.query;
      
      if (!courseId || typeof courseId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'courseId query parameter is required'
        });
      }
      
      const assignments = await assignmentService.getCourseAssignments(courseId);
      
      res.json({
        success: true,
        data: assignments,
        count: assignments.length
      });
    } catch (error) {
      console.error('Error in getCourseAssignmentsByQuery:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /assignments/create → Create assignment (AI Agent friendly)
  async createAssignmentByBody(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = createAssignmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      const assignment = await assignmentService.createAssignment(value);
      
      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment
      });
    } catch (error: any) {
      console.error('Error in createAssignmentByBody:', error);
      
      if (error.message === 'Course not found') {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /assignments/details?assignmentId=123 → Get assignment details (AI Agent friendly)
  async getAssignmentByIdQuery(req: Request, res: Response) {
    try {
      const { assignmentId } = req.query;
      
      if (!assignmentId || typeof assignmentId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'assignmentId query parameter is required'
        });
      }
      
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }
      
      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      console.error('Error in getAssignmentByIdQuery:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /assignments → Get all assignments
  async getAllAssignments(req: Request, res: Response) {
    try {
      const assignments = await assignmentService.getAllAssignments();
      
      res.json({
        success: true,
        data: assignments,
        count: assignments.length
      });
    } catch (error) {
      console.error('Error in getAllAssignments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

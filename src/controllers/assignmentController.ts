import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignmentService';
import { blobStorageService, BlobStorageService } from '../services/blobStorageService';
import { getUploadedFiles } from '../middleware/uploadMiddleware';
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
      
      // Handle file uploads if any
      const uploadedFiles = getUploadedFiles(req);
      let attachments: string[] = [];

      if (uploadedFiles.length > 0) {
        try {
          console.log(`📎 Processing ${uploadedFiles.length} attachment(s) for assignment...`);
          
          // Generate folder path for assignment attachments
          const tempAssignmentId = 'temp-' + Date.now(); // We'll update this after assignment is created
          const folderPath = BlobStorageService.generateFolderPath('assignment', courseId, tempAssignmentId);
          
          // Upload files to blob storage
          const uploadResults = await blobStorageService.uploadFiles(uploadedFiles, folderPath);
          
          // Store the blob URLs as attachments
          attachments = uploadResults.map(result => result.uploadUrl);
          
          console.log(`✅ Uploaded ${uploadResults.length} attachment(s) for assignment`);
        } catch (uploadError) {
          console.error('Error uploading assignment attachments:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload attachments',
            error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
          });
        }
      }
      
      // Add courseId and attachments to request body for validation
      const assignmentData = { 
        ...req.body, 
        courseId,
        attachments: attachments.length > 0 ? attachments : undefined
      };
      
      // Validate request body
      const { error, value } = createAssignmentSchema.validate(assignmentData);
      if (error) {
        // If validation fails and we uploaded files, clean them up
        if (attachments.length > 0) {
          try {
            const blobNames = attachments.map(url => {
              const urlParts = url.split('/');
              return urlParts.slice(-4).join('/'); // Get the blob name from URL
            });
            await blobStorageService.deleteFiles(blobNames);
            console.log('🗑️ Cleaned up uploaded files due to validation error');
          } catch (cleanupError) {
            console.error('Error cleaning up files:', cleanupError);
          }
        }
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      // TODO: Add authentication middleware to verify user is a teacher
      // TODO: Verify teacher is instructor of this course
      
      const assignment = await assignmentService.createAssignment(value);
      
      // If we uploaded files with a temporary ID, we should move them to the correct location
      // For now, we'll keep them in place since the assignment is created successfully
      
      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment,
        attachmentsUploaded: attachments.length
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

  // GET /assignments/{id}/attachments/{filename}/download → Generate secure download URL
  async getAttachmentDownloadUrl(req: Request, res: Response) {
    try {
      const { id: assignmentId, filename } = req.params;
      
      // TODO: Add authentication middleware to verify user has access to this assignment
      
      // Verify assignment exists
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check if the file is in the assignment's attachments
      const hasAttachment = assignment.attachments?.some(url => url.includes(filename));
      if (!hasAttachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found in this assignment'
        });
      }

      try {
        // Generate folder path to construct blob name
        const folderPath = BlobStorageService.generateFolderPath('assignment', assignment.courseId, assignmentId);
        const blobName = `${folderPath}/${filename}`;
        
        // Generate secure download URL (valid for 1 hour)
        const downloadUrl = await blobStorageService.generateDownloadUrl(blobName, 60);
        
        res.json({
          success: true,
          data: {
            downloadUrl,
            filename,
            expiresInMinutes: 60
          }
        });
      } catch (urlError) {
        console.error('Error generating download URL:', urlError);
        res.status(500).json({
          success: false,
          message: 'Failed to generate download URL'
        });
      }
    } catch (error) {
      console.error('Error in getAttachmentDownloadUrl:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

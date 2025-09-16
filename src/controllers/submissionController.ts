import { Request, Response } from 'express';
import { SubmissionService } from '../services/submissionService';
import { AssignmentService } from '../services/assignmentService';
import { blobStorageService, BlobStorageService } from '../services/blobStorageService';
import { getUploadedFiles, validateFileRequirements } from '../middleware/uploadMiddleware';
import Joi from 'joi';

const submissionService = new SubmissionService();
const assignmentService = new AssignmentService();

// Validation schemas
const createSubmissionSchema = Joi.object({
  studentId: Joi.string().required(),
  studentName: Joi.string().required().min(2).max(100),
  studentEmail: Joi.string().email().required(),
  submissionText: Joi.string().optional().max(10000),
  attachments: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      filename: Joi.string().required(),
      originalFilename: Joi.string().required(),
      fileSize: Joi.number().positive().required(),
      mimeType: Joi.string().required(),
      uploadUrl: Joi.string().uri().required(),
      uploadedAt: Joi.date().required()
    })
  ).optional()
});

const gradeSubmissionSchema = Joi.object({
  grade: Joi.number().min(0).required(),
  feedback: Joi.string().optional().max(5000),
  gradedBy: Joi.string().required()
});

export class SubmissionController {
  
  // POST /assignments/{id}/submit → Student uploads submission
  async submitAssignment(req: Request, res: Response) {
    try {
      const { id: assignmentId } = req.params;
      
      // Verify assignment exists first
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Validate submission format requirements
      const formatValidation = validateFileRequirements(req, assignment.submissionFormat);
      if (!formatValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: formatValidation.error
        });
      }

      // Handle file uploads if any
      const uploadedFiles = getUploadedFiles(req);
      let attachments: any[] = [];

      if (uploadedFiles.length > 0) {
        try {
          console.log(`📎 Processing ${uploadedFiles.length} attachment(s) for submission...`);
          
          // Generate temporary submission ID for folder structure
          const tempSubmissionId = 'temp-' + Date.now();
          const folderPath = BlobStorageService.generateFolderPath('submission', assignment.courseId, tempSubmissionId);
          
          // Upload files to blob storage
          const uploadResults = await blobStorageService.uploadFiles(uploadedFiles, folderPath);
          
          // Convert upload results to SubmissionAttachment format
          attachments = uploadResults.map(result => ({
            id: result.id,
            filename: result.filename,
            originalFilename: result.originalFilename,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            uploadUrl: result.uploadUrl,
            uploadedAt: result.uploadedAt
          }));
          
          console.log(`✅ Uploaded ${uploadResults.length} attachment(s) for submission`);
        } catch (uploadError) {
          console.error('Error uploading submission attachments:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload attachments',
            error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
          });
        }
      }

      // Prepare submission data with uploaded attachments
      const submissionData = {
        ...req.body,
        attachments: attachments.length > 0 ? attachments : undefined
      };
      
      // Validate request body with attachments
      const { error, value } = createSubmissionSchema.validate(submissionData);
      if (error) {
        // If validation fails and we uploaded files, clean them up
        if (attachments.length > 0) {
          try {
            const blobNames = attachments.map((attachment: any) => {
              const urlParts = attachment.uploadUrl.split('/');
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

      // Create submission with final data
      const finalSubmissionData = {
        assignmentId,
        studentId: value.studentId,
        studentName: value.studentName,
        studentEmail: value.studentEmail,
        submissionText: value.submissionText,
        attachments: value.attachments
      };

      const submission = await submissionService.createSubmission(finalSubmissionData);
      
      res.status(201).json({
        success: true,
        message: 'Submission created successfully',
        data: {
          submissionId: submission.id,
          assignmentId: submission.assignmentId,
          status: submission.status,
          submittedAt: submission.submittedAt,
          isLate: submission.isLate,
          submissionNumber: submission.submissionNumber,
          attachmentsUploaded: attachments.length
        }
      });

    } catch (error: any) {
      console.error('Error in submitAssignment:', error);
      
      // Handle specific business logic errors
      if (error.message.includes('not enrolled') || 
          error.message.includes('not found') ||
          error.message.includes('not allowed') ||
          error.message.includes('required')) {
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

  // GET /assignments/{id}/submissions → View all submissions (teacher-only)
  async getAssignmentSubmissions(req: Request, res: Response) {
    try {
      const { id: assignmentId } = req.params;
      const { page, limit, status } = req.query;

      // Verify assignment exists
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // TODO: Add teacher authorization check
      // Verify the requesting user is the instructor or admin

      const options = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        status: status as string
      };

      const result = await submissionService.getAssignmentSubmissions(assignmentId, options);
      
      res.json({
        success: true,
        data: result.submissions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        },
        assignmentInfo: {
          title: assignment.title,
          dueDate: assignment.dueDate,
          maxPoints: assignment.maxPoints,
          submissionFormat: assignment.submissionFormat
        }
      });

    } catch (error) {
      console.error('Error in getAssignmentSubmissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /submissions/{id} → Fetch one submission (student/teacher)
  async getSubmissionById(req: Request, res: Response) {
    try {
      const { id: submissionId } = req.params;
      
      const submission = await submissionService.getSubmissionById(submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // TODO: Add authorization check
      // Students can only view their own submissions
      // Teachers can view submissions for their courses
      
      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Error in getSubmissionById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /submissions/{id}/grade → Grade a submission (teacher-only)
  async gradeSubmission(req: Request, res: Response) {
    try {
      const { id: submissionId } = req.params;
      
      // Validate request body
      const { error, value } = gradeSubmissionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      // TODO: Add teacher authorization check
      // Verify the requesting user is authorized to grade this submission

      const gradedSubmission = await submissionService.gradeSubmission(submissionId, {
        grade: value.grade,
        feedback: value.feedback,
        gradedBy: value.gradedBy
      });
      
      res.json({
        success: true,
        message: 'Submission graded successfully',
        data: {
          submissionId: gradedSubmission.id,
          grade: gradedSubmission.grade,
          maxPoints: gradedSubmission.maxPoints,
          feedback: gradedSubmission.feedback,
          gradedAt: gradedSubmission.gradedAt,
          status: gradedSubmission.status
        }
      });

    } catch (error: any) {
      console.error('Error in gradeSubmission:', error);
      
      if (error.message === 'Submission not found') {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      if (error.message.includes('Grade must be between')) {
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

  // PUT /submissions/{id}/status → Update submission status
  async updateSubmissionStatus(req: Request, res: Response) {
    try {
      const { id: submissionId } = req.params;
      const { status } = req.body;

      if (!status || !['submitted', 'graded', 'returned', 'resubmitted'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: submitted, graded, returned, or resubmitted'
        });
      }

      // TODO: Add authorization check

      const updatedSubmission = await submissionService.updateSubmissionStatus(submissionId, status);
      
      res.json({
        success: true,
        message: 'Submission status updated successfully',
        data: {
          submissionId: updatedSubmission.id,
          status: updatedSubmission.status,
          updatedAt: updatedSubmission.updatedAt
        }
      });

    } catch (error: any) {
      console.error('Error in updateSubmissionStatus:', error);
      
      if (error.message === 'Submission not found') {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // AI Agent-friendly endpoints

  // GET /submissions/student?studentId=123&courseId=456 → Get student submissions
  async getStudentSubmissions(req: Request, res: Response) {
    try {
      const { studentId, courseId } = req.query;
      
      if (!studentId || typeof studentId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'studentId query parameter is required'
        });
      }

      // TODO: Add authorization check
      // Students can only view their own submissions
      // Teachers can view submissions for their courses

      const submissions = await submissionService.getStudentSubmissions(
        studentId, 
        courseId as string
      );
      
      res.json({
        success: true,
        data: submissions,
        count: submissions.length
      });

    } catch (error) {
      console.error('Error in getStudentSubmissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /submissions/assignment?assignmentId=123 → Get assignment submissions (AI agent friendly)
  async getSubmissionsByAssignmentQuery(req: Request, res: Response) {
    try {
      const { assignmentId, page, limit, status } = req.query;
      
      if (!assignmentId || typeof assignmentId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'assignmentId query parameter is required'
        });
      }

      // TODO: Add authorization check

      const options = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        status: status as string
      };

      const result = await submissionService.getAssignmentSubmissions(assignmentId, options);
      
      res.json({
        success: true,
        data: result.submissions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });

    } catch (error) {
      console.error('Error in getSubmissionsByAssignmentQuery:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /submissions/details?submissionId=123 → Get submission details (AI agent friendly)
  async getSubmissionDetails(req: Request, res: Response) {
    try {
      const { submissionId } = req.query;
      
      if (!submissionId || typeof submissionId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'submissionId query parameter is required'
        });
      }

      const submission = await submissionService.getSubmissionById(submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // TODO: Add authorization check
      
      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Error in getSubmissionDetails:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // DELETE /submissions/{id} → Delete submission
  async deleteSubmission(req: Request, res: Response) {
    try {
      const { id: submissionId } = req.params;

      // TODO: Add authorization check
      // Only students can delete their own submissions (if allowed)
      // Or teachers can delete submissions in their courses

      await submissionService.deleteSubmission(submissionId);
      
      res.json({
        success: true,
        message: 'Submission deleted successfully'
      });

    } catch (error: any) {
      console.error('Error in deleteSubmission:', error);
      
      if (error.message === 'Submission not found') {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // GET /submissions/{id}/attachments/{filename}/download → Generate secure download URL for submission attachment
  async getSubmissionAttachmentDownloadUrl(req: Request, res: Response) {
    try {
      const { id: submissionId, filename } = req.params;
      
      // TODO: Add authentication middleware to verify user has access to this submission
      
      // Verify submission exists
      const submission = await submissionService.getSubmissionById(submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // Check if the file is in the submission's attachments
      const hasAttachment = submission.attachments?.some(attachment => 
        attachment.filename === filename || attachment.originalFilename === filename
      );
      if (!hasAttachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found in this submission'
        });
      }

      try {
        // Get assignment to construct proper folder path
        const assignment = await assignmentService.getAssignmentById(submission.assignmentId);
        if (!assignment) {
          return res.status(404).json({
            success: false,
            message: 'Related assignment not found'
          });
        }

        // Generate folder path to construct blob name
        const folderPath = BlobStorageService.generateFolderPath('submission', assignment.courseId, submissionId);
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
      console.error('Error in getSubmissionAttachmentDownloadUrl:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

import { Request, Response } from 'express';
import { SubmissionService } from '../services/submissionService';
import { AssignmentService } from '../services/assignmentService';
import { blobStorageService, BlobStorageService } from '../services/blobStorageService';
import Joi from 'joi';

const submissionService = new SubmissionService();
const assignmentService = new AssignmentService();

// AI Agent friendly validation schema for text-only submission
const createSubmissionSchema = Joi.object({
  assignmentId: Joi.string().required(),
  studentId: Joi.string().required(),
  studentName: Joi.string().required().min(2).max(100),
  studentEmail: Joi.string().email().required(),
  submissionText: Joi.string().required().min(1).max(10000)
});

// AI Agent friendly validation schema for submission with file attachments
const createSubmissionWithFilesSchema = Joi.object({
  assignmentId: Joi.string().required(),
  studentId: Joi.string().required(),
  studentName: Joi.string().required().min(2).max(100),
  studentEmail: Joi.string().email().required(),
  submissionText: Joi.string().optional().max(10000),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      mimeType: Joi.string().required(),
      data: Joi.string().required(), // Base64 encoded file data
      size: Joi.number().optional()
    })
  ).optional()
});

const getSubmissionAttachmentSchema = Joi.object({
  submissionId: Joi.string().required(),
  filename: Joi.string().required()
});

export class AISubmissionController {

  // POST /ai/submissions/create → AI Agent creates text-only submission
  async createSubmission(req: Request, res: Response) {
    try {
      console.log('🤖 AI Agent: Creating text-only submission');
      
      // Validate request body
      const { error, value } = createSubmissionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      // Get assignment to validate submission format
      const assignment = await assignmentService.getAssignmentById(value.assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Validate submission format requirements
      if (assignment.submissionFormat === 'file') {
        return res.status(400).json({
          success: false,
          message: 'File submission is required for this assignment.'
        });
      }

      // Create submission data (text-only)
      const submissionData = {
        assignmentId: value.assignmentId,
        studentId: value.studentId,
        studentName: value.studentName,
        studentEmail: value.studentEmail,
        submissionText: value.submissionText,
        status: 'submitted' as const
      };

      // Create the submission using the service
      const submission = await submissionService.createSubmission(submissionData);
      
      console.log('✅ Text-only submission created successfully:', submission.id);

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
          submissionText: submission.submissionText
        }
      });

    } catch (error: any) {
      console.error('❌ Error creating text-only submission:', error);
      
      if (error.message === 'Assignment not found') {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /ai/submissions/create-with-files → AI Agent creates submission with file attachments
  async createSubmissionWithFiles(req: Request, res: Response) {
    try {
      console.log('🤖 AI Agent: Creating submission with files...');
      
      // Validate request body
      const { error, value } = createSubmissionWithFilesSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      // Verify assignment exists
      const assignment = await assignmentService.getAssignmentById(value.assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Validate submission format requirements
      const hasText = value.submissionText && value.submissionText.trim().length > 0;
      const hasFiles = value.attachments && value.attachments.length > 0;

      switch (assignment.submissionFormat) {
        case 'text':
          if (!hasText) {
            return res.status(400).json({
              success: false,
              message: 'Text submission is required for this assignment.'
            });
          }
          break;
        
        case 'file':
          if (!hasFiles) {
            return res.status(400).json({
              success: false,
              message: 'File submission is required for this assignment.'
            });
          }
          break;
        
        case 'both':
          if (!hasText && !hasFiles) {
            return res.status(400).json({
              success: false,
              message: 'Either text or file submission is required for this assignment.'
            });
          }
          break;
      }

      let attachmentData: any[] = [];

      // Process file attachments if provided
      if (value.attachments && value.attachments.length > 0) {
        try {
          console.log(`📎 Processing ${value.attachments.length} attachment(s) from AI agent...`);
          
          const folderPath = BlobStorageService.generateFolderPath('submission', assignment.courseId, 'temp-' + Date.now());
          
          // Convert base64 attachments to blob storage
          for (const attachment of value.attachments) {
            // Decode base64 data
            const fileBuffer = Buffer.from(attachment.data, 'base64');
            
            // Create a mock Express.Multer.File object for the blob service
            const mockFile: Express.Multer.File = {
              fieldname: 'attachments',
              originalname: attachment.filename,
              encoding: '7bit',
              mimetype: attachment.mimeType,
              size: attachment.size || fileBuffer.length,
              buffer: fileBuffer,
              destination: '',
              filename: attachment.filename,
              path: '',
              stream: {} as any
            };

            // Upload to blob storage
            const uploadResult = await blobStorageService.uploadFile(mockFile, folderPath);
            
            // Store attachment metadata
            attachmentData.push({
              id: uploadResult.id,
              filename: uploadResult.filename,
              originalFilename: uploadResult.originalFilename,
              fileSize: uploadResult.fileSize,
              mimeType: uploadResult.mimeType,
              uploadUrl: uploadResult.uploadUrl,
              uploadedAt: uploadResult.uploadedAt
            });
            
            console.log(`✅ Uploaded: ${attachment.filename}`);
          }
          
          console.log(`✅ All ${attachmentData.length} attachments uploaded successfully`);
        } catch (uploadError) {
          console.error('❌ Error uploading attachments:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload attachments',
            error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
          });
        }
      }

      // Create submission data
      const submissionData = {
        assignmentId: value.assignmentId,
        studentId: value.studentId,
        studentName: value.studentName,
        studentEmail: value.studentEmail,
        submissionText: value.submissionText,
        attachments: attachmentData.length > 0 ? attachmentData : undefined
      };

      // Create the submission
      const submission = await submissionService.createSubmission(submissionData);
      
      res.status(201).json({
        success: true,
        message: 'Submission created successfully with attachments',
        data: {
          submissionId: submission.id,
          assignmentId: submission.assignmentId,
          status: submission.status,
          submittedAt: submission.submittedAt,
          isLate: submission.isLate,
          submissionNumber: submission.submissionNumber,
          attachmentsUploaded: attachmentData.length
        }
      });

    } catch (error: any) {
      console.error('❌ Error in createSubmissionWithFiles:', error);
      
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

  // POST /ai/submissions/get-download-url → AI Agent gets secure download URL for submission attachment
  async getSubmissionAttachmentUrl(req: Request, res: Response) {
    try {
      const { error, value } = getSubmissionAttachmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      const { submissionId, filename } = value;

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
            expiresInMinutes: 60,
            submissionId,
            assignmentId: submission.assignmentId,
            studentName: submission.studentName
          }
        });
      } catch (urlError) {
        console.error('❌ Error generating download URL:', urlError);
        res.status(500).json({
          success: false,
          message: 'Failed to generate download URL'
        });
      }
    } catch (error) {
      console.error('❌ Error in getSubmissionAttachmentUrl:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // POST /ai/submissions/download-file → AI Agent downloads file as base64
  async downloadFileAsBase64(req: Request, res: Response) {
    try {
      const { error, value } = getSubmissionAttachmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      const { submissionId, filename } = value;

      // First get the download URL
      const urlResponse = await this.getSubmissionAttachmentUrl(req, res);
      if (!urlResponse) return; // Error already handled

      // For AI agents, we could fetch the file and return as base64
      // This would require additional implementation to fetch from blob storage
      // and convert to base64 for the AI agent's convenience
      
      res.json({
        success: true,
        message: 'Use the download URL to fetch the file',
        note: 'AI Agent should fetch the downloadUrl and convert to base64 if needed'
      });

    } catch (error) {
      console.error('❌ Error in downloadFileAsBase64:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignmentService';
import { blobStorageService, BlobStorageService } from '../services/blobStorageService';
import Joi from 'joi';

const assignmentService = new AssignmentService();

// AI Agent friendly validation schema for assignment creation with file attachments
const createAssignmentWithFilesSchema = Joi.object({
  courseId: Joi.string().required(),
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10).max(2000),
  instructions: Joi.string().optional().max(5000),
  dueDate: Joi.date().required().greater('now'),
  maxPoints: Joi.number().positive().required(),
  assignmentType: Joi.string().valid('homework', 'quiz', 'exam', 'project', 'essay').required(),
  isActive: Joi.boolean().default(true),
  createdBy: Joi.string().required(),
  submissionFormat: Joi.string().valid('text', 'file', 'both').required(),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      mimeType: Joi.string().required(),
      data: Joi.string().required(), // Base64 encoded file data
      size: Joi.number().optional()
    })
  ).optional()
});

export class AIAssignmentController {
  
  // POST /ai/assignments/create-with-files → AI Agent creates assignment with file attachments
  async createAssignmentWithFiles(req: Request, res: Response) {
    try {
      console.log('🤖 AI Agent: Creating assignment with files...');
      
      // Validate request body
      const { error, value } = createAssignmentWithFilesSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      let attachmentUrls: string[] = [];

      // Process file attachments if provided
      if (value.attachments && value.attachments.length > 0) {
        try {
          console.log(`📎 Processing ${value.attachments.length} attachment(s) from AI agent...`);
          
          const folderPath = BlobStorageService.generateFolderPath('assignment', value.courseId, 'temp-' + Date.now());
          
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
            attachmentUrls.push(uploadResult.uploadUrl);
            
            console.log(`✅ Uploaded: ${attachment.filename}`);
          }
          
          console.log(`✅ All ${attachmentUrls.length} attachments uploaded successfully`);
        } catch (uploadError) {
          console.error('❌ Error uploading attachments:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload attachments',
            error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
          });
        }
      }

      // Create assignment data
      const assignmentData = {
        courseId: value.courseId,
        title: value.title,
        description: value.description,
        instructions: value.instructions,
        dueDate: value.dueDate,
        maxPoints: value.maxPoints,
        assignmentType: value.assignmentType,
        isActive: value.isActive,
        createdBy: value.createdBy,
        submissionFormat: value.submissionFormat,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined
      };

      // Create the assignment
      const assignment = await assignmentService.createAssignment(assignmentData);
      
      res.status(201).json({
        success: true,
        message: 'Assignment created successfully with attachments',
        data: assignment,
        attachmentsUploaded: attachmentUrls.length
      });

    } catch (error: any) {
      console.error('❌ Error in createAssignmentWithFiles:', error);
      
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

  // POST /ai/assignments/get-download-url → AI Agent gets secure download URL for assignment attachment
  async getAssignmentAttachmentUrl(req: Request, res: Response) {
    try {
      const { assignmentId, filename } = req.body;
      
      if (!assignmentId || !filename) {
        return res.status(400).json({
          success: false,
          message: 'assignmentId and filename are required'
        });
      }

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
            expiresInMinutes: 60,
            assignmentId,
            assignmentTitle: assignment.title
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
      console.error('❌ Error in getAssignmentAttachmentUrl:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

import { Router } from 'express';
import { AIAssignmentController } from '../controllers/aiAssignmentController';
import { AISubmissionController } from '../controllers/aiSubmissionController';

const router = Router();
const aiAssignmentController = new AIAssignmentController();
const aiSubmissionController = new AISubmissionController();

// AI Agent-friendly assignment endpoints with file support
// POST /ai/assignments/create-with-files → Create assignment with base64 encoded file attachments
router.post('/assignments/create-with-files', aiAssignmentController.createAssignmentWithFiles.bind(aiAssignmentController));

// POST /ai/assignments/get-download-url → Get secure download URL for assignment attachment
router.post('/assignments/get-download-url', aiAssignmentController.getAssignmentAttachmentUrl.bind(aiAssignmentController));

// AI Agent-friendly submission endpoints with file support
// POST /ai/submissions/create-with-files → Create submission with base64 encoded file attachments
router.post('/submissions/create-with-files', aiSubmissionController.createSubmissionWithFiles.bind(aiSubmissionController));

// POST /ai/submissions/get-download-url → Get secure download URL for submission attachment
router.post('/submissions/get-download-url', aiSubmissionController.getSubmissionAttachmentUrl.bind(aiSubmissionController));

export default router;

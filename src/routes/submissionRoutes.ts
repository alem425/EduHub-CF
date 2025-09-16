import { Router } from 'express';
import { SubmissionController } from '../controllers/submissionController';
import { uploadMultiple } from '../middleware/uploadMiddleware';

const router = Router();
const submissionController = new SubmissionController();

// Traditional REST endpoints (as specified in requirements)

// POST /assignments/{id}/submit → Student uploads submission - with file upload support
router.post('/assignments/:id/submit', uploadMultiple('attachments', 5), submissionController.submitAssignment.bind(submissionController));

// GET /assignments/{id}/submissions → View all submissions (teacher-only)
router.get('/assignments/:id/submissions', submissionController.getAssignmentSubmissions.bind(submissionController));

// GET /submissions/{id} → Fetch one submission (student/teacher)
router.get('/submissions/:id', submissionController.getSubmissionById.bind(submissionController));

// GET /submissions/{id}/attachments/{filename}/download → Generate secure download URL for submission attachment
router.get('/submissions/:id/attachments/:filename/download', submissionController.getSubmissionAttachmentDownloadUrl.bind(submissionController));

// Additional submission management endpoints

// POST /submissions/{id}/grade → Grade a submission (teacher-only)
router.post('/submissions/:id/grade', submissionController.gradeSubmission.bind(submissionController));

// AI Agent-friendly alternatives with query parameters

// GET /submissions/student?studentId=123 → Get student's submissions (AI agent friendly)
router.get('/submissions/student', submissionController.getStudentSubmissions.bind(submissionController));

// GET /submissions/assignment?assignmentId=123 → Get submissions for assignment (AI agent friendly)
router.get('/submissions/assignment', submissionController.getSubmissionsByAssignmentQuery.bind(submissionController));

// GET /submissions/details?submissionId=123 → Get submission details (AI agent friendly)
router.get('/submissions/details', submissionController.getSubmissionDetails.bind(submissionController));

export default router;
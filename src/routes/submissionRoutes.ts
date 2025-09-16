import { Router } from 'express';
import { SubmissionController } from '../controllers/submissionController';

const router = Router();
const submissionController = new SubmissionController();

// Traditional REST endpoints (as specified in requirements)

// POST /assignments/{id}/submit → Student uploads submission
router.post('/assignments/:id/submit', submissionController.submitAssignment.bind(submissionController));

// GET /assignments/{id}/submissions → View all submissions (teacher-only)
router.get('/assignments/:id/submissions', submissionController.getAssignmentSubmissions.bind(submissionController));

// GET /submissions/{id} → Fetch one submission (student/teacher)
router.get('/submissions/:id', submissionController.getSubmissionById.bind(submissionController));

// Additional submission management endpoints

// POST /submissions/{id}/grade → Grade a submission (teacher-only)
router.post('/submissions/:id/grade', submissionController.gradeSubmission.bind(submissionController));

// PUT /submissions/{id}/status → Update submission status
router.put('/submissions/:id/status', submissionController.updateSubmissionStatus.bind(submissionController));

// DELETE /submissions/{id} → Delete submission
router.delete('/submissions/:id', submissionController.deleteSubmission.bind(submissionController));

// AI Agent-friendly alternatives

// GET /submissions/student?studentId=123&courseId=456 → Get student submissions
router.get('/submissions/student', submissionController.getStudentSubmissions.bind(submissionController));

// GET /submissions/assignment?assignmentId=123 → Get assignment submissions (AI agent friendly)
router.get('/submissions/assignment', submissionController.getSubmissionsByAssignmentQuery.bind(submissionController));

// GET /submissions/details?submissionId=123 → Get submission details (AI agent friendly)
router.get('/submissions/details', submissionController.getSubmissionDetails.bind(submissionController));

export default router;

import { Router } from 'express';
import { AssignmentController } from '../controllers/assignmentController';
import { uploadMultiple } from '../middleware/uploadMiddleware';

const router = Router();
const assignmentController = new AssignmentController();

// Traditional REST endpoints
// GET /assignments/{id} → View assignment details
router.get('/:id', assignmentController.getAssignmentById.bind(assignmentController));

// GET /assignments/{id}/attachments/{filename}/download → Generate secure download URL for assignment attachment
router.get('/:id/attachments/:filename/download', assignmentController.getAttachmentDownloadUrl.bind(assignmentController));

// AI Agent-friendly alternatives
// GET /assignments → Get all assignments
router.get('/', assignmentController.getAllAssignments.bind(assignmentController));

// GET /assignments/course?courseId=123 → Get course assignments (AI Agent friendly)
router.get('/course', assignmentController.getCourseAssignmentsByQuery.bind(assignmentController));

// POST /assignments/create → Create assignment (AI Agent friendly) - with file upload support
router.post('/create', uploadMultiple('attachments', 5), assignmentController.createAssignmentByBody.bind(assignmentController));

// GET /assignments/details?assignmentId=123 → Get assignment details (AI Agent friendly)
router.get('/details', assignmentController.getAssignmentByIdQuery.bind(assignmentController));

export default router;

import { Router } from 'express';
import { AssignmentController } from '../controllers/assignmentController';

const router = Router();
const assignmentController = new AssignmentController();

// Traditional REST endpoints
// GET /assignments/{id} → View assignment details
router.get('/:id', assignmentController.getAssignmentById.bind(assignmentController));

// AI Agent-friendly alternatives
// GET /assignments → Get all assignments
router.get('/', assignmentController.getAllAssignments.bind(assignmentController));

// GET /assignments/course?courseId=123 → Get course assignments (AI Agent friendly)
router.get('/course', assignmentController.getCourseAssignmentsByQuery.bind(assignmentController));

// POST /assignments/create → Create assignment (AI Agent friendly)
router.post('/create', assignmentController.createAssignmentByBody.bind(assignmentController));

// GET /assignments/details?assignmentId=123 → Get assignment details (AI Agent friendly)
router.get('/details', assignmentController.getAssignmentByIdQuery.bind(assignmentController));

export default router;

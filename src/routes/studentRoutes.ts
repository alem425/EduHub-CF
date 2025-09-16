import { Router } from 'express';
import { CourseController } from '../controllers/courseController';

const router = Router();
const courseController = new CourseController();

// GET /students → List all students
router.get('/', courseController.getAllStudents.bind(courseController));

// GET /students/{id} → Get student by ID
router.get('/:id', courseController.getStudentById.bind(courseController));

// AI Agent-friendly alternative with query parameter
// GET /students/profile?studentId=123 → Get student by ID (AI Agent friendly)
router.get('/profile', courseController.getStudentByIdQuery.bind(courseController));

export default router;

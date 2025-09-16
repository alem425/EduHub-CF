import { Router } from 'express';
import { CourseController } from '../controllers/courseController';

const router = Router();
const courseController = new CourseController();

// GET /students → List all students
router.get('/', courseController.getAllStudents.bind(courseController));

// GET /students/{id} → Get student by ID
router.get('/:id', courseController.getStudentById.bind(courseController));

export default router;

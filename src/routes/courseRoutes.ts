import { Router } from 'express';
import { CourseController } from '../controllers/courseController';

const router = Router();
const courseController = new CourseController();

// GET /courses → List all available courses
router.get('/', courseController.getAllCourses.bind(courseController));

// POST /courses (teacher-only) → Create a new course
router.post('/', courseController.createCourse.bind(courseController));

// POST /courses/{id}/enroll → Student enrolls in a course
router.post('/:id/enroll', courseController.enrollInCourse.bind(courseController));

// GET /courses/{id}/students → List enrolled students
router.get('/:id/students', courseController.getEnrolledStudents.bind(courseController));

export default router;

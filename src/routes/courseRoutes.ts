import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { AssignmentController } from '../controllers/assignmentController';

const router = Router();
const courseController = new CourseController();
const assignmentController = new AssignmentController();

// GET /courses → List all available courses
router.get('/', courseController.getAllCourses.bind(courseController));

// POST /courses (teacher-only) → Create a new course
router.post('/', courseController.createCourse.bind(courseController));

// POST /courses/{id}/enroll → Student enrolls in a course
router.post('/:id/enroll', courseController.enrollInCourse.bind(courseController));

// GET /courses/{id}/students → List enrolled students
router.get('/:id/students', courseController.getEnrolledStudents.bind(courseController));

// AI Agent-friendly alternatives with query parameters
// GET /courses/students?courseId=123 → List enrolled students (AI Agent friendly)
router.get('/students', courseController.getEnrolledStudentsByQuery.bind(courseController));

// POST /courses/enroll → Student enrolls in a course (AI Agent friendly)
router.post('/enroll', courseController.enrollInCourseByQuery.bind(courseController));

// Assignment routes (traditional REST)
// GET /courses/{id}/assignments → Get assignments for a course
router.get('/:id/assignments', assignmentController.getCourseAssignments.bind(assignmentController));

// POST /courses/{id}/assignments → Create assignment (teacher-only)
router.post('/:id/assignments', assignmentController.createCourseAssignment.bind(assignmentController));

export default router;

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  maxStudents: number;
  currentEnrollments: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  syllabus?: string[];
  prerequisites?: string[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: Date;
  status: 'enrolled' | 'completed' | 'dropped';
  progress: number; // percentage
  lastAccessedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  hashedPassword: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

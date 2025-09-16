export interface EnrolledStudent {
  studentId: string;
  studentName: string;
  enrolledAt: Date;
}

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
  currentEnrollments: number; // This is the count of students currently in the class
  enrolledStudents: EnrolledStudent[]; // Array of students with names and UIDs
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

export interface Student {
  id: string; // This is the UID
  name: string;
  email: string;
  enrolledCourses: string[]; // Array of course IDs
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  academicLevel?: string;
  major?: string;
  profileImage?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: Date;
  maxPoints: number;
  assignmentType: 'homework' | 'quiz' | 'exam' | 'project' | 'essay';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // instructor ID
  attachments?: string[]; // file URLs or references
  submissionFormat: 'text' | 'file' | 'both';
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

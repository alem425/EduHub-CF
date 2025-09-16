export interface EnrolledStudent {
  studentId: string;
  studentName: string;
  enrolledAt: Date;
}

export interface AssignmentReference {
  assignmentId: string;
  title: string;
  dueDate: Date;
  assignmentType: 'homework' | 'quiz' | 'exam' | 'project' | 'essay';
  maxPoints: number;
  submissionCount?: number;
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
  assignments: AssignmentReference[]; // Array of assignment references
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

export interface EnrolledCourse {
  courseId: string;
  courseName: string;
  enrolledAt: Date;
}

export interface Student {
  id: string; // This is the UID
  name: string;
  email: string;
  enrolledCourses: EnrolledCourse[]; // Array of enrolled course objects with ID and name
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
  submissionCount?: number; // Track number of submissions
  allowLateSubmissions?: boolean;
  allowMultipleSubmissions?: boolean;
}

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submissionText?: string; // For text submissions
  attachments?: SubmissionAttachment[]; // For file submissions
  submittedAt: Date;
  isLate: boolean;
  status: 'submitted' | 'graded' | 'returned' | 'resubmitted';
  submissionNumber: number; // For tracking multiple submissions (1, 2, 3, etc.)
  grade?: number;
  maxPoints: number; // Copy from assignment for historical reference
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: string; // instructor ID
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface SubmissionAttachment {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  uploadUrl: string; // URL to download/view the file
  uploadedAt: Date;
}

export interface SubmissionReference {
  submissionId: string;
  studentId: string;
  studentName: string;
  submittedAt: Date;
  status: 'submitted' | 'graded' | 'returned' | 'resubmitted';
  grade?: number;
  isLate: boolean;
  submissionNumber: number;
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

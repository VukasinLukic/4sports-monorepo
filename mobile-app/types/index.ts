// User Roles
export enum UserRole {
  OWNER = 'OWNER',
  COACH = 'COACH',
  PARENT = 'PARENT',
}

// Event Types
export enum EventType {
  TRAINING = 'TRAINING',
  COMPETITION = 'COMPETITION',
  MEETING = 'MEETING',
}

// Payment Status
export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
}

// Payment Methods
export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
}

// User Interface
export interface User {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  clubId?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

// Club Interface
export interface Club {
  _id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  ownerId: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

// Group Interface
export interface Group {
  _id: string;
  name: string;
  clubId: string;
  ageGroup?: string;
  memberCount: number;
  coachIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Member Interface
export interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  clubId: string;
  groupId: string;
  parentId: string;
  qrCode: string;
  profilePicture?: string;
  height?: number;
  weight?: number;
  position?: string;
  paymentStatus: PaymentStatus;
  medicalCheckStatus: 'VALID' | 'EXPIRED' | 'EXPIRING_SOON';
  medicalCheckExpiryDate?: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Event Interface
export interface Event {
  _id: string;
  title: string;
  description?: string;
  type: EventType;
  clubId: string;
  groupId: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  createdBy: string;
  attendanceMarked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Attendance Interface
export interface Attendance {
  _id: string;
  eventId: string;
  memberId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  markedBy: string;
  markedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Interface
export interface Payment {
  _id: string;
  memberId: string;
  clubId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  isPaid: boolean;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Medical Check Interface
export interface MedicalCheck {
  _id: string;
  memberId: string;
  clubId: string;
  examinationDate: string;
  expiryDate: string;
  status: 'VALID' | 'EXPIRED' | 'EXPIRING_SOON';
  note?: string;
  documentUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Post Interface
export interface Post {
  _id: string;
  clubId: string;
  groupId?: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Comment Interface
export interface Comment {
  _id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Interface
export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// Invite Code Interface
export interface InviteCode {
  _id: string;
  code: string;
  clubId: string;
  groupId?: string | {
    _id: string;
    name: string;
    ageGroup?: string;
  };
  type: 'COACH' | 'MEMBER'; // COACH → COACH role, MEMBER → PARENT role
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  isValid?: boolean;
  expiresAt: string;
  createdBy: string | {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

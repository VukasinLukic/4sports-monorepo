// User Roles
export enum UserRole {
  OWNER = 'OWNER',
  COACH = 'COACH',
  PARENT = 'PARENT',
  MEMBER = 'MEMBER',
}

// Event Types
export enum EventType {
  TRAINING = 'TRAINING',
  MATCH = 'MATCH',
  OTHER = 'OTHER',
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
  color?: string;
  memberCount: number;
  coachIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Member Interface
export interface Member {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  dateOfBirth?: string; // Optional for self-registered members
  age?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  clubId?: string;
  groupId?: string | { _id: string; name: string; color?: string };
  parentId?: string; // For child members
  userId?: string;   // For self-registered members (MEMBER role)
  clubs?: Array<{
    clubId: string | { _id: string; name: string };
    groupId: string | { _id: string; name: string; color?: string };
    status: 'ACTIVE' | 'INACTIVE';
    joinedAt: string;
  }>;
  qrCode?: string;
  profilePicture?: string;
  profileImage?: string;
  height?: number;
  weight?: number;
  position?: string;
  jerseyNumber?: number | string;
  groupName?: string;
  paymentStatus: PaymentStatus;
  medicalCheckStatus: 'VALID' | 'EXPIRED' | 'EXPIRING_SOON';
  medicalCheckExpiryDate?: string;
  lastPaymentDate?: string;
  medicalInfo?: {
    bloodType?: string;
    allergies?: string;
    medications?: string;
    conditions?: string;
    lastCheckDate?: string;
    expiryDate?: string;
  };
  bodyMetrics?: {
    height?: number;
    weight?: number;
    updatedAt?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  // Parent contact info
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  // Membership fee (per member, allows for individual pricing/discounts)
  membershipFee?: number;
  createdAt: string;
  updatedAt: string;
}

// Event Interface
export interface Event {
  _id: string;
  title: string;
  description?: string;
  type: string;
  clubId: string;
  groupId: string | { _id: string; name: string; color?: string };
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  createdBy: string | { _id: string; fullName: string };
  isMandatory?: boolean;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  // Advanced fields
  notes?: string;
  equipment?: string[];
  maxParticipants?: number;
  // QR Check-in
  qrCode: string;
  // Recurring events
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[];
    until?: string;
  };
  attendanceMarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Event Participant Interface
export interface EventParticipant {
  _id: string;
  eventId: string;
  memberId: {
    _id: string;
    fullName: string;
    profileImage?: string;
  };
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  rsvpStatus: 'CONFIRMED' | 'DECLINED' | 'PENDING';
  checkinTime?: string;
  checkinMethod?: 'QR' | 'MANUAL';
  markedBy?: { _id: string; fullName: string };
}

// Event Participants Stats
export interface EventParticipantsStats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  present: number;
  absent: number;
}

// Attendance Interface
export interface Attendance {
  _id: string;
  eventId: string | {
    _id: string;
    title?: string;
    type?: string;
    date?: string;
  };
  memberId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
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
  paidAmount?: number;
  currency: string;
  type: 'MEMBERSHIP' | 'EVENT' | 'EQUIPMENT' | 'OTHER';
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  paidDate?: string;
  dueDate?: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  isPaid?: boolean;
  description?: string;
  note?: string;
  period?: {
    month: number;
    year: number;
  };
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
  authorId: string;
  title: string;
  content: string;
  images: string[];
  visibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PARENTS_ONLY' | 'COACHES_ONLY';
  type: 'ANNOUNCEMENT' | 'NEWS' | 'EVENT' | 'ACHIEVEMENT' | 'OTHER';
  tags?: string[];
  isPinned?: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
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
  };
  type: 'COACH' | 'MEMBER'; // COACH → COACH role, MEMBER → MEMBER role
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

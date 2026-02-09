import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';

// Member fetched by userId (basic info + _id)
export interface MemberByUser {
  _id: string;
  fullName: string;
  profilePicture?: string;
  position?: string;
  jerseyNumber?: number;
  age?: number;
  groupId?: {
    _id: string;
    name: string;
    ageGroup?: string;
    color?: string;
  };
}

// Full member detail from GET /members/:id
export interface MemberDetail {
  _id: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE';
  position?: string;
  jerseyNumber?: number;
  height?: number;
  weight?: number;
  profileImage?: string;
  userId?: string;
  createdAt: string;
  paymentStatus: string;
  lastPaymentDate?: string;
  medicalCheckStatus: string;
  medicalCheckExpiryDate?: string;
  groupId?: {
    _id: string;
    name: string;
    ageGroup?: string;
    color?: string;
  };
  parentId?: {
    _id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
  };
  clubs?: Array<{
    clubId: unknown;
    groupId: unknown;
    status: string;
    joinedAt?: string;
  }>;
  membershipFee?: number;
}

// Payment record
export interface MemberPayment {
  _id: string;
  type: string;
  amount: number;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  period?: { month: number; year: number };
  createdAt: string;
}

// Attendance record
export interface AttendanceRecord {
  _id: string;
  eventId?: {
    _id: string;
    title: string;
    type: string;
    startTime: string;
  };
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
  markedAt?: string;
  createdAt: string;
}

export interface MemberAttendanceData {
  attendance: AttendanceRecord[];
  attendanceRate: number;
}

// Coach/user profile (fallback when not a member)
export interface UserProfile {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  role: string;
}

// Step 1: Get member by userId
export const useMemberByUserId = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['memberByUser', userId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MemberByUser }>(
        `/members/by-user/${userId}`
      );
      return response.data.data;
    },
    enabled: !!userId,
    retry: false,
  });
};

// Step 2: Get full member detail by member _id
export const useMemberDetail = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['memberDetail', memberId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MemberDetail }>(
        `/members/${memberId}`
      );
      return response.data.data;
    },
    enabled: !!memberId,
  });
};

// Step 3: Get payments for member
export const useMemberPayments = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['memberPayments', memberId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MemberPayment[] }>(
        `/payments/member/${memberId}`
      );
      return response.data.data;
    },
    enabled: !!memberId,
  });
};

// Step 4: Get attendance for member
export const useMemberAttendance = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['memberAttendance', memberId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MemberAttendanceData }>(
        `/attendance/member/${memberId}`
      );
      return response.data.data;
    },
    enabled: !!memberId,
  });
};

// Fallback: Get user profile (for coaches/owners)
export const useUserProfile = (userId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: UserProfile }>(
        `/auth/users/${userId}`
      );
      return response.data.data;
    },
    enabled: !!userId && enabled,
    retry: false,
  });
};

// Send payment reminder
export const useSendPaymentReminder = () => {
  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await api.post(`/reminders/payment/member/${memberId}`);
      return response.data;
    },
  });
};

// Send medical reminder
export const useSendMedicalReminder = () => {
  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await api.post(`/reminders/medical/member/${memberId}`);
      return response.data;
    },
  });
};

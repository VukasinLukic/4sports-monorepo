# 4SPORTS — API SPECIFICATION

**Verzija:** 1.0
**Base URL:** `https://api.4sports.app/api/v1`
**Status:** Ready for Implementation

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Clubs](#2-clubs)
3. [Users](#3-users)
4. [Invite Codes](#4-invite-codes)
5. [Groups](#5-groups)
6. [Members](#6-members)
7. [Events](#7-events)
8. [Attendance](#8-attendance)
9. [Payments](#9-payments)
10. [Medical Checks](#10-medical-checks)
11. [Finances](#11-finances)
12. [Posts (News Feed)](#12-posts-news-feed)
13. [Notifications](#13-notifications)
14. [Health Check](#14-health-check)

---

## Common Specifications

### Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common HTTP Status Codes
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Pagination
For list endpoints:
```
GET /endpoint?page=1&limit=20&sort=createdAt&order=desc
```

Response includes:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

---

## 1. Authentication

### 1.1 Register New User
**Endpoint:** `POST /auth/register`

**Description:** Creates a new user account after Firebase authentication.

**Request Body:**
```json
{
  "firebaseToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phoneNumber": "+381641234567",
  "role": "COACH | PARENT",
  "inviteCode": "ABC123XYZ" // Optional for owner, required for others
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firebaseUid": "firebase_uid_here",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phoneNumber": "+381641234567",
      "role": "COACH",
      "clubId": "507f1f77bcf86cd799439012",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400` - Invalid invite code or missing required fields
- `403` - Club member limit reached
- `409` - Email already registered

---

### 1.2 Login
**Endpoint:** `POST /auth/login`

**Description:** Authenticates user with Firebase token.

**Request Body:**
```json
{
  "firebaseToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "COACH",
      "clubId": "507f1f77bcf86cd799439012"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401` - Invalid Firebase token
- `404` - User not found in database

---

### 1.3 Refresh Token
**Endpoint:** `POST /auth/refresh`

**Description:** Refreshes expired JWT token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### 1.4 Get Current User
**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "COACH",
    "clubId": "507f1f77bcf86cd799439012",
    "club": {
      "name": "Basketball Academy",
      "subscriptionPlan": "FREE"
    }
  }
}
```

---

## 2. Clubs

### 2.1 Create Club
**Endpoint:** `POST /clubs`

**Role Required:** OWNER (first user becomes owner automatically)

**Request Body:**
```json
{
  "name": "Basketball Academy",
  "address": "Bulevar Oslobodjenja 123, Novi Sad",
  "phoneNumber": "+381211234567",
  "email": "info@basketacademy.rs",
  "subscriptionPlan": "FREE" // FREE | BASIC | PRO
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Basketball Academy",
    "ownerId": "507f1f77bcf86cd799439011",
    "memberLimit": 50,
    "currentMembers": 0,
    "subscriptionPlan": "FREE",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Club created successfully"
}
```

---

### 2.2 Get Club Details
**Endpoint:** `GET /clubs/:clubId`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Basketball Academy",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "memberLimit": 50,
    "currentMembers": 35,
    "subscriptionPlan": "FREE",
    "stats": {
      "totalCoaches": 5,
      "totalGroups": 8,
      "totalRevenue": 175000,
      "totalExpenses": 45000
    },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 2.3 Update Club Settings
**Endpoint:** `PATCH /clubs/:clubId`

**Role Required:** OWNER

**Request Body:**
```json
{
  "name": "Updated Club Name",
  "phoneNumber": "+381211234567",
  "memberLimit": 100 // Only if upgrading subscription
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated club */ },
  "message": "Club updated successfully"
}
```

---

### 2.4 Get Dashboard Statistics
**Endpoint:** `GET /clubs/:clubId/dashboard`

**Role Required:** OWNER

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "currentRevenue": 175000,
      "newMembersPercentage": 15.5,
      "totalMembers": 35,
      "totalTransactions": 142
    },
    "memberGrowth": [
      { "month": "2024-09", "count": 20 },
      { "month": "2024-10", "count": 25 },
      { "month": "2024-11", "count": 30 },
      { "month": "2024-12", "count": 35 }
    ],
    "revenueByMonth": [
      { "month": "2024-09", "revenue": 100000, "expenses": 20000 },
      { "month": "2024-10", "revenue": 125000, "expenses": 25000 }
    ],
    "revenueByQuarter": [
      { "quarter": "Q3 2024", "revenue": 300000 },
      { "quarter": "Q4 2024", "revenue": 450000 }
    ],
    "balance": {
      "income": 175000,
      "expenses": 45000,
      "profit": 130000
    }
  }
}
```

---

## 3. Users

### 3.1 Get All Users in Club
**Endpoint:** `GET /clubs/:clubId/users`

**Role Required:** OWNER, COACH

**Query Parameters:**
- `role` - Filter by role (COACH, PARENT)
- `page` - Page number
- `limit` - Items per page

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phoneNumber": "+381641234568",
      "role": "COACH",
      "groups": [
        { "_id": "groupId1", "name": "U12 Boys" }
      ],
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

---

### 3.2 Update User Profile
**Endpoint:** `PATCH /users/:userId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fullName": "Jane Smith Updated",
  "phoneNumber": "+381641234569",
  "profileImage": "https://storage.url/image.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated user */ },
  "message": "Profile updated successfully"
}
```

---

### 3.3 Delete User
**Endpoint:** `DELETE /users/:userId`

**Role Required:** OWNER (can delete any user), User (can delete self)

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 4. Invite Codes

### 4.1 Generate Invite Code
**Endpoint:** `POST /invites/generate`

**Role Required:** OWNER (for coaches), COACH (for members)

**Request Body:**
```json
{
  "type": "COACH | MEMBER",
  "clubId": "507f1f77bcf86cd799439012", // For COACH type
  "groupId": "507f1f77bcf86cd799439014", // For MEMBER type
  "expiresInDays": 30 // Optional, default 30
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "code": "ABC123XYZ",
    "type": "MEMBER",
    "clubId": "507f1f77bcf86cd799439012",
    "groupId": "507f1f77bcf86cd799439014",
    "isActive": true,
    "expiresAt": "2025-02-14T10:30:00Z",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Invite code generated successfully"
}
```

---

### 4.2 Validate Invite Code
**Endpoint:** `POST /invites/validate`

**Description:** Public endpoint to validate invite code before registration.

**Request Body:**
```json
{
  "code": "ABC123XYZ"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "type": "MEMBER",
    "club": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Basketball Academy",
      "canAcceptMembers": true // false if limit reached
    },
    "group": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "U12 Boys"
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CODE",
    "message": "Invite code is invalid or expired"
  }
}
```

---

### 4.3 Get All Invite Codes
**Endpoint:** `GET /invites`

**Role Required:** OWNER, COACH

**Query Parameters:**
- `type` - COACH or MEMBER
- `isActive` - true or false

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "code": "ABC123XYZ",
      "type": "MEMBER",
      "group": { "name": "U12 Boys" },
      "isActive": true,
      "usedCount": 5,
      "expiresAt": "2025-02-14T10:30:00Z"
    }
  ]
}
```

---

### 4.4 Deactivate Invite Code
**Endpoint:** `PATCH /invites/:inviteId/deactivate`

**Role Required:** OWNER, COACH (own codes only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invite code deactivated"
}
```

---

## 5. Groups

### 5.1 Create Group
**Endpoint:** `POST /groups`

**Role Required:** OWNER, COACH

**Request Body:**
```json
{
  "name": "U12 Boys",
  "clubId": "507f1f77bcf86cd799439012",
  "coachId": "507f1f77bcf86cd799439013",
  "description": "Training group for boys under 12",
  "ageGroup": "U12",
  "level": "BEGINNER | INTERMEDIATE | ADVANCED"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "U12 Boys",
    "clubId": "507f1f77bcf86cd799439012",
    "coachId": "507f1f77bcf86cd799439013",
    "memberCount": 0,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Group created successfully"
}
```

---

### 5.2 Get All Groups
**Endpoint:** `GET /clubs/:clubId/groups`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `coachId` - Filter by coach
- `ageGroup` - Filter by age group

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "U12 Boys",
      "coach": {
        "_id": "507f1f77bcf86cd799439013",
        "fullName": "Jane Smith"
      },
      "memberCount": 12,
      "level": "INTERMEDIATE",
      "upcomingEvents": 3
    }
  ]
}
```

---

### 5.3 Get Group Details
**Endpoint:** `GET /groups/:groupId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "U12 Boys",
    "description": "Training group for boys under 12",
    "coach": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Jane Smith",
      "phoneNumber": "+381641234568"
    },
    "members": [
      {
        "_id": "memberId1",
        "fullName": "Alex Johnson",
        "paymentStatus": true,
        "medicalStatus": true
      }
    ],
    "upcomingEvents": [
      {
        "_id": "eventId1",
        "title": "Training Session",
        "startTime": "2025-01-20T17:00:00Z"
      }
    ],
    "stats": {
      "totalMembers": 12,
      "paidMembers": 10,
      "unpaidMembers": 2,
      "averageAttendance": 85.5
    }
  }
}
```

---

### 5.4 Update Group
**Endpoint:** `PATCH /groups/:groupId`

**Role Required:** OWNER, COACH (group owner)

**Request Body:**
```json
{
  "name": "Updated Group Name",
  "description": "Updated description",
  "coachId": "newCoachId"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated group */ },
  "message": "Group updated successfully"
}
```

---

### 5.5 Delete Group
**Endpoint:** `DELETE /groups/:groupId`

**Role Required:** OWNER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

**Note:** This will also handle member reassignment or deletion based on business logic.

---

## 6. Members

### 6.1 Create Member
**Endpoint:** `POST /members`

**Role Required:** COACH, PARENT

**Request Body:**
```json
{
  "fullName": "Alex Johnson",
  "dateOfBirth": "2012-05-15",
  "groupId": "507f1f77bcf86cd799439014",
  "parentId": "507f1f77bcf86cd799439016",
  "gender": "MALE | FEMALE",
  "height": 155, // cm
  "weight": 45, // kg
  "position": "Forward", // Optional
  "profileImage": "https://storage.url/image.jpg" // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "fullName": "Alex Johnson",
    "dateOfBirth": "2012-05-15",
    "clubId": "507f1f77bcf86cd799439012",
    "groupId": "507f1f77bcf86cd799439014",
    "parentId": "507f1f77bcf86cd799439016",
    "qrCode": "MEMBER_507f1f77bcf86cd799439017",
    "paymentStatus": false,
    "medicalStatus": false,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Member created successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "MEMBER_LIMIT_REACHED",
    "message": "Club has reached its member limit"
  }
}
```

---

### 6.2 Get All Members
**Endpoint:** `GET /groups/:groupId/members`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `paymentStatus` - true/false
- `medicalStatus` - true/false
- `search` - Search by name

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "fullName": "Alex Johnson",
      "age": 12,
      "profileImage": "https://storage.url/image.jpg",
      "paymentStatus": true,
      "medicalStatus": true,
      "lastPaymentDate": "2025-01-01T00:00:00Z",
      "lastMedicalDate": "2024-06-15T00:00:00Z",
      "attendanceRate": 92.5,
      "parent": {
        "_id": "507f1f77bcf86cd799439016",
        "fullName": "Parent Name",
        "phoneNumber": "+381641234569"
      }
    }
  ],
  "pagination": { /* pagination info */ }
}
```

---

### 6.3 Get Member Details
**Endpoint:** `GET /members/:memberId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "fullName": "Alex Johnson",
    "dateOfBirth": "2012-05-15",
    "age": 12,
    "gender": "MALE",
    "height": 155,
    "weight": 45,
    "position": "Forward",
    "profileImage": "https://storage.url/image.jpg",
    "qrCode": "MEMBER_507f1f77bcf86cd799439017",
    "group": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "U12 Boys",
      "coach": {
        "fullName": "Jane Smith"
      }
    },
    "parent": {
      "_id": "507f1f77bcf86cd799439016",
      "fullName": "Parent Name",
      "email": "parent@example.com",
      "phoneNumber": "+381641234569"
    },
    "status": {
      "payment": {
        "isPaid": true,
        "lastPaymentDate": "2025-01-01T00:00:00Z",
        "nextPaymentDue": "2025-02-01T00:00:00Z"
      },
      "medical": {
        "isValid": true,
        "lastExamDate": "2024-06-15T00:00:00Z",
        "expiresAt": "2025-06-15T00:00:00Z",
        "daysUntilExpiry": 152
      }
    },
    "stats": {
      "totalTrainings": 48,
      "attendedTrainings": 44,
      "attendanceRate": 91.7,
      "totalCompetitions": 5,
      "attendedCompetitions": 5
    },
    "recentAttendance": [
      {
        "date": "2025-01-14T17:00:00Z",
        "eventTitle": "Training Session",
        "present": true
      }
    ]
  }
}
```

---

### 6.4 Update Member
**Endpoint:** `PATCH /members/:memberId`

**Role Required:** COACH, PARENT (own children only)

**Request Body:**
```json
{
  "height": 157,
  "weight": 47,
  "position": "Point Guard",
  "profileImage": "https://storage.url/new-image.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated member */ },
  "message": "Member updated successfully"
}
```

---

### 6.5 Delete Member
**Endpoint:** `DELETE /members/:memberId`

**Role Required:** OWNER, COACH

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member deleted successfully"
}
```

**Note:** This will also decrement the club's currentMembers count.

---

### 6.6 Get Member QR Code
**Endpoint:** `GET /members/:memberId/qr-code`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCode": "MEMBER_507f1f77bcf86cd799439017",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..." // Base64 image
  }
}
```

---

## 7. Events

### 7.1 Create Event
**Endpoint:** `POST /events`

**Role Required:** COACH

**Request Body:**
```json
{
  "title": "Training Session",
  "type": "TRAINING | COMPETITION",
  "groupId": "507f1f77bcf86cd799439014",
  "startTime": "2025-01-20T17:00:00Z",
  "endTime": "2025-01-20T18:30:00Z",
  "location": "Main Hall",
  "description": "Regular training session", // Optional
  "isRecurring": false, // Optional
  "recurringPattern": { // Optional, if isRecurring = true
    "frequency": "WEEKLY",
    "daysOfWeek": [1, 3, 5], // Monday, Wednesday, Friday
    "endDate": "2025-06-30"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439018",
    "title": "Training Session",
    "type": "TRAINING",
    "groupId": "507f1f77bcf86cd799439014",
    "startTime": "2025-01-20T17:00:00Z",
    "endTime": "2025-01-20T18:30:00Z",
    "location": "Main Hall",
    "createdBy": "507f1f77bcf86cd799439013",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Event created successfully"
}
```

---

### 7.2 Get All Events
**Endpoint:** `GET /events`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `groupId` - Filter by group
- `type` - TRAINING or COMPETITION
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)
- `coachId` - Filter by coach

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "title": "Training Session",
      "type": "TRAINING",
      "group": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "U12 Boys"
      },
      "startTime": "2025-01-20T17:00:00Z",
      "endTime": "2025-01-20T18:30:00Z",
      "location": "Main Hall",
      "attendanceCount": {
        "present": 10,
        "absent": 2,
        "total": 12
      }
    }
  ],
  "pagination": { /* pagination info */ }
}
```

---

### 7.3 Get Event Details
**Endpoint:** `GET /events/:eventId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439018",
    "title": "Training Session",
    "type": "TRAINING",
    "description": "Regular training session",
    "group": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "U12 Boys"
    },
    "coach": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Jane Smith"
    },
    "startTime": "2025-01-20T17:00:00Z",
    "endTime": "2025-01-20T18:30:00Z",
    "location": "Main Hall",
    "attendance": [
      {
        "member": {
          "_id": "memberId1",
          "fullName": "Alex Johnson"
        },
        "present": true,
        "timestamp": "2025-01-20T16:55:00Z"
      }
    ],
    "stats": {
      "totalMembers": 12,
      "present": 10,
      "absent": 2,
      "attendanceRate": 83.3
    },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 7.4 Update Event
**Endpoint:** `PATCH /events/:eventId`

**Role Required:** COACH (event creator)

**Request Body:**
```json
{
  "title": "Updated Training Session",
  "startTime": "2025-01-20T18:00:00Z",
  "location": "Secondary Hall"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated event */ },
  "message": "Event updated successfully"
}
```

---

### 7.5 Delete Event
**Endpoint:** `DELETE /events/:eventId`

**Role Required:** COACH (event creator), OWNER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

### 7.6 Get Calendar Events
**Endpoint:** `GET /calendar`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` - Month number (1-12)
- `year` - Year (e.g., 2025)
- `groupId` - Optional, filter by group

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "2025-01-20": [
      {
        "_id": "eventId1",
        "title": "Training Session",
        "type": "TRAINING",
        "startTime": "2025-01-20T17:00:00Z",
        "endTime": "2025-01-20T18:30:00Z"
      }
    ],
    "2025-01-22": [
      {
        "_id": "eventId2",
        "title": "Local Tournament",
        "type": "COMPETITION",
        "startTime": "2025-01-22T10:00:00Z",
        "endTime": "2025-01-22T16:00:00Z"
      }
    ]
  }
}
```

---

## 8. Attendance

### 8.1 Mark Attendance (QR Scan)
**Endpoint:** `POST /attendance/qr-scan`

**Role Required:** COACH

**Request Body:**
```json
{
  "eventId": "507f1f77bcf86cd799439018",
  "qrCode": "MEMBER_507f1f77bcf86cd799439017"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439019",
    "eventId": "507f1f77bcf86cd799439018",
    "memberId": "507f1f77bcf86cd799439017",
    "member": {
      "fullName": "Alex Johnson",
      "profileImage": "https://storage.url/image.jpg"
    },
    "present": true,
    "timestamp": "2025-01-20T16:55:00Z",
    "scannedBy": "507f1f77bcf86cd799439013"
  },
  "message": "Attendance marked successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QR_CODE",
    "message": "QR code is invalid or member not in this group"
  }
}
```

---

### 8.2 Mark Attendance (Manual)
**Endpoint:** `POST /attendance/manual`

**Role Required:** COACH

**Request Body:**
```json
{
  "eventId": "507f1f77bcf86cd799439018",
  "memberId": "507f1f77bcf86cd799439017",
  "present": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": { /* attendance record */ },
  "message": "Attendance marked successfully"
}
```

---

### 8.3 Bulk Mark Attendance
**Endpoint:** `POST /attendance/bulk`

**Role Required:** COACH

**Request Body:**
```json
{
  "eventId": "507f1f77bcf86cd799439018",
  "attendances": [
    { "memberId": "memberId1", "present": true },
    { "memberId": "memberId2", "present": false },
    { "memberId": "memberId3", "present": true }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "created": 3,
    "records": [ /* array of attendance records */ ]
  },
  "message": "Bulk attendance marked successfully"
}
```

---

### 8.4 Get Attendance for Event
**Endpoint:** `GET /attendance/event/:eventId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "507f1f77bcf86cd799439018",
      "title": "Training Session",
      "startTime": "2025-01-20T17:00:00Z"
    },
    "attendance": [
      {
        "_id": "attendanceId1",
        "member": {
          "_id": "memberId1",
          "fullName": "Alex Johnson",
          "profileImage": "https://storage.url/image.jpg"
        },
        "present": true,
        "timestamp": "2025-01-20T16:55:00Z"
      }
    ],
    "stats": {
      "totalMembers": 12,
      "present": 10,
      "absent": 2,
      "attendanceRate": 83.3
    }
  }
}
```

---

### 8.5 Get Attendance for Member
**Endpoint:** `GET /attendance/member/:memberId`

**Query Parameters:**
- `startDate` - Filter from date
- `endDate` - Filter to date
- `eventType` - TRAINING or COMPETITION

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "member": {
      "_id": "507f1f77bcf86cd799439017",
      "fullName": "Alex Johnson"
    },
    "records": [
      {
        "_id": "attendanceId1",
        "event": {
          "title": "Training Session",
          "startTime": "2025-01-20T17:00:00Z",
          "type": "TRAINING"
        },
        "present": true,
        "timestamp": "2025-01-20T16:55:00Z"
      }
    ],
    "stats": {
      "totalEvents": 48,
      "attended": 44,
      "missed": 4,
      "attendanceRate": 91.7
    }
  },
  "pagination": { /* pagination info */ }
}
```

---

### 8.6 Update Attendance
**Endpoint:** `PATCH /attendance/:attendanceId`

**Role Required:** COACH

**Request Body:**
```json
{
  "present": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated attendance */ },
  "message": "Attendance updated successfully"
}
```

---

### 8.7 Delete Attendance
**Endpoint:** `DELETE /attendance/:attendanceId`

**Role Required:** COACH, OWNER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance record deleted successfully"
}
```

---

## 9. Payments

### 9.1 Record Payment
**Endpoint:** `POST /payments`

**Role Required:** COACH, OWNER

**Request Body:**
```json
{
  "memberId": "507f1f77bcf86cd799439017",
  "amount": 5000, // in RSD dinars
  "paymentDate": "2025-01-15T10:00:00Z",
  "paymentMethod": "CASH | BANK_TRANSFER",
  "note": "January membership fee" // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "memberId": "507f1f77bcf86cd799439017",
    "member": {
      "fullName": "Alex Johnson"
    },
    "amount": 5000,
    "paymentDate": "2025-01-15T10:00:00Z",
    "paymentMethod": "CASH",
    "recordedBy": "507f1f77bcf86cd799439013",
    "month": "2025-01",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Payment recorded successfully. Member status updated to PAID."
}
```

**Side Effect:** Sets `member.paymentStatus = true` and `member.lastPaymentDate = paymentDate`.

---

### 9.2 Get All Payments
**Endpoint:** `GET /payments`

**Role Required:** OWNER, COACH

**Query Parameters:**
- `clubId` - Filter by club
- `groupId` - Filter by group
- `memberId` - Filter by member
- `month` - Filter by month (format: YYYY-MM)
- `startDate` - Filter from date
- `endDate` - Filter to date

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "member": {
        "_id": "507f1f77bcf86cd799439017",
        "fullName": "Alex Johnson"
      },
      "amount": 5000,
      "paymentDate": "2025-01-15T10:00:00Z",
      "paymentMethod": "CASH",
      "recordedBy": {
        "fullName": "Jane Smith"
      },
      "month": "2025-01"
    }
  ],
  "stats": {
    "totalAmount": 175000,
    "totalPayments": 35,
    "averagePayment": 5000
  },
  "pagination": { /* pagination info */ }
}
```

---

### 9.3 Get Payment Details
**Endpoint:** `GET /payments/:paymentId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "member": {
      "_id": "507f1f77bcf86cd799439017",
      "fullName": "Alex Johnson",
      "group": {
        "name": "U12 Boys"
      }
    },
    "amount": 5000,
    "paymentDate": "2025-01-15T10:00:00Z",
    "paymentMethod": "CASH",
    "note": "January membership fee",
    "recordedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Jane Smith",
      "role": "COACH"
    },
    "month": "2025-01",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 9.4 Update Payment
**Endpoint:** `PATCH /payments/:paymentId`

**Role Required:** OWNER

**Request Body:**
```json
{
  "amount": 5500,
  "note": "Updated amount"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated payment */ },
  "message": "Payment updated successfully"
}
```

---

### 9.5 Delete Payment
**Endpoint:** `DELETE /payments/:paymentId`

**Role Required:** OWNER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment deleted successfully"
}
```

**Side Effect:** Updates `member.paymentStatus = false` if this was the current month's payment.

---

### 9.6 Send Payment Reminder
**Endpoint:** `POST /payments/send-reminder`

**Role Required:** COACH

**Request Body:**
```json
{
  "memberIds": ["memberId1", "memberId2"], // Array of member IDs
  "message": "Reminder: Please pay January membership fee" // Optional custom message
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sent": 2,
    "failed": 0,
    "recipients": [
      {
        "memberId": "memberId1",
        "parentName": "Parent 1",
        "status": "SENT"
      },
      {
        "memberId": "memberId2",
        "parentName": "Parent 2",
        "status": "SENT"
      }
    ]
  },
  "message": "Payment reminders sent successfully"
}
```

---

### 9.7 Get Payment Summary
**Endpoint:** `GET /clubs/:clubId/payments/summary`

**Role Required:** OWNER

**Query Parameters:**
- `month` - Month (format: YYYY-MM)
- `year` - Year (e.g., 2025)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "month": "2025-01",
    "totalRevenue": 175000,
    "totalPayments": 35,
    "paidMembers": 30,
    "unpaidMembers": 5,
    "paymentRate": 85.7,
    "byGroup": [
      {
        "groupId": "groupId1",
        "groupName": "U12 Boys",
        "totalRevenue": 60000,
        "paidMembers": 12,
        "unpaidMembers": 0
      }
    ]
  }
}
```

---

## 10. Medical Checks

### 10.1 Record Medical Examination
**Endpoint:** `POST /medical-checks`

**Role Required:** COACH, OWNER

**Request Body:**
```json
{
  "memberId": "507f1f77bcf86cd799439017",
  "examinationDate": "2025-01-15T00:00:00Z",
  "expiryDate": "2026-01-15T00:00:00Z", // Auto-calculated if not provided (365 days)
  "note": "All checks passed" // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "memberId": "507f1f77bcf86cd799439017",
    "member": {
      "fullName": "Alex Johnson"
    },
    "examinationDate": "2025-01-15T00:00:00Z",
    "expiryDate": "2026-01-15T00:00:00Z",
    "isValid": true,
    "recordedBy": "507f1f77bcf86cd799439013",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Medical examination recorded successfully. Member status updated to VALID."
}
```

**Side Effect:** Sets `member.medicalStatus = true` and `member.lastMedicalDate = examinationDate`.

---

### 10.2 Get All Medical Checks
**Endpoint:** `GET /medical-checks`

**Role Required:** OWNER, COACH

**Query Parameters:**
- `clubId` - Filter by club
- `groupId` - Filter by group
- `memberId` - Filter by member
- `status` - VALID or EXPIRED
- `expiringInDays` - Get records expiring within X days (e.g., 30)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "member": {
        "_id": "507f1f77bcf86cd799439017",
        "fullName": "Alex Johnson",
        "group": {
          "name": "U12 Boys"
        }
      },
      "examinationDate": "2025-01-15T00:00:00Z",
      "expiryDate": "2026-01-15T00:00:00Z",
      "isValid": true,
      "daysUntilExpiry": 365,
      "recordedBy": {
        "fullName": "Jane Smith"
      }
    }
  ],
  "stats": {
    "total": 35,
    "valid": 30,
    "expired": 3,
    "expiringSoon": 2 // Within 30 days
  },
  "pagination": { /* pagination info */ }
}
```

---

### 10.3 Get Medical Check Details
**Endpoint:** `GET /medical-checks/:checkId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "member": {
      "_id": "507f1f77bcf86cd799439017",
      "fullName": "Alex Johnson",
      "dateOfBirth": "2012-05-15",
      "group": {
        "name": "U12 Boys"
      },
      "parent": {
        "fullName": "Parent Name",
        "phoneNumber": "+381641234569"
      }
    },
    "examinationDate": "2025-01-15T00:00:00Z",
    "expiryDate": "2026-01-15T00:00:00Z",
    "isValid": true,
    "daysUntilExpiry": 365,
    "note": "All checks passed",
    "recordedBy": {
      "fullName": "Jane Smith",
      "role": "COACH"
    },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 10.4 Update Medical Check
**Endpoint:** `PATCH /medical-checks/:checkId`

**Role Required:** OWNER

**Request Body:**
```json
{
  "examinationDate": "2025-01-16T00:00:00Z",
  "note": "Updated note"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated medical check */ },
  "message": "Medical check updated successfully"
}
```

---

### 10.5 Delete Medical Check
**Endpoint:** `DELETE /medical-checks/:checkId`

**Role Required:** OWNER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Medical check deleted successfully"
}
```

---

### 10.6 Get Expiring Medical Checks
**Endpoint:** `GET /clubs/:clubId/medical-checks/expiring`

**Role Required:** OWNER, COACH

**Query Parameters:**
- `days` - Number of days (default: 30)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "member": {
        "_id": "memberId1",
        "fullName": "Alex Johnson",
        "group": { "name": "U12 Boys" }
      },
      "expiryDate": "2025-02-10T00:00:00Z",
      "daysUntilExpiry": 25,
      "parent": {
        "fullName": "Parent Name",
        "phoneNumber": "+381641234569"
      }
    }
  ]
}
```

---

## 11. Finances

### 11.1 Create Finance Entry
**Endpoint:** `POST /finances`

**Role Required:** OWNER

**Request Body:**
```json
{
  "type": "INCOME | EXPENSE",
  "category": "EQUIPMENT | RENT | SALARY | OTHER",
  "amount": 50000,
  "description": "Basketball equipment purchase",
  "date": "2025-01-15T00:00:00Z",
  "invoice": "https://storage.url/invoice.pdf" // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "clubId": "507f1f77bcf86cd799439012",
    "type": "EXPENSE",
    "category": "EQUIPMENT",
    "amount": 50000,
    "description": "Basketball equipment purchase",
    "date": "2025-01-15T00:00:00Z",
    "recordedBy": "507f1f77bcf86cd799439011",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Finance entry created successfully"
}
```

---

### 11.2 Get All Finance Entries
**Endpoint:** `GET /clubs/:clubId/finances`

**Role Required:** OWNER

**Query Parameters:**
- `type` - INCOME or EXPENSE
- `category` - Filter by category
- `startDate` - Filter from date
- `endDate` - Filter to date
- `month` - Filter by month (YYYY-MM)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "type": "EXPENSE",
      "category": "EQUIPMENT",
      "amount": 50000,
      "description": "Basketball equipment purchase",
      "date": "2025-01-15T00:00:00Z",
      "recordedBy": {
        "fullName": "John Doe"
      }
    }
  ],
  "summary": {
    "totalIncome": 175000,
    "totalExpenses": 95000,
    "netBalance": 80000,
    "byCategory": {
      "EQUIPMENT": 50000,
      "RENT": 30000,
      "SALARY": 15000
    }
  },
  "pagination": { /* pagination info */ }
}
```

---

### 11.3 Get Finance Details
**Endpoint:** `GET /finances/:financeId`

**Role Required:** OWNER

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "clubId": "507f1f77bcf86cd799439012",
    "type": "EXPENSE",
    "category": "EQUIPMENT",
    "amount": 50000,
    "description": "Basketball equipment purchase",
    "date": "2025-01-15T00:00:00Z",
    "invoice": "https://storage.url/invoice.pdf",
    "recordedBy": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "role": "OWNER"
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 11.4 Update Finance Entry
**Endpoint:** `PATCH /finances/:financeId`

**Role Required:** OWNER

**Request Body:**
```json
{
  "amount": 55000,
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated finance entry */ },
  "message": "Finance entry updated successfully"
}
```

---

### 11.5 Delete Finance Entry
**Endpoint:** `DELETE /finances/:financeId`

**Role Required:** OWNER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Finance entry deleted successfully"
}
```

---

### 11.6 Get Financial Summary
**Endpoint:** `GET /clubs/:clubId/finances/summary`

**Role Required:** OWNER

**Query Parameters:**
- `period` - MONTHLY, QUARTERLY, YEARLY
- `year` - Year (e.g., 2025)
- `quarter` - Quarter (1-4, if period=QUARTERLY)
- `month` - Month (1-12, if period=MONTHLY)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "2025-01",
    "income": {
      "membershipFees": 175000,
      "otherIncome": 20000,
      "total": 195000
    },
    "expenses": {
      "equipment": 50000,
      "rent": 30000,
      "salaries": 15000,
      "other": 5000,
      "total": 100000
    },
    "netProfit": 95000,
    "profitMargin": 48.7,
    "comparison": {
      "previousPeriod": {
        "income": 180000,
        "expenses": 90000,
        "netProfit": 90000
      },
      "change": {
        "income": "+8.3%",
        "expenses": "+11.1%",
        "netProfit": "+5.6%"
      }
    }
  }
}
```

---

## 12. Posts (News Feed)

### 12.1 Create Post
**Endpoint:** `POST /posts`

**Role Required:** COACH

**Request Body:**
```json
{
  "groupId": "507f1f77bcf86cd799439014",
  "content": "Great training session today! See you on Wednesday.",
  "media": [ // Optional
    "https://storage.url/image1.jpg",
    "https://storage.url/image2.jpg"
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439023",
    "authorId": "507f1f77bcf86cd799439013",
    "author": {
      "fullName": "Jane Smith",
      "role": "COACH",
      "profileImage": "https://storage.url/profile.jpg"
    },
    "groupId": "507f1f77bcf86cd799439014",
    "content": "Great training session today! See you on Wednesday.",
    "media": [
      "https://storage.url/image1.jpg",
      "https://storage.url/image2.jpg"
    ],
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Post created successfully"
}
```

---

### 12.2 Get All Posts
**Endpoint:** `GET /posts`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `groupId` - Filter by group
- `authorId` - Filter by author

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439023",
      "author": {
        "_id": "507f1f77bcf86cd799439013",
        "fullName": "Jane Smith",
        "role": "COACH",
        "profileImage": "https://storage.url/profile.jpg"
      },
      "group": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "U12 Boys"
      },
      "content": "Great training session today! See you on Wednesday.",
      "media": [
        "https://storage.url/image1.jpg",
        "https://storage.url/image2.jpg"
      ],
      "createdAt": "2025-01-15T10:30:00Z",
      "timeSince": "2 hours ago"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

---

### 12.3 Get Post Details
**Endpoint:** `GET /posts/:postId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439023",
    "author": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Jane Smith",
      "role": "COACH",
      "profileImage": "https://storage.url/profile.jpg"
    },
    "group": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "U12 Boys"
    },
    "content": "Great training session today! See you on Wednesday.",
    "media": [
      "https://storage.url/image1.jpg",
      "https://storage.url/image2.jpg"
    ],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 12.4 Update Post
**Endpoint:** `PATCH /posts/:postId`

**Role Required:** Author only

**Request Body:**
```json
{
  "content": "Updated content"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { /* updated post */ },
  "message": "Post updated successfully"
}
```

---

### 12.5 Delete Post
**Endpoint:** `DELETE /posts/:postId`

**Role Required:** Author, OWNER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 13. Notifications

### 13.1 Register Push Token
**Endpoint:** `POST /notifications/register-token`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "IOS | ANDROID"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```

---

### 13.2 Send Push Notification
**Endpoint:** `POST /notifications/send`

**Role Required:** COACH, OWNER

**Request Body:**
```json
{
  "recipientIds": ["userId1", "userId2"], // Array of user IDs
  "title": "Payment Reminder",
  "body": "Please pay your membership fee for January",
  "data": { // Optional
    "type": "PAYMENT_REMINDER",
    "memberId": "memberId1"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sent": 2,
    "failed": 0,
    "tickets": [
      { "id": "ticket1", "status": "ok" },
      { "id": "ticket2", "status": "ok" }
    ]
  },
  "message": "Notifications sent successfully"
}
```

---

### 13.3 Get Notification History
**Endpoint:** `GET /notifications/history`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "notificationId1",
      "title": "Payment Reminder",
      "body": "Please pay your membership fee for January",
      "read": false,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

---

### 13.4 Mark Notification as Read
**Endpoint:** `PATCH /notifications/:notificationId/read`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 14. Health Check

### 14.1 Health Check
**Endpoint:** `GET /health`

**Description:** Public endpoint to check API health.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0.0",
    "database": "connected",
    "firebase": "connected"
  }
}
```

---

## 15. File Upload

### 15.1 Upload File
**Endpoint:** `POST /upload`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `file` - File to upload
- `type` - PROFILE_IMAGE | POST_IMAGE | POST_VIDEO | INVOICE

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.firebase.com/path/to/file.jpg",
    "filename": "file.jpg",
    "size": 1024567,
    "type": "image/jpeg"
  },
  "message": "File uploaded successfully"
}
```

**Constraints:**
- Max file size: 10 MB for images, 50 MB for videos
- Allowed image types: JPEG, PNG, WebP
- Allowed video types: MP4, MOV

---

## 16. Search

### 16.1 Global Search
**Endpoint:** `GET /search`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` - Search query
- `type` - MEMBER | GROUP | EVENT (optional, searches all if not specified)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "_id": "memberId1",
        "fullName": "Alex Johnson",
        "group": { "name": "U12 Boys" }
      }
    ],
    "groups": [
      {
        "_id": "groupId1",
        "name": "U12 Boys",
        "memberCount": 12
      }
    ],
    "events": [
      {
        "_id": "eventId1",
        "title": "Training Session",
        "startTime": "2025-01-20T17:00:00Z"
      }
    ]
  }
}
```

---

## 17. Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_INVITE_CODE` | 400 | Invite code is invalid or expired |
| `MEMBER_LIMIT_REACHED` | 403 | Club has reached member limit |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_QR_CODE` | 400 | QR code is invalid |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 18. Rate Limiting

All authenticated endpoints are rate-limited:
- **100 requests per 15 minutes** per IP address
- **1000 requests per hour** per authenticated user

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642345200
```

---

## 19. Webhooks (Future Feature)

For future integration with payment gateways or external services:

**Endpoint:** `POST /webhooks/:service`

Services: `stripe`, `paypal`, etc.

---

## 20. API Testing

**Base URL for Testing:** `https://api-staging.4sports.app/api/v1`

**Postman Collection:** Available at `/docs/postman-collection.json`

**Authentication for Testing:**
1. Register a test user via `/auth/register`
2. Use the returned JWT token in all subsequent requests
3. Token expires after 7 days

---

**API Documentation Version:** 1.0
**Last Updated:** 2025-01-15
**Maintained By:** 4Sports Development Team

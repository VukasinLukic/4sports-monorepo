# 4Sports - API Routes Documentation

**Poslednje ažuriranje:** 27. Januar 2026.
**Base URL:** `/api/v1`

Ovaj dokument sadrži kompletnu dokumentaciju svih API ruta, uključujući potrebne izmene bazirane na Figma dizajnima.

---

## Sadržaj

1. [Auth Routes](#1-auth-routes)
2. [Invite Routes](#2-invite-routes)
3. [Groups Routes](#3-groups-routes)
4. [Members Routes](#4-members-routes)
5. [Events Routes](#5-events-routes)
6. [Attendance Routes](#6-attendance-routes)
7. [Evidence Routes (NOVO)](#7-evidence-routes-novo)
8. [Payments Routes](#8-payments-routes)
9. [Medical Checks Routes](#9-medical-checks-routes)
10. [Posts Routes](#10-posts-routes)
11. [Notifications Routes](#11-notifications-routes)

---

## Legenda

- ✅ **Postoji** - Ruta već postoji
- ⚠️ **TODO** - Ruta treba dodati
- 🔄 **UPDATE** - Ruta treba ažurirati

---

## 1. Auth Routes

**Base:** `/api/v1/auth`
**Fajl:** `backend/src/routes/authRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| POST | `/register` | Public | 🔄 UPDATE | Registracija korisnika |
| POST | `/login` | Public | ✅ | Login sa Firebase tokenom |
| GET | `/me` | Private | ✅ | Dohvati trenutnog korisnika |

### POST /register - UPDATE POTREBAN

**Trenutni Request Body:**
```json
{
  "firebaseToken": "string (required)",
  "email": "string (required)",
  "fullName": "string (required)",
  "phoneNumber": "string (optional)",
  "role": "OWNER | COACH | PARENT (required)",
  "inviteCode": "string (required for COACH/PARENT)"
}
```

**Novi Request Body (po Figma):**
```json
{
  "firebaseToken": "string (required)",
  "email": "string (required)",
  "fullName": "string (required)",
  "phoneNumber": "string (required)",
  "dateOfBirth": "date (required)",
  "jmbg": "string (optional)",
  "inviteCode": "string (required for COACH/PARENT)"
}
```

**IZMENE:**
- Ukloniti `role` iz request body - dolazi iz invite koda
- Dodati `dateOfBirth` (obavezno)
- Dodati `jmbg` (opciono)
- Automatski kreirati Member za PARENT role i dodati u grupu iz invite koda

**Novi Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "email": "string",
      "fullName": "string",
      "phoneNumber": "string",
      "role": "COACH | PARENT",
      "clubId": "objectId",
      "groupId": "objectId"
    },
    "club": {
      "name": "string",
      "logo": "string"
    },
    "group": {
      "name": "string"
    },
    "token": "string"
  }
}
```

---

## 2. Invite Routes

**Base:** `/api/v1/invites`
**Fajl:** `backend/src/routes/inviteRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| POST | `/generate` | OWNER, COACH | 🔄 UPDATE | Generiši invite kod |
| GET | `/` | OWNER, COACH | ✅ | Lista svih invite kodova |
| DELETE | `/:code` | OWNER | ✅ | Deaktiviraj kod |

### Nove Rute (TODO)

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| GET | `/validate/:code` | Public | ⚠️ TODO | Validacija koda (za registraciju) |

### POST /generate - UPDATE POTREBAN

**Trenutni Request Body:**
```json
{
  "type": "COACH | MEMBER (required)",
  "maxUses": "number (default: 1)",
  "expiresInDays": "number (default: 7)"
}
```

**Novi Request Body (po Figma):**
```json
{
  "type": "COACH | MEMBER (required)",
  "groupId": "objectId (required for MEMBER)",
  "maxUses": "number (default: 30)",
  "expiresInDays": "number (default: 30)"
}
```

**IZMENE:**
- Dodati `groupId` (obavezno za MEMBER tip)
- Promeniti default `maxUses` sa 1 na 30
- Promeniti default `expiresInDays` sa 7 na 30

### GET /validate/:code - NOVA RUTA

**Pristup:** Public (ne zahteva autentifikaciju)

**Opis:** Validira invite kod i vraća informacije o klubu, grupi i ulozi za prikaz pri registraciji.

**Response (200 - Valid):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "club": {
      "_id": "objectId",
      "name": "FK Partizan",
      "logo": "https://..."
    },
    "group": {
      "_id": "objectId",
      "name": "Juniori",
      "color": "#4CAF50"
    },
    "role": "PARENT",
    "expiresAt": "2026-02-27T00:00:00.000Z"
  }
}
```

**Response (400 - Invalid):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INVITE_CODE",
    "message": "Invite code is expired or no longer valid"
  }
}
```

---

## 3. Groups Routes

**Base:** `/api/v1/groups`
**Fajl:** `backend/src/routes/groupRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| POST | `/` | OWNER, COACH | 🔄 UPDATE | Kreiraj grupu |
| GET | `/` | All Auth | ✅ | Lista grupa u klubu |
| GET | `/:id` | All Auth | 🔄 UPDATE | Detalji grupe |
| PUT | `/:id` | OWNER, COACH | 🔄 UPDATE | Ažuriraj grupu |
| DELETE | `/:id` | OWNER | ✅ | Obriši grupu |

### Nove Rute (TODO)

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| GET | `/:id/members` | OWNER, COACH | ⚠️ TODO | Lista članova grupe |
| POST | `/:id/members` | OWNER, COACH | ⚠️ TODO | Dodaj člana u grupu |
| DELETE | `/:id/members/:memberId` | OWNER, COACH | ⚠️ TODO | Ukloni člana iz grupe |

### POST / - UPDATE POTREBAN

**Trenutni Request Body:**
```json
{
  "name": "string (required)",
  "ageGroup": "string (optional)",
  "sport": "string (optional)",
  "description": "string (optional)",
  "coaches": "[objectId] (required, min 1)"
}
```

**Novi Request Body (po Figma):**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "color": "string (required) - HEX color",
  "ageGroup": "string (optional)",
  "sport": "string (optional)",
  "coaches": "[objectId] (required, min 1)"
}
```

### GET /:id - UPDATE POTREBAN

**Novi Response:**
```json
{
  "success": true,
  "data": {
    "_id": "objectId",
    "name": "Juniori",
    "description": "Uzrast 10-12",
    "color": "#4CAF50",
    "coaches": [{ "_id": "...", "fullName": "..." }],
    "membersCount": 15,
    "isActive": true
  }
}
```

### GET /:id/members - NOVA RUTA

**Opis:** Vraća listu članova grupe sa statusom članarine i poslednjom aktivnošću.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "objectId",
      "fullName": "Marko Markovic",
      "profileImage": "https://...",
      "membershipPaid": true,
      "lastActiveAt": "2026-01-25T14:30:00.000Z"
    }
  ]
}
```

---

## 4. Members Routes

**Base:** `/api/v1/members`
**Fajl:** `backend/src/routes/memberRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| GET | `/` | Public | ✅ | Svi članovi |
| GET | `/club-members` | Public | ✅ | Članovi kluba |
| GET | `/:id` | Public | 🔄 UPDATE | Detalji člana |
| POST | `/` | PARENT | ✅ | Kreiraj člana |
| GET | `/my-children` | PARENT | ✅ | Moja deca |
| PUT | `/:id` | PARENT | 🔄 UPDATE | Ažuriraj člana |
| DELETE | `/:id` | PARENT | ✅ | Obriši člana |

### GET /:id - UPDATE POTREBAN (po Figma node-id=1-2956)

**Novi Response:**
```json
{
  "success": true,
  "data": {
    "_id": "objectId",
    "fullName": "Marko Markovic",
    "email": "marko@email.com",
    "phoneNumber": "+381601234567",
    "dateOfBirth": "2014-05-15",
    "profileImage": "https://...",
    "height": 145,
    "weight": 38,
    "yearsOfExperience": 2,
    "position": "Napadač",
    "jerseyNumber": 10,
    "group": {
      "_id": "objectId",
      "name": "Juniori",
      "color": "#4CAF50"
    },
    "membershipStatus": {
      "isPaid": true,
      "expiresAt": "2026-02-01",
      "monthlyFee": 5000
    },
    "medicalStatus": {
      "isValid": true,
      "expiresAt": "2026-06-15"
    },
    "attendanceRate": 85.5
  }
}
```

### PUT /:id - UPDATE POTREBAN

**Novi Request Body:**
```json
{
  "fullName": "string (optional)",
  "email": "string (optional)",
  "phoneNumber": "string (optional)",
  "profileImage": "string (optional)",
  "height": "number (optional) - cm",
  "weight": "number (optional) - kg",
  "yearsOfExperience": "number (optional)",
  "position": "string (optional)",
  "jerseyNumber": "number (optional)",
  "medicalInfo": {
    "bloodType": "string (optional)",
    "allergies": "string (optional)",
    "medications": "string (optional)",
    "conditions": "string (optional)"
  }
}
```

---

## 5. Events Routes

**Base:** `/api/v1/events`
**Fajl:** `backend/src/routes/eventRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| POST | `/` | OWNER, COACH | 🔄 UPDATE | Kreiraj događaj |
| GET | `/group/:groupId` | All Auth | ✅ | Događaji grupe |
| GET | `/:id` | All Auth | 🔄 UPDATE | Detalji događaja |
| PUT | `/:id` | OWNER, COACH | 🔄 UPDATE | Ažuriraj događaj |
| DELETE | `/:id` | OWNER, COACH | ✅ | Obriši događaj |

### Nove Rute (TODO)

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| GET | `/upcoming` | All Auth | ⚠️ TODO | Predstojeći događaji |
| GET | `/:id/participants` | All Auth | ⚠️ TODO | Lista učesnika |
| POST | `/:id/rsvp` | PARENT | ⚠️ TODO | Potvrdi/odbij dolazak |
| POST | `/:id/checkin` | PARENT | ⚠️ TODO | QR check-in |
| POST | `/:id/manual-checkin` | OWNER, COACH | ⚠️ TODO | Ručni check-in |
| GET | `/:id/qr` | OWNER, COACH | ⚠️ TODO | Generiši QR kod |

### POST / - UPDATE POTREBAN (po Figma node-id=1-2790, 1-2484)

**Novi Request Body:**
```json
{
  // Basic (required)
  "groupId": "objectId (required)",
  "type": "TRAINING | GYM_TRAINING | MATCH | OTHER (required)",
  "startTime": "datetime (required)",
  "endTime": "datetime (required)",

  // Recurring (optional)
  "isRecurring": "boolean (default: false)",
  "recurringDays": "[0-6] - dani u nedelji (M T W T F S S)",
  "recurringUntil": "date (optional)",

  // Advanced (optional)
  "title": "string (auto-generated if not provided)",
  "location": "string (optional)",
  "description": "string (optional)",
  "equipment": "[string] - lista opreme",
  "minParticipants": "number (optional)",
  "maxParticipants": "number (optional)",
  "isMandatory": "boolean (default: true)"
}
```

### GET /:id - UPDATE POTREBAN

**Novi Response (Overview):**
```json
{
  "success": true,
  "data": {
    "_id": "objectId",
    "title": "Trening",
    "type": "TRAINING",
    "startTime": "2026-01-28T17:00:00.000Z",
    "endTime": "2026-01-28T18:30:00.000Z",
    "location": "Teren A",
    "description": "Fokus na dribling",
    "equipment": ["lopta", "čunjevi"],
    "group": {
      "_id": "objectId",
      "name": "Juniori",
      "color": "#4CAF50"
    },
    "createdBy": {
      "_id": "objectId",
      "fullName": "Trener Petar"
    },
    "stats": {
      "totalInvited": 15,
      "confirmed": 10,
      "declined": 2,
      "pending": 3,
      "checkedIn": 0
    },
    "qrCode": "uuid-for-qr"
  }
}
```

### GET /:id/participants - NOVA RUTA

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 15,
      "confirmed": 10,
      "notConfirmed": 5
    },
    "participants": [
      {
        "memberId": "objectId",
        "fullName": "Marko Markovic",
        "profileImage": "https://...",
        "rsvpStatus": "CONFIRMED",
        "checkedIn": false,
        "checkedInAt": null
      }
    ]
  }
}
```

### POST /:id/rsvp - NOVA RUTA

**Request Body:**
```json
{
  "memberId": "objectId (required)",
  "status": "CONFIRMED | DECLINED (required)"
}
```

### POST /:id/checkin - NOVA RUTA

**Request Body:**
```json
{
  "memberId": "objectId (required)",
  "qrCode": "string (required) - QR kod sa eventa"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "checkedInAt": "2026-01-28T17:05:00.000Z"
  }
}
```

---

## 6. Attendance Routes

**Base:** `/api/v1/attendance`
**Fajl:** `backend/src/routes/attendanceRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| POST | `/mark` | OWNER, COACH | ✅ | Označi prisustvo |
| POST | `/bulk-mark` | OWNER, COACH | ✅ | Bulk označavanje |
| GET | `/event/:eventId` | All Auth | ✅ | Prisustvo po događaju |
| GET | `/member/:memberId` | All Auth | 🔄 UPDATE | Prisustvo člana |

### GET /member/:memberId - UPDATE POTREBAN (po Figma node-id=1-3315)

**Query Parameters:**
- `period` - "month" | "year" | "all" (default: "all")
- `startDate` - ISO date (optional)
- `endDate` - ISO date (optional)

**Novi Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEvents": 50,
      "attended": 42,
      "absent": 5,
      "excused": 3,
      "attendanceRate": 84.0
    },
    "history": [
      {
        "eventId": "objectId",
        "eventTitle": "Trening",
        "eventDate": "2026-01-25T17:00:00.000Z",
        "status": "PRESENT",
        "checkedInAt": "2026-01-25T17:02:00.000Z",
        "notes": ""
      }
    ]
  }
}
```

---

## 7. Evidence Routes (NOVO)

**Base:** `/api/v1/evidence`
**Fajl:** `backend/src/routes/evidenceRoutes.ts` (KREIRATI)

**Opis:** Rute za evidenciju članarina i medicinskih pregleda po Figma node-id=1-1228.

### Nove Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| GET | `/membership` | OWNER, COACH | ⚠️ TODO | Lista članova sa statusom članarine |
| GET | `/medical` | OWNER, COACH | ⚠️ TODO | Lista članova sa statusom medicinskog |
| POST | `/membership/:memberId/mark` | OWNER, COACH | ⚠️ TODO | Označi članarinu kao plaćenu |
| POST | `/medical/:memberId/mark` | OWNER, COACH | ⚠️ TODO | Označi medicinski kao validan |
| POST | `/reminder` | OWNER, COACH | ⚠️ TODO | Pošalji podsetnik |

### GET /membership

**Query Parameters:**
- `groupId` - objectId (optional) - filter po grupi
- `period` - "YYYY-MM" (default: current month)
- `status` - "paid" | "unpaid" | "all" (default: "all")

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2026-01",
    "groups": [
      {
        "groupId": "objectId",
        "groupName": "Juniori",
        "groupColor": "#4CAF50",
        "members": [
          {
            "memberId": "objectId",
            "fullName": "Marko Markovic",
            "profileImage": "https://...",
            "membershipPaid": true,
            "membershipPaidDate": "2026-01-05",
            "reminderSent": false
          }
        ]
      }
    ]
  }
}
```

### GET /medical

**Query Parameters:**
- `groupId` - objectId (optional)
- `status` - "valid" | "expired" | "expiring" | "all"

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "groupId": "objectId",
        "groupName": "Juniori",
        "groupColor": "#4CAF50",
        "members": [
          {
            "memberId": "objectId",
            "fullName": "Marko Markovic",
            "medicalValid": true,
            "medicalExpiresAt": "2026-06-15",
            "daysUntilExpiry": 138,
            "reminderSent": false
          }
        ]
      }
    ]
  }
}
```

### POST /membership/:memberId/mark

**Request Body:**
```json
{
  "period": "2026-01",
  "paid": true,
  "amount": 5000,
  "paymentMethod": "keš"
}
```

### POST /reminder

**Request Body:**
```json
{
  "type": "MEMBERSHIP | MEDICAL",
  "memberIds": ["objectId", "objectId"],
  "message": "string (optional) - custom message"
}
```

---

## 8. Payments Routes

**Base:** `/api/v1/payments`
**Fajl:** `backend/src/routes/paymentRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| POST | `/` | OWNER, COACH | 🔄 UPDATE | Kreiraj plaćanje |
| GET | `/club` | OWNER, COACH | ✅ | Sva plaćanja kluba |
| GET | `/member/:memberId` | All Auth | 🔄 UPDATE | Plaćanja člana |
| PATCH | `/:id/paid` | OWNER, COACH | ✅ | Označi kao plaćeno |

### GET /member/:memberId - UPDATE POTREBAN (po Figma node-id=1-3694)

**Novi Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPaid": 45000,
      "totalPending": 5000,
      "totalOverdue": 0
    },
    "payments": [
      {
        "_id": "objectId",
        "type": "MEMBERSHIP",
        "amount": 5000,
        "currency": "RSD",
        "period": { "month": 1, "year": 2026 },
        "dueDate": "2026-01-15",
        "paidDate": "2026-01-10",
        "status": "PAID",
        "paymentMethod": "keš"
      }
    ]
  }
}
```

---

## 9. Medical Checks Routes

**Base:** `/api/v1/medical-checks`

Bez većih promena - postojeće rute su adekvatne.

---

## 10. Posts Routes

**Base:** `/api/v1/posts`
**Fajl:** `backend/src/routes/postRoutes.ts`

### Postojeće Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| POST | `/` | OWNER, COACH | ✅ | Kreiraj post |
| GET | `/` | All Auth | ✅ | Lista postova |
| GET | `/:id` | All Auth | ✅ | Detalji posta |
| PUT | `/:id` | OWNER, Author | ✅ | Ažuriraj post |
| DELETE | `/:id` | OWNER, Author | ✅ | Obriši post |
| POST | `/:postId/comments` | All Auth | ✅ | Dodaj komentar |
| GET | `/:postId/comments` | All Auth | ✅ | Lista komentara |
| DELETE | `/comments/:id` | OWNER, Author | ✅ | Obriši komentar |
| POST | `/like` | All Auth | ✅ | Toggle like |

**Napomena:** PARENT može da čita postove i komentariše, ali ne može da kreira postove.

---

## 11. Notifications Routes

**Base:** `/api/v1/notifications`

### Nove/Ažurirane Rute

| Metod | Ruta | Pristup | Status | Opis |
|-------|------|---------|--------|------|
| GET | `/` | All Auth | ✅ | Lista notifikacija |
| PATCH | `/:id/read` | All Auth | ✅ | Označi kao pročitano |
| PATCH | `/read-all` | All Auth | ✅ | Označi sve kao pročitano |
| GET | `/unread-count` | All Auth | ✅ | Broj nepročitanih |

---

## Rezime Potrebnih Izmena

### Prioritet 1 - Kritično

| Fajl | Izmena |
|------|--------|
| `inviteRoutes.ts` | Dodati GET `/validate/:code` |
| `inviteController.ts` | Dodati `groupId` u generate, nova validate funkcija |
| `authController.ts` | Ukloniti role iz body, automatski kreirati Member |
| `evidenceRoutes.ts` | NOVI FAJL - kompletna implementacija |
| `evidenceController.ts` | NOVI FAJL - kompletna implementacija |

### Prioritet 2 - Važno

| Fajl | Izmena |
|------|--------|
| `groupRoutes.ts` | Dodati GET `/:id/members` |
| `eventRoutes.ts` | Dodati `/participants`, `/rsvp`, `/checkin`, `/qr` |
| `eventController.ts` | Podrška za recurring, equipment, QR |

### Prioritet 3 - Poboljšanje

| Fajl | Izmena |
|------|--------|
| `memberController.ts` | Proširiti response sa novim poljima |
| `attendanceController.ts` | Dodati rsvpStatus, checkedIn polja |
| `paymentController.ts` | Dodati period, summary u response |

---

*Dokument će biti ažuriran kako se implementacija bude razvijala.*

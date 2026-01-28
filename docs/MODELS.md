# 4Sports - Database Models Documentation

**Poslednje ažuriranje:** 27. Januar 2026.
**Bazirano na:** Figma dizajnima iz `docs/FIGMA_DESIGNS.md`

Ovaj dokument sadrži kompletnu dokumentaciju svih database modela u 4Sports aplikaciji, uključujući potrebna proširenja bazirana na Figma dizajnima.

---

## Sadržaj

1. [User](#1-user)
2. [Club](#2-club)
3. [Group](#3-group)
4. [Member](#4-member)
5. [Event](#5-event)
6. [Attendance (Event)](#6-attendance-event)
7. [MembershipRecord (Evidencija)](#7-membershiprecord-evidencija)
8. [Payment](#8-payment)
9. [MedicalCheck](#9-medicalcheck)
10. [Post](#10-post)
11. [Comment](#11-comment)
12. [Like](#12-like)
13. [Notification](#13-notification)
14. [InviteCode](#14-invitecode)
15. [Budget](#15-budget)
16. [Transaction](#16-transaction)

---

## Legenda

- ✅ **Postoji** - Atribut već postoji u backendu
- ⚠️ **TODO** - Atribut treba dodati (iz Figma dizajna)
- 🔄 **UPDATE** - Atribut treba ažurirati

---

## 1. User

**Lokacija:** `backend/src/models/User.ts`
**Opis:** Predstavlja korisnike sistema (Owner, Coach, Parent)

### Atributi

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `firebaseUid` | String | Da | ✅ | Firebase Authentication ID (unique) |
| `email` | String | Da | ✅ | Email adresa (unique, lowercase) |
| `fullName` | String | Da | ✅ | Puno ime (2-100 karaktera) |
| `phoneNumber` | String | Ne | ✅ | Telefon |
| `profileImage` | String | Ne | ✅ | URL profilne slike |
| `role` | Enum | Da | ✅ | 'OWNER' \| 'COACH' \| 'PARENT' |
| `clubId` | ObjectId | Da | ✅ | Reference na Club |
| `pushToken` | String | Ne | ✅ | Expo push notification token |
| `dateOfBirth` | Date | Ne | ⚠️ TODO | Datum rođenja (iz Figma registracije) |
| `jmbg` | String | Ne | ⚠️ TODO | JMBG (iz Figma registracije) |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

### Hijerarhija Uloga
```
OWNER (3) > COACH (2) > PARENT (1)
```

---

## 2. Club

**Lokacija:** `backend/src/models/Club.ts`
**Opis:** Predstavlja sportske klubove

### Atributi

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `name` | String | Da | ✅ | Ime kluba |
| `ownerId` | ObjectId | Ne | ✅ | Reference na User (owner) |
| `address` | String | Ne | ✅ | Adresa kluba |
| `phoneNumber` | String | Ne | ✅ | Kontakt telefon |
| `email` | String | Ne | ✅ | Kontakt email |
| `logo` | String | Ne | ⚠️ TODO | URL loga (za prikaz pri registraciji) |
| `subscriptionPlan` | Enum | Ne | ✅ | 'FREE' \| 'BASIC' \| 'PRO' |
| `memberLimit` | Number | Ne | ✅ | Max broj članova |
| `currentMembers` | Number | Ne | ✅ | Trenutni broj članova |
| `monthlyFee` | Number | Ne | ⚠️ TODO | Mesečna članarina (RSD) |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

---

## 3. Group

**Lokacija:** `backend/src/models/Group.ts`
**Opis:** Predstavlja grupe unutar kluba (uzrastne grupe, timovi)

### Atributi (Ažurirano po Figma)

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `clubId` | ObjectId | Da | ✅ | Reference na Club |
| `name` | String | Da | ✅ | Ime grupe (npr. "Juniori", "Seniori") |
| `description` | String | Ne | ✅ | Opis grupe |
| `color` | String | Ne | ⚠️ TODO | HEX boja grupe (iz Figma - color picker) |
| `ageGroup` | String | Ne | ✅ | Uzrast ("U10", "U12", itd.) |
| `sport` | String | Ne | ✅ | Sport |
| `coaches` | [ObjectId] | Da | ✅ | Reference na User[] (treneri) |
| `isActive` | Boolean | Ne | ✅ | Da li je grupa aktivna |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

### Figma UI Reference
- **Lista Grupa** (node-id=1-2863): Prikazuje grupe, klik proširuje listu članova
- **Kreiranje Grupe** (node-id=1-3165): Forma sa naziv, opis, color picker

---

## 4. Member

**Lokacija:** `backend/src/models/Member.ts`
**Opis:** Predstavlja članove kluba (deca/sportisti)

### Atributi (Ažurirano po Figma profilu node-id=1-3854)

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `fullName` | String | Da | ✅ | Puno ime |
| `dateOfBirth` | Date | Da | ✅ | Datum rođenja |
| `gender` | Enum | Da | ✅ | 'MALE' \| 'FEMALE' \| 'OTHER' |
| `parentId` | ObjectId | Da | ✅ | Reference na User (PARENT) |
| `clubs` | [ClubMembership] | Da | ✅ | Lista članstava |
| `profileImage` | String | Ne | ✅ | URL profilne slike |
| `email` | String | Ne | ⚠️ TODO | Email člana |
| `phoneNumber` | String | Ne | ⚠️ TODO | Telefon člana |
| `address` | String | Ne | ⚠️ TODO | Adresa |
| `height` | Number | Ne | ⚠️ TODO | Visina (cm) - iz Figma profila |
| `weight` | Number | Ne | ⚠️ TODO | Težina (kg) - iz Figma profila |
| `yearsOfExperience` | Number | Ne | ⚠️ TODO | Godine iskustva - iz Figma profila |
| `position` | String | Ne | ⚠️ TODO | Pozicija/uloga u timu (npr. "Golman") |
| `jerseyNumber` | Number | Ne | ⚠️ TODO | Broj dresa - iz Figma profila |
| `jmbg` | String | Ne | ⚠️ TODO | JMBG - iz Figma registracije |
| `medicalInfo` | Object | Ne | ✅ | Medicinske informacije |
| `emergencyContact` | Object | Ne | ✅ | Kontakt za hitne slučajeve |
| `lastActiveAt` | Date | Ne | ⚠️ TODO | Poslednja aktivnost (za prikaz u listi grupa) |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

### ClubMembership Struktura
```typescript
interface ClubMembership {
  clubId: ObjectId;
  groupId: ObjectId;
  joinedAt: Date;
  status: 'ACTIVE' | 'INACTIVE';
}
```

### Figma UI Reference
- **Profil člana** (node-id=1-2956): Osnovne info + tabovi
- **Member profil** (node-id=1-3854): Detalji sa visina, težina, pozicija, broj dresa

---

## 5. Event

**Lokacija:** `backend/src/models/Event.ts`
**Opis:** Predstavlja treninge, utakmice i druge događaje

### Atributi (Ažurirano po Figma node-id=1-2790 i 1-2484)

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `clubId` | ObjectId | Da | ✅ | Reference na Club |
| `groupId` | ObjectId | Da | ✅ | Reference na Group (dropdown u formi) |
| `title` | String | Da | ✅ | Naslov |
| `description` | String | Ne | ✅ | Opis (advanced opcija) |
| `type` | Enum | Da | 🔄 UPDATE | Tipovi iz Figma |
| `startTime` | Date | Da | ✅ | Početak (date + time picker) |
| `endTime` | Date | Da | ✅ | Kraj (time picker) |
| `location` | String | Ne | ✅ | Lokacija (advanced opcija) |
| `createdBy` | ObjectId | Da | ✅ | Reference na User |
| `isMandatory` | Boolean | Ne | ✅ | Da li je obavezno |
| `status` | Enum | Ne | ✅ | 'SCHEDULED' \| 'CANCELLED' \| 'COMPLETED' |
| `qrCode` | String | Auto | ⚠️ TODO | UUID za QR check-in |
| `equipment` | [String] | Ne | ⚠️ TODO | Lista opreme (advanced) - npr. ["lopta", "čunjevi"] |
| `minParticipants` | Number | Ne | ⚠️ TODO | Min učesnika (advanced) |
| `maxParticipants` | Number | Ne | ⚠️ TODO | Max učesnika (advanced) |
| `isRecurring` | Boolean | Ne | ⚠️ TODO | Da li se ponavlja |
| `recurringDays` | [Number] | Ne | ⚠️ TODO | Dani ponavljanja [0-6] (M T W T F S S) |
| `recurringUntil` | Date | Ne | ⚠️ TODO | Do kada se ponavlja |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

### Event Types (UPDATE po Figma)
```typescript
type EventType =
  | 'TRAINING'      // Trening
  | 'GYM_TRAINING'  // Teretana
  | 'MATCH'         // Utakmica
  | 'OTHER';        // Custom (Add Event)
```

### Figma UI Reference
- **Basic forma** (node-id=1-2790): grupa, tip, datum, vreme, recurring days
- **Advanced forma** (node-id=1-2484): + lokacija, oprema, min/max, opis
- **Event Overview** (node-id=1-1692): sve info + QR dugme
- **Participants** (node-id=1-1744): lista sa confirmed/not + check-in status

---

## 6. Attendance (Event)

**Lokacija:** `backend/src/models/Attendance.ts`
**Opis:** Prati prisustvo članova na događajima

### Atributi (Ažurirano po Figma node-id=1-3315 i 1-1744)

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `eventId` | ObjectId | Da | ✅ | Reference na Event |
| `memberId` | ObjectId | Da | ✅ | Reference na Member |
| `status` | Enum | Ne | 🔄 UPDATE | Status prisustva |
| `rsvpStatus` | Enum | Ne | ⚠️ TODO | Pre-event potvrda |
| `rsvpAt` | Date | Ne | ⚠️ TODO | Kada je potvrdio RSVP |
| `checkedIn` | Boolean | Ne | ⚠️ TODO | Da li je checked-in |
| `checkedInAt` | Date | Ne | ⚠️ TODO | Vreme check-in-a |
| `checkinMethod` | Enum | Ne | ⚠️ TODO | 'QR' \| 'MANUAL' |
| `markedBy` | ObjectId | Ne | ✅ | Ko je označio (trener) |
| `markedAt` | Date | Ne | ✅ | Kada je označeno |
| `notes` | String | Ne | ✅ | Beleške |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

### Status Enum (UPDATE)
```typescript
// Postojeći
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';

// RSVP Status (NOVO)
type RsvpStatus = 'CONFIRMED' | 'DECLINED' | 'PENDING';
```

### Figma UI Reference
- **Participants tab** (node-id=1-1744): confirmed/not confirmed + check-in ikonica
- **Member Attendance** (node-id=1-3315): istorija sa statusima

---

## 7. MembershipRecord (Evidencija) - NOVI MODEL

**Lokacija:** `backend/src/models/MembershipRecord.ts` (KREIRATI)
**Opis:** Mesečna evidencija članarina i medicinskih pregleda po članu

### Atributi (po Figma node-id=1-1228)

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ⚠️ TODO | Primary Key |
| `memberId` | ObjectId | Da | ⚠️ TODO | Reference na Member |
| `clubId` | ObjectId | Da | ⚠️ TODO | Reference na Club |
| `groupId` | ObjectId | Da | ⚠️ TODO | Reference na Group |
| `period` | String | Da | ⚠️ TODO | Format: "YYYY-MM" |
| `membershipPaid` | Boolean | Ne | ⚠️ TODO | Da li je članarina plaćena |
| `membershipPaidDate` | Date | Ne | ⚠️ TODO | Datum plaćanja |
| `membershipPaymentId` | ObjectId | Ne | ⚠️ TODO | Reference na Payment |
| `medicalCheckValid` | Boolean | Ne | ⚠️ TODO | Da li je medicinski validan |
| `medicalCheckId` | ObjectId | Ne | ⚠️ TODO | Reference na MedicalCheck |
| `reminderSent` | Boolean | Ne | ⚠️ TODO | Da li je poslat podsetnik |
| `reminderSentAt` | Date | Ne | ⚠️ TODO | Kada je poslat |
| `createdAt` | Date | Auto | ⚠️ TODO | Datum kreiranja |
| `updatedAt` | Date | Auto | ⚠️ TODO | Datum ažuriranja |

### Figma UI Reference
- **Evidencija** (node-id=1-1228): Lista sa checkbox-ovima za članarinu/medicinski, zvonce za podsetnik

**NAPOMENA:** Ovo je različito od Attendance! Attendance je za događaje, MembershipRecord je za mesečnu evidenciju članarine/medicinskog.

---

## 8. Payment

**Lokacija:** `backend/src/models/Payment.ts`
**Opis:** Prati finansijska plaćanja

### Atributi (Ažurirano po Figma node-id=1-3694)

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `clubId` | ObjectId | Da | ✅ | Reference na Club |
| `memberId` | ObjectId | Da | ✅ | Reference na Member |
| `type` | Enum | Da | ✅ | 'MEMBERSHIP' \| 'EVENT' \| 'EQUIPMENT' \| 'OTHER' |
| `amount` | Number | Da | ✅ | Iznos |
| `currency` | String | Ne | ✅ | Valuta (default: 'RSD') |
| `description` | String | Ne | ✅ | Opis |
| `dueDate` | Date | Da | ✅ | Rok plaćanja |
| `paidDate` | Date | Ne | ✅ | Datum plaćanja |
| `status` | Enum | Ne | ✅ | 'PENDING' \| 'PAID' \| 'OVERDUE' \| 'CANCELLED' |
| `paymentMethod` | String | Ne | 🔄 UPDATE | Slobodan tekst: "keš", "kartica", itd. |
| `period` | Object | Ne | ⚠️ TODO | { month: 1-12, year: YYYY } |
| `receiptNumber` | String | Ne | ✅ | Broj priznanice |
| `notes` | String | Ne | ✅ | Beleške |
| `createdBy` | ObjectId | Da | ✅ | Reference na User |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

### Figma UI Reference
- **Istorija plaćanja** (node-id=1-3694): datum, iznos, ukupno dugovanje, status, metod, mesečni period
- **Membership tab** (node-id=1-3022): istorija sa datumom, iznosom, statusom

---

## 9. MedicalCheck

**Lokacija:** `backend/src/models/MedicalCheck.ts`
**Opis:** Prati medicinske preglede članova

### Atributi

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `memberId` | ObjectId | Da | ✅ | Reference na Member |
| `clubId` | ObjectId | Ne | ⚠️ TODO | Reference na Club |
| `issueDate` | Date | Da | ✅ | Datum izdavanja |
| `validUntil` | Date | Da | ✅ | Važi do |
| `documentUrl` | String | Ne | ✅ | URL dokumenta |
| `status` | Enum | Ne | ✅ | 'VALID' \| 'EXPIRED' \| 'PENDING' |
| `doctorName` | String | Ne | ✅ | Ime lekara |
| `notes` | String | Ne | ✅ | Beleške |
| `uploadedBy` | ObjectId | Da | ✅ | Reference na User |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

---

## 10. Post

**Lokacija:** `backend/src/models/Post.ts`
**Opis:** Predstavlja vesti i objave (News feed)

### Atributi

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `clubId` | ObjectId | Da | ✅ | Reference na Club |
| `authorId` | ObjectId | Da | ✅ | Reference na User |
| `title` | String | Da | ✅ | Naslov |
| `content` | String | Da | ✅ | Sadržaj |
| `images` | [String] | Ne | ✅ | URL-ovi slika |
| `visibility` | Enum | Ne | ✅ | Vidljivost |
| `isPinned` | Boolean | Ne | ✅ | Da li je zakačen |
| `type` | Enum | Ne | ✅ | Tip objave |
| `tags` | [String] | Ne | ✅ | Tagovi |
| `likesCount` | Number | Ne | ✅ | Broj lajkova |
| `commentsCount` | Number | Ne | ✅ | Broj komentara |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

**Figma napomena:** Member/Parent može da čita i komentariše, ali ne može da kreira objave.

---

## 11-12. Comment & Like

Bez promena - modeli su kompletni.

---

## 13. Notification

**Lokacija:** `backend/src/models/Notification.ts`

Bez većih promena. Dodati tipove notifikacija:
- `MEMBERSHIP_REMINDER` - Podsetnik za članarinu
- `MEDICAL_REMINDER` - Podsetnik za medicinski

---

## 14. InviteCode

**Lokacija:** `backend/src/models/InviteCode.ts`
**Opis:** Upravlja pozivnicama za pridruživanje klubu/grupi

### Atributi (ZNAČAJNE IZMENE po Figma node-id=1-3132 i 1-1206)

| Atribut | Tip | Required | Status | Opis |
|---------|-----|----------|--------|------|
| `_id` | ObjectId | Auto | ✅ | Primary Key |
| `code` | String | Da | ✅ | Kod (unique, uppercase) |
| `clubId` | ObjectId | Da | ✅ | Reference na Club |
| `groupId` | ObjectId | Da | ⚠️ TODO | Reference na Group - OBAVEZNO |
| `createdBy` | ObjectId | Da | ✅ | Reference na User |
| `type` | Enum | Da | ✅ | 'COACH' \| 'MEMBER' |
| `role` | Enum | Ne | ⚠️ TODO | Predodređena uloga: 'COACH' \| 'PARENT' |
| `expiresAt` | Date | Da | ✅ | Datum isteka |
| `usedCount` | Number | Ne | ✅ | Broj korišćenja |
| `maxUses` | Number | Ne | 🔄 UPDATE | Max korišćenja (default: 30, ne 1) |
| `isActive` | Boolean | Ne | ✅ | Da li je aktivan |
| `createdAt` | Date | Auto | ✅ | Datum kreiranja |
| `updatedAt` | Date | Auto | ✅ | Datum poslednje izmene |

### KLJUČNE IZMENE PO FIGMA:

1. **groupId je OBAVEZAN** - Kod reprezentuje grupu, ne pojedinačnog člana
2. **maxUses default = 30** - Jedan kod koristi više ljudi za istu grupu
3. **role** - Predodređena uloga koju dobija korisnik pri registraciji

### Validacija API Response (za prikaz pri registraciji)
```typescript
interface InviteValidationResponse {
  valid: boolean;
  clubName: string;      // Ime kluba
  clubLogo: string;      // Logo kluba
  groupName: string;     // Ime grupe
  role: 'COACH' | 'PARENT';  // Predodređena uloga
}
```

### Figma UI Reference
- **Invite screen** (node-id=1-3132): Dropdown za grupu, dugme za kopiranje poruke sa kodom
- **Registracija početna** (node-id=1-1206): Polje za kod, nakon unosa prikazuje club info i ulogu

---

## 15-16. Budget & Transaction

Bez promena - koriste se za finansije na nivou kluba.

---

## Dijagram Relacija (Ažuriran)

```
                         ┌─────────────┐
                         │    Club     │
                         │  + logo     │
                         │  + monthlyFee│
                         └──────┬──────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
     ┌──────────┐        ┌──────────┐        ┌──────────┐
     │   User   │        │  Group   │        │  Event   │
     │ + jmbg   │◄───────│ + color  │◄───────│ + qrCode │
     │ + dob    │        │          │        │ + equipment│
     └────┬─────┘        └────┬─────┘        │ + recurring│
          │                   │              └────┬─────┘
          │                   │                   │
          │    ┌──────────────┴──────────┐       │
          │    │                         │       │
          ▼    ▼                         ▼       ▼
     ┌──────────┐              ┌──────────────────┐
     │  Member  │◄─────────────│   Attendance     │
     │ + height │              │ + rsvpStatus     │
     │ + weight │              │ + checkedIn      │
     │ + position│             │ + checkinMethod  │
     │ + jersey │              └──────────────────┘
     └────┬─────┘
          │
          ├────────────────┬─────────────┐
          │                │             │
          ▼                ▼             ▼
     ┌─────────┐    ┌───────────┐  ┌─────────────────┐
     │ Payment │    │MedicalChk │  │MembershipRecord │
     │+ period │    │           │  │ (NOVI MODEL)    │
     └─────────┘    └───────────┘  │ + membershipPaid│
                                   │ + medicalValid  │
                                   │ + reminderSent  │
                                   └─────────────────┘

     ┌─────────────────┐
     │   InviteCode    │
     │ + groupId (REQ) │
     │ + role          │
     │ + maxUses=30    │
     └─────────────────┘
```

---

## Akcioni Plan Izmena

### Backend - Prioritet 1 (Kritično)

1. **InviteCode model**
   - Dodati `groupId` (required)
   - Dodati `role`
   - Promeniti `maxUses` default na 30
   - Nova ruta: `GET /api/v1/invites/validate/:code`

2. **Group model**
   - Dodati `color` atribut

3. **MembershipRecord model** (NOVI)
   - Kreirati kompletan model
   - Kreirati controller i rute

### Backend - Prioritet 2

4. **Member model**
   - Dodati: `height`, `weight`, `yearsOfExperience`, `position`, `jerseyNumber`, `jmbg`, `lastActiveAt`

5. **Event model**
   - Dodati: `qrCode`, `equipment`, `minParticipants`, `maxParticipants`, `isRecurring`, `recurringDays`, `recurringUntil`
   - Ažurirati `type` enum

6. **Attendance model**
   - Dodati: `rsvpStatus`, `rsvpAt`, `checkedIn`, `checkedInAt`, `checkinMethod`

### Backend - Prioritet 3

7. **User model**
   - Dodati: `dateOfBirth`, `jmbg`

8. **Club model**
   - Dodati: `logo`, `monthlyFee`

9. **Payment model**
   - Dodati: `period` object

---

*Dokument će biti ažuriran kako se implementacija bude razvijala.*

/**
 * 4Sports Comprehensive Seed Script
 *
 * Creates a full demo dataset for FK 4Sports:
 * - 1 Owner (uses existing Firebase user: 4sportsai@gmail.com)
 * - 3 Coaches (created in Firebase + MongoDB)
 * - 4 Groups: Pioniri, Kadeti, Juniori, Seniori
 * - 10 Members spread across groups
 * - 14 months of history (payments, transactions, events, attendance)
 * - Posts, comments, medical checks, notifications
 *
 * Usage: npx ts-node src/seeds/seedAll.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
import * as path from 'path';
import { connectDB, disconnectDB } from '../config/db';

// Models
import User from '../models/User';
import Club from '../models/Club';
import Group from '../models/Group';
import Member from '../models/Member';
import Event from '../models/Event';
import Attendance from '../models/Attendance';
import Payment from '../models/Payment';
import Transaction from '../models/Transaction';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import Notification from '../models/Notification';
import MedicalCheck from '../models/MedicalCheck';
import InviteCode from '../models/InviteCode';
import Budget from '../models/Budget';

// ─── Firebase Init ───
const serviceAccountPath = path.join(__dirname, '../../firebase-admin-key.json');
const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

// ─── Helpers ───
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Firebase User Creation ───
async function getOrCreateFirebaseUser(email: string, password: string, displayName: string): Promise<string> {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    console.log(`  ℹ️  Firebase user exists: ${email} (${existing.uid})`);
    return existing.uid;
  } catch {
    const created = await admin.auth().createUser({ email, password, displayName });
    console.log(`  ✅ Firebase user created: ${email} (${created.uid})`);
    return created.uid;
  }
}

// ─── Data Definitions ───

const OWNER_EMAIL = '4sportsai@gmail.com';
const DEFAULT_PASSWORD = 'Demo1234!';

const COACHES = [
  { email: 'trener.marko@4sports.demo', fullName: 'Marko Nikolić', phone: '+381641234567' },
  { email: 'trener.stefan@4sports.demo', fullName: 'Stefan Jovanović', phone: '+381642345678' },
  { email: 'trener.milan@4sports.demo', fullName: 'Milan Petrović', phone: '+381643456789' },
];

const GROUPS_DEF = [
  { name: 'Pioniri', ageGroup: 'U-12', sport: 'Fudbal', color: '#22c55e', description: 'Deca uzrasta 10-12 godina' },
  { name: 'Kadeti', ageGroup: 'U-15', sport: 'Fudbal', color: '#3b82f6', description: 'Omladinci uzrasta 13-15 godina' },
  { name: 'Juniori', ageGroup: 'U-18', sport: 'Fudbal', color: '#f59e0b', description: 'Juniori uzrasta 16-18 godina' },
  { name: 'Seniori', ageGroup: '18+', sport: 'Fudbal', color: '#ef4444', description: 'Seniorski tim' },
];

const MEMBERS_DEF = [
  // Pioniri (3)
  { fullName: 'Luka Stojanović', dob: '2013-03-15', gender: 'MALE', position: 'Napadač', jersey: 9, group: 'Pioniri' },
  { fullName: 'Nikola Đorđević', dob: '2013-08-22', gender: 'MALE', position: 'Golman', jersey: 1, group: 'Pioniri' },
  { fullName: 'Sara Ilić', dob: '2014-01-10', gender: 'FEMALE', position: 'Vezni', jersey: 10, group: 'Pioniri' },
  // Kadeti (3)
  { fullName: 'Marko Popović', dob: '2010-05-20', gender: 'MALE', position: 'Defanzivac', jersey: 4, group: 'Kadeti' },
  { fullName: 'Filip Kovačević', dob: '2010-11-03', gender: 'MALE', position: 'Napadač', jersey: 11, group: 'Kadeti' },
  { fullName: 'Ana Mihailović', dob: '2011-07-14', gender: 'FEMALE', position: 'Vezni', jersey: 8, group: 'Kadeti' },
  // Juniori (2)
  { fullName: 'Stefan Vasić', dob: '2007-09-28', gender: 'MALE', position: 'Napadač', jersey: 7, group: 'Juniori' },
  { fullName: 'Aleksa Janković', dob: '2008-02-11', gender: 'MALE', position: 'Bek', jersey: 3, group: 'Juniori' },
  // Seniori (2)
  { fullName: 'Nemanja Todorović', dob: '2003-04-05', gender: 'MALE', position: 'Kapiten / Vezni', jersey: 6, group: 'Seniori' },
  { fullName: 'Đorđe Simić', dob: '2001-12-19', gender: 'MALE', position: 'Golman', jersey: 1, group: 'Seniori' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const LOCATIONS = ['Stadion "Crvena Zvezda"', 'Teren "Banjica"', 'Hala "Voždovac"', 'Teren "Ada Ciganlija"', 'Stadion "Partizan"'];

// ─── Main Seed Function ───
async function seed() {
  console.log('\n🌱 Starting comprehensive seed...\n');

  // ═══ CLEAN UP ═══
  console.log('🧹 Cleaning existing data...');
  await Promise.all([
    User.deleteMany({}),
    Club.deleteMany({}),
    Group.deleteMany({}),
    Member.deleteMany({}),
    Event.deleteMany({}),
    Attendance.deleteMany({}),
    Payment.deleteMany({}),
    Transaction.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Like.deleteMany({}),
    Notification.deleteMany({}),
    MedicalCheck.deleteMany({}),
    InviteCode.deleteMany({}),
    Budget.deleteMany({}),
  ]);
  console.log('  ✅ All collections cleared\n');

  // ═══ 1. CLUB ═══
  console.log('🏟️  Creating club...');
  const club = await Club.create({
    name: 'FK 4Sports',
    address: 'Bulevar Vojvode Mišića 15, Beograd',
    phoneNumber: '+381111234567',
    email: '4sportsai@gmail.com',
    subscriptionPlan: 'PRO',
    memberLimit: 500,
    currentMembers: 0,
  });
  console.log(`  ✅ Club created: ${club.name} (${club._id})\n`);

  // ═══ 2. OWNER ═══
  console.log('👑 Creating owner...');
  const ownerFirebaseUid = await getOrCreateFirebaseUser(OWNER_EMAIL, DEFAULT_PASSWORD, 'Vlasnik 4Sports');
  const owner = await User.create({
    firebaseUid: ownerFirebaseUid,
    email: OWNER_EMAIL,
    fullName: 'Vlasnik 4Sports',
    role: 'OWNER',
    clubId: club._id,
    phoneNumber: '+381601234567',
  });
  club.ownerId = owner._id as any;
  await club.save();
  console.log(`  ✅ Owner: ${owner.fullName} (${owner.email})\n`);

  // ═══ 3. COACHES ═══
  console.log('🏋️  Creating coaches...');
  const coaches: any[] = [];
  for (const c of COACHES) {
    const firebaseUid = await getOrCreateFirebaseUser(c.email, DEFAULT_PASSWORD, c.fullName);
    const coach = await User.create({
      firebaseUid,
      email: c.email,
      fullName: c.fullName,
      role: 'COACH',
      clubId: club._id,
      phoneNumber: c.phone,
    });
    coaches.push(coach);
    console.log(`  ✅ Coach: ${coach.fullName} (${coach.email})`);
  }
  console.log();

  // ═══ 4. GROUPS ═══
  console.log('⚽ Creating groups...');
  const groups: any[] = [];
  const coachAssignment = [
    [coaches[0]._id],                          // Pioniri: Marko
    [coaches[1]._id],                          // Kadeti: Stefan
    [coaches[0]._id, coaches[2]._id],          // Juniori: Marko + Milan
    [coaches[2]._id],                          // Seniori: Milan
  ];
  for (let i = 0; i < GROUPS_DEF.length; i++) {
    const g = GROUPS_DEF[i];
    const group = await Group.create({
      clubId: club._id,
      name: g.name,
      ageGroup: g.ageGroup,
      sport: g.sport,
      color: g.color,
      description: g.description,
      coaches: coachAssignment[i],
      isActive: true,
    });
    groups.push(group);
    console.log(`  ✅ Group: ${group.name} (${group.ageGroup}) — Coaches: ${coachAssignment[i].length}`);
  }
  console.log();

  // ═══ 5. MEMBERS ═══
  console.log('👥 Creating members...');
  const members: any[] = [];
  const groupMap: Record<string, any> = {};
  for (const g of groups) groupMap[g.name] = g;

  for (const m of MEMBERS_DEF) {
    const group = groupMap[m.group];
    const joinedAt = randomDate(monthsAgo(14), monthsAgo(6));
    const member = await Member.create({
      fullName: m.fullName,
      dateOfBirth: new Date(m.dob),
      gender: m.gender,
      clubs: [{
        clubId: club._id,
        groupId: group._id,
        joinedAt,
        status: 'ACTIVE',
      }],
      position: m.position,
      jerseyNumber: m.jersey,
      height: randomInt(140, 190),
      weight: randomInt(40, 85),
      medicalInfo: {
        bloodType: randomPick(BLOOD_TYPES),
        lastCheckDate: randomDate(monthsAgo(6), new Date()),
        expiryDate: daysFromNow(randomInt(30, 365)),
      },
      bodyMetrics: {
        height: randomInt(140, 190),
        weight: randomInt(40, 85),
        updatedAt: new Date(),
      },
      emergencyContact: {
        name: `Roditelj ${m.fullName.split(' ')[1]}`,
        relationship: 'Roditelj',
        phoneNumber: `+3816${randomInt(10000000, 99999999)}`,
      },
    });
    members.push({ ...member.toObject(), groupName: m.group });
    console.log(`  ✅ Member: ${member.fullName} → ${m.group} (#${m.jersey})`);
  }
  club.currentMembers = members.length;
  await club.save();
  console.log();

  // ═══ 6. PAYMENTS (14 months of membership history) ═══
  console.log('💰 Creating payment history (14 months)...');
  const membershipFee: Record<string, number> = {
    'Pioniri': 3000,
    'Kadeti': 3500,
    'Juniori': 4000,
    'Seniori': 5000,
  };
  let paymentCount = 0;
  const paymentMethods = ['CASH', 'CARD', 'BANK_TRANSFER'] as const;

  for (const m of members) {
    const fee = membershipFee[m.groupName] || 3000;
    for (let monthOffset = 13; monthOffset >= 0; monthOffset--) {
      const periodDate = monthsAgo(monthOffset);
      const month = periodDate.getMonth() + 1;
      const year = periodDate.getFullYear();
      const dueDate = new Date(year, month - 1, 5);

      // Most payments are PAID, some recent ones PENDING
      let status: string;
      let paidAmount: number;
      let paidDate: Date | undefined;
      let paymentMethod: string | undefined;

      if (monthOffset <= 1 && Math.random() < 0.3) {
        // ~30% of last 2 months are pending
        status = 'PENDING';
        paidAmount = 0;
      } else if (monthOffset <= 2 && Math.random() < 0.15) {
        // ~15% partial
        status = 'PARTIAL';
        paidAmount = Math.floor(fee / 2);
        paidDate = new Date(year, month - 1, randomInt(5, 20));
        paymentMethod = randomPick([...paymentMethods]);
      } else {
        status = 'PAID';
        paidAmount = fee;
        paidDate = new Date(year, month - 1, randomInt(1, 15));
        paymentMethod = randomPick([...paymentMethods]);
      }

      await Payment.create({
        clubId: club._id,
        memberId: m._id,
        type: 'MEMBERSHIP',
        amount: fee,
        paidAmount,
        currency: 'RSD',
        description: `Članarina ${month}/${year} - ${m.groupName}`,
        dueDate,
        paidDate,
        status,
        paymentMethod,
        period: { month, year },
        createdBy: owner._id,
      });
      paymentCount++;
    }
  }
  console.log(`  ✅ Created ${paymentCount} payment records\n`);

  // ═══ 7. TRANSACTIONS (14 months of financial history) ═══
  console.log('📊 Creating transaction history (14 months)...');
  let transactionCount = 0;

  for (let monthOffset = 13; monthOffset >= 0; monthOffset--) {
    const periodDate = monthsAgo(monthOffset);
    const month = periodDate.getMonth() + 1;
    const year = periodDate.getFullYear();

    // INCOME: Membership fees collected (aggregate per group)
    for (const group of groups) {
      const fee = membershipFee[group.name] || 3000;
      const memberCount = members.filter((m: any) => m.groupName === group.name).length;
      const collected = fee * memberCount * (monthOffset <= 1 ? 0.7 : 0.95); // Less recent months partially collected

      await Transaction.create({
        clubId: club._id,
        type: 'INCOME',
        category: 'MEMBERSHIP_FEE',
        amount: Math.round(collected),
        currency: 'RSD',
        description: `Članarine ${group.name} - ${month}/${year}`,
        transactionDate: new Date(year, month - 1, randomInt(5, 15)),
        groupId: group._id,
        createdBy: owner._id,
      });
      transactionCount++;
    }

    // INCOME: Occasional sponsorship (every 3-4 months)
    if (monthOffset % 3 === 0) {
      await Transaction.create({
        clubId: club._id,
        type: 'INCOME',
        category: 'SPONSORSHIP',
        amount: randomInt(20000, 80000),
        currency: 'RSD',
        description: `Sponzorstvo - ${['Sportska Oprema DOO', 'FitMax', 'Energia Sport', 'SportVision'][randomInt(0, 3)]}`,
        transactionDate: new Date(year, month - 1, randomInt(1, 28)),
        createdBy: owner._id,
      });
      transactionCount++;
    }

    // EXPENSE: Rent (monthly)
    await Transaction.create({
      clubId: club._id,
      type: 'EXPENSE',
      category: 'RENT',
      amount: 35000,
      currency: 'RSD',
      description: 'Zakup terena - mesečna rata',
      transactionDate: new Date(year, month - 1, 1),
      createdBy: owner._id,
    });
    transactionCount++;

    // EXPENSE: Utilities (monthly)
    await Transaction.create({
      clubId: club._id,
      type: 'EXPENSE',
      category: 'UTILITIES',
      amount: randomInt(8000, 15000),
      currency: 'RSD',
      description: 'Komunalije (struja, voda, grejanje)',
      transactionDate: new Date(year, month - 1, randomInt(10, 20)),
      createdBy: owner._id,
    });
    transactionCount++;

    // EXPENSE: Coach salaries (monthly)
    for (const coach of coaches) {
      await Transaction.create({
        clubId: club._id,
        type: 'EXPENSE',
        category: 'SALARY',
        amount: randomInt(25000, 40000),
        currency: 'RSD',
        description: `Plata trenera: ${coach.fullName}`,
        transactionDate: new Date(year, month - 1, randomInt(25, 28)),
        createdBy: owner._id,
      });
      transactionCount++;
    }

    // EXPENSE: Equipment (every 2-3 months)
    if (monthOffset % 2 === 0) {
      const equipmentItems = ['Lopte (10 kom)', 'Dresovi za turnir', 'Čunjevi i markeri', 'Mreže za golove', 'Medicinsko osoblje'];
      await Transaction.create({
        clubId: club._id,
        type: 'EXPENSE',
        category: 'EQUIPMENT',
        amount: randomInt(10000, 50000),
        currency: 'RSD',
        description: randomPick(equipmentItems),
        transactionDate: new Date(year, month - 1, randomInt(1, 28)),
        groupId: randomPick(groups)._id,
        createdBy: owner._id,
      });
      transactionCount++;
    }
  }
  console.log(`  ✅ Created ${transactionCount} transactions\n`);

  // ═══ 8. EVENTS (last 3 months + next 2 weeks) ═══
  console.log('📅 Creating events...');
  let eventCount = 0;
  const allEvents: any[] = [];

  for (const group of groups) {
    // Past events: 3 months of weekly trainings
    for (let weekOffset = 12; weekOffset >= 0; weekOffset--) {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - weekOffset * 7);

      // Tuesday training
      const tuesday = new Date(eventDate);
      tuesday.setDate(tuesday.getDate() - tuesday.getDay() + 2);
      tuesday.setHours(17, 0, 0, 0);

      const tuesdayEnd = new Date(tuesday);
      tuesdayEnd.setHours(18, 30, 0, 0);

      const tuesdayEvent = await Event.create({
        clubId: club._id,
        groupId: group._id,
        title: `Trening - ${group.name}`,
        description: 'Redovni trening',
        type: 'Trening',
        startTime: tuesday,
        endTime: tuesdayEnd,
        location: randomPick(LOCATIONS),
        createdBy: randomPick(group.coaches),
        isMandatory: true,
        status: weekOffset > 0 ? 'COMPLETED' : 'SCHEDULED',
      });
      allEvents.push(tuesdayEvent);
      eventCount++;

      // Thursday training
      const thursday = new Date(eventDate);
      thursday.setDate(thursday.getDate() - thursday.getDay() + 4);
      thursday.setHours(17, 0, 0, 0);

      const thursdayEnd = new Date(thursday);
      thursdayEnd.setHours(18, 30, 0, 0);

      const thursdayEvent = await Event.create({
        clubId: club._id,
        groupId: group._id,
        title: `Trening - ${group.name}`,
        description: 'Redovni trening',
        type: 'Trening',
        startTime: thursday,
        endTime: thursdayEnd,
        location: randomPick(LOCATIONS),
        createdBy: randomPick(group.coaches),
        isMandatory: true,
        status: weekOffset > 0 ? 'COMPLETED' : 'SCHEDULED',
      });
      allEvents.push(thursdayEvent);
      eventCount++;
    }

    // A few matches per group
    for (let i = 0; i < 3; i++) {
      const matchDate = randomDate(monthsAgo(3), new Date());
      matchDate.setHours(randomPick([10, 14, 16]), 0, 0, 0);
      const matchEnd = new Date(matchDate);
      matchEnd.setHours(matchEnd.getHours() + 2);

      const opponents = ['FK Partizan', 'FK Vojvodina', 'FK Čukarički', 'FK Zemun', 'FK Rad', 'FK OFK Beograd'];
      const matchEvent = await Event.create({
        clubId: club._id,
        groupId: group._id,
        title: `Utakmica: ${group.name} vs ${randomPick(opponents)}`,
        description: `Prijateljska utakmica - ${group.ageGroup}`,
        type: 'Utakmica',
        startTime: matchDate,
        endTime: matchEnd,
        location: randomPick(LOCATIONS),
        createdBy: randomPick(group.coaches),
        isMandatory: true,
        status: 'COMPLETED',
      });
      allEvents.push(matchEvent);
      eventCount++;
    }

    // Future events (next 2 weeks)
    for (let dayOffset = 1; dayOffset <= 14; dayOffset += 3) {
      const futureDate = daysFromNow(dayOffset);
      futureDate.setHours(17, 0, 0, 0);
      const futureEnd = new Date(futureDate);
      futureEnd.setHours(18, 30, 0, 0);

      const futureEvent = await Event.create({
        clubId: club._id,
        groupId: group._id,
        title: `Trening - ${group.name}`,
        description: 'Redovni trening',
        type: 'Trening',
        startTime: futureDate,
        endTime: futureEnd,
        location: randomPick(LOCATIONS),
        createdBy: randomPick(group.coaches),
        isMandatory: true,
        status: 'SCHEDULED',
      });
      allEvents.push(futureEvent);
      eventCount++;
    }
  }
  console.log(`  ✅ Created ${eventCount} events\n`);

  // ═══ 9. ATTENDANCE (for completed events) ═══
  console.log('✋ Creating attendance records...');
  let attendanceCount = 0;
  const completedEvents = allEvents.filter(e => e.status === 'COMPLETED');
  // Only do attendance for a subset to avoid too many records
  const attendanceEvents = completedEvents.slice(0, 40);

  for (const event of attendanceEvents) {
    const groupMembers = members.filter((m: any) => {
      const membership = m.clubs[0];
      return membership.groupId.toString() === event.groupId.toString();
    });

    for (const member of groupMembers) {
      const rand = Math.random();
      let status: string;
      if (rand < 0.75) status = 'PRESENT';
      else if (rand < 0.85) status = 'LATE';
      else if (rand < 0.92) status = 'EXCUSED';
      else status = 'ABSENT';

      await Attendance.create({
        eventId: event._id,
        memberId: member._id,
        status,
        checkinMethod: status === 'PRESENT' || status === 'LATE' ? randomPick(['QR', 'MANUAL'] as const) : undefined,
        checkinTime: status === 'PRESENT' || status === 'LATE' ? event.startTime : undefined,
        markedBy: randomPick(coaches)._id,
        markedAt: event.startTime,
      });
      attendanceCount++;
    }
  }
  console.log(`  ✅ Created ${attendanceCount} attendance records\n`);

  // ═══ 10. POSTS ═══
  console.log('📰 Creating posts...');
  const postTexts = [
    { title: 'Odlični rezultati na turniru!', content: 'Naši Kadeti su osvojili prvo mesto na turniru u Novom Sadu! Čestitamo svim igračima i trenerima na sjajnom rezultatu. Posebno se istakao Filip Kovačević sa 3 gola u finalu.', type: 'ACHIEVEMENT' as const },
    { title: 'Raspored treninga za februar', content: 'Obaveštavamo sve članove da je raspored treninga za februar ažuriran. Treninzi se održavaju utorkom i četvrtkom od 17h. Molimo sve da budu tačni.', type: 'ANNOUNCEMENT' as const },
    { title: 'Novi dresovi stigli!', content: 'Stigli su novi dresovi za sezonu 2025/2026! Svi igrači mogu da preuzmu svoje dresove na sledećem treningu. Hvala sponzoru SportVision na podršci.', type: 'NEWS' as const },
    { title: 'Poziv na roditeljski sastanak', content: 'Pozivamo sve roditelje članova grupe Pioniri na sastanak u četvrtak, 20. februara u 19h u prostorijama kluba. Tema: priprema za prolećni turnir.', type: 'ANNOUNCEMENT' as const },
    { title: 'Pobeda Juniora u derbiju!', content: 'Juniori su sinoć pobedili FK Partizan rezultatom 3:1 u derbi utakmici! Golove su postigli Stefan Vasić (2) i Aleksa Janković. Bravo momci! 💪', type: 'ACHIEVEMENT' as const },
    { title: 'Medicinski pregledi - podsetnik', content: 'Podsetnik za sve članove čiji lekarski pregledi ističu u narednih 30 dana. Molimo vas da na vreme obnovite preglede kako bi mogli da nastave sa treninzima.', type: 'ANNOUNCEMENT' as const },
    { title: 'Letnji kamp 2025', content: 'Otvaramo prijave za letnji fudbalski kamp! Kamp će se održati od 1. do 14. jula na Zlatiboru. Cena po igraču: 25.000 RSD. Broj mesta je ograničen.', type: 'EVENT' as const },
    { title: 'Seniori u polufinalu kupa', content: 'Seniorski tim je plasmanom u polufinale gradskog kupa napravio sjajan rezultat ove sezone. Polufinalna utakmica je zakazana za 15. mart.', type: 'NEWS' as const },
  ];

  const posts: any[] = [];
  for (let i = 0; i < postTexts.length; i++) {
    const p = postTexts[i];
    const post = await Post.create({
      clubId: club._id,
      authorId: i < 3 ? owner._id : randomPick(coaches)._id,
      title: p.title,
      content: p.content,
      visibility: 'MEMBERS_ONLY',
      isPinned: i === 0,
      type: p.type,
      likesCount: randomInt(2, 10),
      commentsCount: 0,
      createdAt: randomDate(monthsAgo(3), new Date()),
    });
    posts.push(post);
  }

  // Comments on posts
  const commentTexts = [
    'Svaka čast momci! 👏',
    'Odličan rezultat!',
    'Bravo! Nastavljamo tako!',
    'Kad je sledeća utakmica?',
    'Hvala na informaciji.',
    'Super vest!',
    'Već jedva čekam!',
  ];

  let commentCount = 0;
  for (const post of posts) {
    const numComments = randomInt(1, 3);
    for (let i = 0; i < numComments; i++) {
      await Comment.create({
        postId: post._id,
        authorId: randomPick([owner._id, ...coaches.map(c => c._id)]),
        content: randomPick(commentTexts),
      });
      commentCount++;
    }
    post.commentsCount = numComments;
    await post.save();
  }
  console.log(`  ✅ Created ${posts.length} posts with ${commentCount} comments\n`);

  // ═══ 11. MEDICAL CHECKS ═══
  console.log('🏥 Creating medical checks...');
  let medicalCount = 0;

  for (const m of members) {
    const validUntil = daysFromNow(randomInt(-30, 300));
    const issueDate = new Date(validUntil);
    issueDate.setFullYear(issueDate.getFullYear() - 1);

    await MedicalCheck.create({
      memberId: m._id,
      issueDate,
      validUntil,
      status: validUntil > new Date() ? 'VALID' : 'EXPIRED',
      doctorName: randomPick(['Dr. Petar Marković', 'Dr. Jelena Stanković', 'Dr. Ivan Ristić']),
      notes: 'Redovni sportski pregled - sposoban za treninge i takmičenja',
      uploadedBy: owner._id,
    });
    medicalCount++;
  }
  console.log(`  ✅ Created ${medicalCount} medical checks\n`);

  // ═══ 12. INVITE CODES ═══
  console.log('🎟️  Creating invite codes...');
  const inviteCode = await InviteCode.create({
    code: 'FK4SPORTS',
    clubId: club._id,
    createdBy: owner._id,
    type: 'MEMBER',
    expiresAt: daysFromNow(90),
    usedCount: 3,
    maxUses: 30,
    isActive: true,
  });

  const coachInvite = await InviteCode.create({
    code: 'TRENER2025',
    clubId: club._id,
    createdBy: owner._id,
    type: 'COACH',
    expiresAt: daysFromNow(30),
    usedCount: 0,
    maxUses: 5,
    isActive: true,
  });
  console.log(`  ✅ Member invite: ${inviteCode.code}`);
  console.log(`  ✅ Coach invite: ${coachInvite.code}\n`);

  // ═══ 13. NOTIFICATIONS ═══
  console.log('🔔 Creating notifications...');
  const notifTexts = [
    { type: 'PAYMENT_DUE', title: 'Članarina dospela', message: 'Rok za plaćanje članarine za februar je istekao.' },
    { type: 'EVENT_REMINDER', title: 'Podsetnik: Trening sutra', message: 'Trening Pionira je zakazan za sutra u 17h.' },
    { type: 'NEW_POST', title: 'Nova objava', message: 'Objavljen je novi post: Odlični rezultati na turniru!' },
    { type: 'MEDICAL_EXPIRY', title: 'Lekarski pregled ističe', message: 'Vaš lekarski pregled ističe za 7 dana.' },
    { type: 'GENERAL', title: 'Dobrodošli u FK 4Sports!', message: 'Dobrodošli u naš klub! Pregledajte raspored treninga u kalendaru.' },
  ];

  let notifCount = 0;
  for (const allUser of [owner, ...coaches]) {
    for (const n of notifTexts) {
      await Notification.create({
        clubId: club._id,
        recipientId: allUser._id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: Math.random() > 0.5,
        deliveryMethods: ['IN_APP'],
        priority: n.type === 'PAYMENT_DUE' ? 'HIGH' : 'MEDIUM',
      } as any);
      notifCount++;
    }
  }
  console.log(`  ✅ Created ${notifCount} notifications\n`);

  // ═══ SUMMARY ═══
  console.log('═══════════════════════════════════════');
  console.log('🎉 SEED COMPLETE!');
  console.log('═══════════════════════════════════════');
  console.log(`  Club:          FK 4Sports`);
  console.log(`  Owner:         ${OWNER_EMAIL} / ${DEFAULT_PASSWORD}`);
  console.log(`  Coaches:`);
  for (const c of COACHES) {
    console.log(`    - ${c.fullName}: ${c.email} / ${DEFAULT_PASSWORD}`);
  }
  console.log(`  Groups:        ${groups.length}`);
  console.log(`  Members:       ${members.length}`);
  console.log(`  Payments:      ${paymentCount}`);
  console.log(`  Transactions:  ${transactionCount}`);
  console.log(`  Events:        ${eventCount}`);
  console.log(`  Attendance:    ${attendanceCount}`);
  console.log(`  Posts:         ${posts.length}`);
  console.log(`  Comments:      ${commentCount}`);
  console.log(`  Medical:       ${medicalCount}`);
  console.log(`  Invite codes:  FK4SPORTS (member), TRENER2025 (coach)`);
  console.log('═══════════════════════════════════════\n');
}

// ─── Run ───
async function main() {
  try {
    await connectDB();
    await seed();
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

main();

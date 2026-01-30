import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Member, { IMember } from '../models/Member';
import Payment from '../models/Payment';
import MedicalCheck from '../models/MedicalCheck';
import Notification from '../models/Notification';
import { sendPushNotification } from '../services/pushNotificationService';

/**
 * Get members with unpaid membership for current period
 */
const getMembersWithUnpaidMembership = async (
  clubId: mongoose.Types.ObjectId,
  groupId?: mongoose.Types.ObjectId
): Promise<IMember[]> => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Get all active members in club/group
  const memberQuery: any = {
    'clubs.clubId': clubId,
    'clubs.status': 'ACTIVE',
  };

  if (groupId) {
    memberQuery['clubs.groupId'] = groupId;
  }

  const members = await Member.find(memberQuery)
    .populate('parentId', 'fullName pushToken')
    .populate('userId', 'fullName pushToken');

  // Filter members who don't have a PAID membership payment for current period
  const membersWithUnpaid: IMember[] = [];

  for (const member of members) {
    const paidPayment = await Payment.findOne({
      memberId: member._id,
      clubId,
      type: 'MEMBERSHIP',
      status: 'PAID',
      'period.month': currentMonth,
      'period.year': currentYear,
    });

    if (!paidPayment) {
      membersWithUnpaid.push(member);
    }
  }

  return membersWithUnpaid;
};

/**
 * Get members with expired or missing medical check
 */
const getMembersWithInvalidMedical = async (
  clubId: mongoose.Types.ObjectId,
  groupId?: mongoose.Types.ObjectId
): Promise<IMember[]> => {
  const now = new Date();

  // Get all active members in club/group
  const memberQuery: any = {
    'clubs.clubId': clubId,
    'clubs.status': 'ACTIVE',
  };

  if (groupId) {
    memberQuery['clubs.groupId'] = groupId;
  }

  const members = await Member.find(memberQuery)
    .populate('parentId', 'fullName pushToken')
    .populate('userId', 'fullName pushToken');

  // Filter members who don't have a valid medical check
  const membersWithInvalidMedical: IMember[] = [];

  for (const member of members) {
    const validMedical = await MedicalCheck.findOne({
      memberId: member._id,
      status: 'VALID',
      validUntil: { $gt: now },
    });

    if (!validMedical) {
      membersWithInvalidMedical.push(member);
    }
  }

  return membersWithInvalidMedical;
};

/**
 * Get user ID(s) to notify for a member
 * For child members: notify parent
 * For self-registered members: notify user
 */
const getUserIdsForMember = (member: IMember): string[] => {
  const userIds: string[] = [];

  if (member.parentId) {
    userIds.push((member.parentId as any)._id?.toString() || member.parentId.toString());
  }

  if (member.userId) {
    userIds.push((member.userId as any)._id?.toString() || member.userId.toString());
  }

  return userIds;
};

/**
 * @route   POST /api/reminders/payment/member/:memberId
 * @desc    Send payment reminder to a specific member
 * @access  Protected (OWNER, COACH)
 */
export const sendPaymentReminderToMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const clubId = req.user!.clubId;

    const member = await Member.findOne({
      _id: memberId,
      'clubs.clubId': clubId,
      'clubs.status': 'ACTIVE',
    })
      .populate('parentId', 'fullName pushToken')
      .populate('userId', 'fullName pushToken');

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found in your club',
      });
      return;
    }

    const userIds = getUserIdsForMember(member);

    if (userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No user account linked to this member',
      });
      return;
    }

    const now = new Date();
    const monthNames = [
      'januar', 'februar', 'mart', 'april', 'maj', 'jun',
      'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'
    ];
    const currentMonth = monthNames[now.getMonth()];

    const title = 'Podsetnik za članarinu';
    const message = `Podsećamo vas da članarina za ${member.fullName} za mesec ${currentMonth} nije plaćena.`;

    // Send push notification
    await sendPushNotification(userIds, title, message, {
      type: 'payment_reminder',
      memberId: memberId,
    });

    // Create in-app notification for each user
    for (const userId of userIds) {
      await Notification.createNotification({
        clubId,
        recipientId: new mongoose.Types.ObjectId(userId),
        type: 'PAYMENT_DUE',
        title,
        message,
        data: { memberId: new mongoose.Types.ObjectId(memberId) },
        deliveryMethods: ['IN_APP', 'PUSH'],
        priority: 'HIGH',
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment reminder sent for ${member.fullName}`,
      data: {
        memberName: member.fullName,
        notifiedUsers: userIds.length,
      },
    });
  } catch (error) {
    console.error('❌ Send Payment Reminder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending payment reminder',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @route   POST /api/reminders/medical/member/:memberId
 * @desc    Send medical check reminder to a specific member
 * @access  Protected (OWNER, COACH)
 */
export const sendMedicalReminderToMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const clubId = req.user!.clubId;

    const member = await Member.findOne({
      _id: memberId,
      'clubs.clubId': clubId,
      'clubs.status': 'ACTIVE',
    })
      .populate('parentId', 'fullName pushToken')
      .populate('userId', 'fullName pushToken');

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found in your club',
      });
      return;
    }

    const userIds = getUserIdsForMember(member);

    if (userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No user account linked to this member',
      });
      return;
    }

    const title = 'Podsetnik za lekarski pregled';
    const message = `Podsećamo vas da lekarski pregled za ${member.fullName} nije validan ili nije dostavljen.`;

    // Send push notification
    await sendPushNotification(userIds, title, message, {
      type: 'medical_reminder',
      memberId: memberId,
    });

    // Create in-app notification for each user
    for (const userId of userIds) {
      await Notification.createNotification({
        clubId,
        recipientId: new mongoose.Types.ObjectId(userId),
        type: 'MEDICAL_EXPIRY',
        title,
        message,
        data: { memberId: new mongoose.Types.ObjectId(memberId) },
        deliveryMethods: ['IN_APP', 'PUSH'],
        priority: 'HIGH',
      });
    }

    res.status(200).json({
      success: true,
      message: `Medical reminder sent for ${member.fullName}`,
      data: {
        memberName: member.fullName,
        notifiedUsers: userIds.length,
      },
    });
  } catch (error) {
    console.error('❌ Send Medical Reminder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending medical reminder',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @route   POST /api/reminders/payment/group/:groupId
 * @desc    Send payment reminder to all unpaid members in a group
 * @access  Protected (OWNER, COACH)
 */
export const sendPaymentReminderToGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const clubId = req.user!.clubId;

    const membersWithUnpaid = await getMembersWithUnpaidMembership(
      clubId,
      new mongoose.Types.ObjectId(groupId)
    );

    if (membersWithUnpaid.length === 0) {
      res.status(200).json({
        success: true,
        message: 'All members in this group have paid their membership',
        data: {
          remindersCount: 0,
        },
      });
      return;
    }

    const now = new Date();
    const monthNames = [
      'januar', 'februar', 'mart', 'april', 'maj', 'jun',
      'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'
    ];
    const currentMonth = monthNames[now.getMonth()];

    let notifiedCount = 0;

    for (const member of membersWithUnpaid) {
      const userIds = getUserIdsForMember(member);

      if (userIds.length === 0) continue;

      const title = 'Podsetnik za članarinu';
      const message = `Podsećamo vas da članarina za ${member.fullName} za mesec ${currentMonth} nije plaćena.`;

      // Send push notification
      await sendPushNotification(userIds, title, message, {
        type: 'payment_reminder',
        memberId: member._id.toString(),
      });

      // Create in-app notification for each user
      for (const userId of userIds) {
        await Notification.createNotification({
          clubId,
          recipientId: new mongoose.Types.ObjectId(userId),
          type: 'PAYMENT_DUE',
          title,
          message,
          data: { memberId: member._id },
          deliveryMethods: ['IN_APP', 'PUSH'],
          priority: 'HIGH',
        });
      }

      notifiedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Payment reminders sent to ${notifiedCount} members`,
      data: {
        remindersCount: notifiedCount,
        memberNames: membersWithUnpaid.map(m => m.fullName),
      },
    });
  } catch (error) {
    console.error('❌ Send Group Payment Reminder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending payment reminders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @route   POST /api/reminders/medical/group/:groupId
 * @desc    Send medical reminder to all members with invalid medical check in a group
 * @access  Protected (OWNER, COACH)
 */
export const sendMedicalReminderToGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const clubId = req.user!.clubId;

    const membersWithInvalidMedical = await getMembersWithInvalidMedical(
      clubId,
      new mongoose.Types.ObjectId(groupId)
    );

    if (membersWithInvalidMedical.length === 0) {
      res.status(200).json({
        success: true,
        message: 'All members in this group have valid medical checks',
        data: {
          remindersCount: 0,
        },
      });
      return;
    }

    let notifiedCount = 0;

    for (const member of membersWithInvalidMedical) {
      const userIds = getUserIdsForMember(member);

      if (userIds.length === 0) continue;

      const title = 'Podsetnik za lekarski pregled';
      const message = `Podsećamo vas da lekarski pregled za ${member.fullName} nije validan ili nije dostavljen.`;

      // Send push notification
      await sendPushNotification(userIds, title, message, {
        type: 'medical_reminder',
        memberId: member._id.toString(),
      });

      // Create in-app notification for each user
      for (const userId of userIds) {
        await Notification.createNotification({
          clubId,
          recipientId: new mongoose.Types.ObjectId(userId),
          type: 'MEDICAL_EXPIRY',
          title,
          message,
          data: { memberId: member._id },
          deliveryMethods: ['IN_APP', 'PUSH'],
          priority: 'HIGH',
        });
      }

      notifiedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Medical reminders sent to ${notifiedCount} members`,
      data: {
        remindersCount: notifiedCount,
        memberNames: membersWithInvalidMedical.map(m => m.fullName),
      },
    });
  } catch (error) {
    console.error('❌ Send Group Medical Reminder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending medical reminders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @route   POST /api/reminders/payment/all
 * @desc    Send payment reminder to all unpaid members in the club
 * @access  Protected (OWNER, COACH)
 */
export const sendPaymentReminderToAll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const clubId = req.user!.clubId;

    const membersWithUnpaid = await getMembersWithUnpaidMembership(clubId);

    if (membersWithUnpaid.length === 0) {
      res.status(200).json({
        success: true,
        message: 'All members have paid their membership',
        data: {
          remindersCount: 0,
        },
      });
      return;
    }

    const now = new Date();
    const monthNames = [
      'januar', 'februar', 'mart', 'april', 'maj', 'jun',
      'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'
    ];
    const currentMonth = monthNames[now.getMonth()];

    let notifiedCount = 0;

    for (const member of membersWithUnpaid) {
      const userIds = getUserIdsForMember(member);

      if (userIds.length === 0) continue;

      const title = 'Podsetnik za članarinu';
      const message = `Podsećamo vas da članarina za ${member.fullName} za mesec ${currentMonth} nije plaćena.`;

      // Send push notification
      await sendPushNotification(userIds, title, message, {
        type: 'payment_reminder',
        memberId: member._id.toString(),
      });

      // Create in-app notification for each user
      for (const userId of userIds) {
        await Notification.createNotification({
          clubId,
          recipientId: new mongoose.Types.ObjectId(userId),
          type: 'PAYMENT_DUE',
          title,
          message,
          data: { memberId: member._id },
          deliveryMethods: ['IN_APP', 'PUSH'],
          priority: 'HIGH',
        });
      }

      notifiedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Payment reminders sent to ${notifiedCount} members`,
      data: {
        remindersCount: notifiedCount,
      },
    });
  } catch (error) {
    console.error('❌ Send All Payment Reminder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending payment reminders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @route   POST /api/reminders/medical/all
 * @desc    Send medical reminder to all members with invalid medical check in the club
 * @access  Protected (OWNER, COACH)
 */
export const sendMedicalReminderToAll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const clubId = req.user!.clubId;

    const membersWithInvalidMedical = await getMembersWithInvalidMedical(clubId);

    if (membersWithInvalidMedical.length === 0) {
      res.status(200).json({
        success: true,
        message: 'All members have valid medical checks',
        data: {
          remindersCount: 0,
        },
      });
      return;
    }

    let notifiedCount = 0;

    for (const member of membersWithInvalidMedical) {
      const userIds = getUserIdsForMember(member);

      if (userIds.length === 0) continue;

      const title = 'Podsetnik za lekarski pregled';
      const message = `Podsećamo vas da lekarski pregled za ${member.fullName} nije validan ili nije dostavljen.`;

      // Send push notification
      await sendPushNotification(userIds, title, message, {
        type: 'medical_reminder',
        memberId: member._id.toString(),
      });

      // Create in-app notification for each user
      for (const userId of userIds) {
        await Notification.createNotification({
          clubId,
          recipientId: new mongoose.Types.ObjectId(userId),
          type: 'MEDICAL_EXPIRY',
          title,
          message,
          data: { memberId: member._id },
          deliveryMethods: ['IN_APP', 'PUSH'],
          priority: 'HIGH',
        });
      }

      notifiedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Medical reminders sent to ${notifiedCount} members`,
      data: {
        remindersCount: notifiedCount,
      },
    });
  } catch (error) {
    console.error('❌ Send All Medical Reminder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending medical reminders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @route   GET /api/reminders/status/group/:groupId
 * @desc    Get members with unpaid/invalid status in a group
 * @access  Protected (OWNER, COACH)
 */
export const getGroupReminderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const clubId = req.user!.clubId;

    const [membersWithUnpaid, membersWithInvalidMedical] = await Promise.all([
      getMembersWithUnpaidMembership(clubId, new mongoose.Types.ObjectId(groupId)),
      getMembersWithInvalidMedical(clubId, new mongoose.Types.ObjectId(groupId)),
    ]);

    res.status(200).json({
      success: true,
      data: {
        unpaidMembers: membersWithUnpaid.map(m => ({
          _id: m._id,
          fullName: m.fullName,
          profileImage: m.profileImage,
        })),
        invalidMedicalMembers: membersWithInvalidMedical.map(m => ({
          _id: m._id,
          fullName: m.fullName,
          profileImage: m.profileImage,
        })),
        unpaidCount: membersWithUnpaid.length,
        invalidMedicalCount: membersWithInvalidMedical.length,
      },
    });
  } catch (error) {
    console.error('❌ Get Group Reminder Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting reminder status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @route   GET /api/reminders/status/member/:memberId
 * @desc    Get payment/medical status for a specific member
 * @access  Protected (OWNER, COACH)
 */
export const getMemberReminderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const clubId = req.user!.clubId;

    const member = await Member.findOne({
      _id: memberId,
      'clubs.clubId': clubId,
      'clubs.status': 'ACTIVE',
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found in your club',
      });
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Check payment status
    const paidPayment = await Payment.findOne({
      memberId: member._id,
      clubId,
      type: 'MEMBERSHIP',
      status: 'PAID',
      'period.month': currentMonth,
      'period.year': currentYear,
    });

    // Check medical status
    const validMedical = await MedicalCheck.findOne({
      memberId: member._id,
      status: 'VALID',
      validUntil: { $gt: now },
    });

    res.status(200).json({
      success: true,
      data: {
        memberId: member._id,
        fullName: member.fullName,
        paymentStatus: paidPayment ? 'PAID' : 'UNPAID',
        medicalStatus: validMedical ? 'VALID' : 'INVALID',
        canRemindPayment: !paidPayment,
        canRemindMedical: !validMedical,
      },
    });
  } catch (error) {
    console.error('❌ Get Member Reminder Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting member status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

import cron from 'node-cron';
import Event from '../models/Event';
import Payment from '../models/Payment';
import MedicalCheck from '../models/MedicalCheck';
import Notification from '../models/Notification';
import Member from '../models/Member';

/**
 * Scheduler Service
 * Manages all scheduled tasks and automated notifications
 */

// ============================================
// EVENT REMINDERS
// ============================================

/**
 * Send event reminders 24 hours before the event
 * Runs every hour
 */
export const eventReminderJob = cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔔 Running event reminder job...');

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find events starting in 24-25 hours
    const upcomingEvents = await Event.find({
      startTime: {
        $gte: in24Hours,
        $lt: in25Hours,
      },
      isCancelled: false,
    });

    for (const event of upcomingEvents) {
      // Get all members of the group
      const members = await Member.find({
        'clubs.clubId': event.clubId,
        'clubs.groups': event.groupId,
      }).select('parentId userId');

      // Create notification for each member
      for (const member of members) {
        // Use userId for self-registered members, parentId for children
        const recipientId = member.userId || member.parentId;
        if (!recipientId) continue;

        await Notification.createNotification({
          clubId: event.clubId,
          recipientId,
          type: 'EVENT_REMINDER',
          title: `Upcoming Event: ${event.title}`,
          message: `Reminder: ${event.title} starts tomorrow at ${event.startTime.toLocaleTimeString()}. Location: ${event.location || 'TBD'}`,
          data: {
            eventId: event._id,
          },
          deliveryMethods: ['IN_APP', 'PUSH'],
          priority: 'HIGH',
        });
      }

      console.log(`✅ Sent reminders for event: ${event.title} (${members.length} members)`);
    }

    console.log(`✅ Event reminder job completed. Processed ${upcomingEvents.length} events.`);
  } catch (error) {
    console.error('❌ Event reminder job error:', error);
  }
});

// ============================================
// PAYMENT REMINDERS
// ============================================

/**
 * Send payment due reminders for overdue payments
 * Runs daily at 9 AM
 */
export const paymentReminderJob = cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔔 Running payment reminder job...');

    const now = new Date();

    // Find overdue payments (PENDING status and past due date)
    const overduePayments = await Payment.find({
      status: 'PENDING',
      dueDate: { $lt: now },
    }).populate('memberId');

    for (const payment of overduePayments) {
      const member = payment.memberId as any;

      // Use userId for self-registered members, parentId for children
      const recipientId = member?.userId || member?.parentId;
      if (!member || !recipientId) {
        continue;
      }

      await Notification.createNotification({
        clubId: payment.clubId,
        recipientId,
        type: 'PAYMENT_DUE',
        title: 'Payment Overdue',
        message: `Your payment for ${payment.description} is overdue. Amount: ${payment.amount} ${payment.currency}. Due date was ${payment.dueDate.toLocaleDateString()}.`,
        data: {
          paymentId: payment._id,
        },
        deliveryMethods: ['IN_APP', 'PUSH', 'EMAIL'],
        priority: 'URGENT',
      });
    }

    console.log(`✅ Payment reminder job completed. Sent ${overduePayments.length} reminders.`);
  } catch (error) {
    console.error('❌ Payment reminder job error:', error);
  }
});

// ============================================
// MEDICAL CHECK EXPIRY REMINDERS
// ============================================

/**
 * Send medical check expiry warnings for checks expiring in 30 days
 * Runs daily at 8 AM
 */
export const medicalCheckExpiryJob = cron.schedule('0 8 * * *', async () => {
  try {
    console.log('🔔 Running medical check expiry job...');

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find medical checks expiring in the next 30 days
    const expiringChecks = await MedicalCheck.find({
      validUntil: {
        $gte: now,
        $lte: in30Days,
      },
      status: 'VALID',
    }).populate('memberId');

    for (const check of expiringChecks) {
      const member = check.memberId as any;

      // Use userId for self-registered members, parentId for children
      const recipientId = member?.userId || member?.parentId;
      if (!member || !recipientId) {
        continue;
      }

      const daysUntilExpiry = Math.ceil((check.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get clubId from member's clubs array (use first club)
      const clubId = member.clubs && member.clubs.length > 0 ? member.clubs[0].clubId : null;

      if (!clubId) {
        continue;
      }

      await Notification.createNotification({
        clubId: clubId,
        recipientId,
        type: 'MEDICAL_EXPIRY',
        title: 'Medical Certificate Expiring Soon',
        message: `Your medical certificate will expire in ${daysUntilExpiry} days (${check.validUntil.toLocaleDateString()}). Please renew it before it expires.`,
        data: {
          medicalCheckId: check._id,
        },
        deliveryMethods: ['IN_APP', 'PUSH', 'EMAIL'],
        priority: daysUntilExpiry <= 7 ? 'URGENT' : 'HIGH',
      });
    }

    console.log(`✅ Medical check expiry job completed. Sent ${expiringChecks.length} warnings.`);
  } catch (error) {
    console.error('❌ Medical check expiry job error:', error);
  }
});

// ============================================
// SCHEDULER INITIALIZATION
// ============================================

/**
 * Start all scheduled jobs
 */
export const startScheduler = () => {
  console.log('⏰ Starting scheduler service...');

  eventReminderJob.start();
  console.log('✅ Event reminder job started (runs every hour)');

  paymentReminderJob.start();
  console.log('✅ Payment reminder job started (runs daily at 9 AM)');

  medicalCheckExpiryJob.start();
  console.log('✅ Medical check expiry job started (runs daily at 8 AM)');

  console.log('⏰ Scheduler service started successfully');
};

/**
 * Stop all scheduled jobs
 */
export const stopScheduler = () => {
  console.log('⏰ Stopping scheduler service...');

  eventReminderJob.stop();
  paymentReminderJob.stop();
  medicalCheckExpiryJob.stop();

  console.log('⏰ Scheduler service stopped');
};

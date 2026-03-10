import { Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import User from '../models/User';
import mongoose from 'mongoose';
import { sendChatMessageNotification } from '../services/pushNotificationService';

const db = getFirestore();

/**
 * Create or get existing conversation
 * @route POST /api/v1/chat/conversations
 * @access Protected
 */
export const createConversation = async (req: Request, res: Response): Promise<any> => {
  try {
    const { participantIds, type = '1-on-1', groupName } = req.body;
    const currentUserId = req.user!._id.toString();
    const clubId = req.user!.clubId.toString();

    // Validate participants
    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARTICIPANTS',
          message: 'At least one participant is required',
        },
      });
    }

    // Get all participant details from MongoDB
    const allParticipantIds = [currentUserId, ...participantIds];

    console.log('🔍 Creating conversation debug:');
    console.log('   Current User ID:', currentUserId);
    console.log('   Club ID:', clubId);
    console.log('   All Participant IDs:', allParticipantIds);

    // First, find all participants regardless of club
    const participants = await User.find({
      _id: { $in: allParticipantIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
    }).select('_id fullName profileImage role clubId');

    console.log('   Found participants:', participants.map(p => ({
      id: p._id.toString(),
      name: p.fullName,
      clubId: p.clubId?.toString(),
    })));

    if (participants.length !== allParticipantIds.length) {
      console.log('❌ Participant count mismatch:', participants.length, 'vs', allParticipantIds.length);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARTICIPANTS',
          message: 'Some participants not found',
        },
      });
    }

    // Check if all participants are in the same club
    const clubMismatch = participants.filter(p => p.clubId?.toString() !== clubId);
    if (clubMismatch.length > 0) {
      console.log('⚠️  Club mismatch for:', clubMismatch.map(p => p.fullName));
      // For now, allow cross-club messaging within the same organization
      // You can make this stricter later
    }

    // Check permissions (members can only message coaches/owners)
    const currentUser = participants.find((p) => p._id.toString() === currentUserId);
    if (currentUser?.role === 'MEMBER' && type === '1-on-1') {
      const otherParticipant = participants.find((p) => p._id.toString() !== currentUserId);
      if (otherParticipant && !['COACH', 'OWNER'].includes(otherParticipant.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Members can only message coaches and owners',
          },
        });
      }
    }

    // For 1-on-1, check if conversation already exists
    if (type === '1-on-1') {
      const conversationsRef = db.collection('conversations');
      const existingConversations = await conversationsRef
        .where('clubId', '==', clubId)
        .where('type', '==', '1-on-1')
        .where('participantIds', 'array-contains', currentUserId)
        .get();

      for (const doc of existingConversations.docs) {
        const data = doc.data();
        if (
          data.participantIds.length === 2 &&
          data.participantIds.includes(participantIds[0])
        ) {
          // Conversation already exists
          return res.status(200).json({
            success: true,
            data: {
              conversationId: doc.id,
              ...data,
            },
          });
        }
      }
    }

    // Create participant details map
    const participantDetails: Record<string, any> = {};
    participants.forEach((p) => {
      participantDetails[p._id.toString()] = {
        name: p.fullName,
        avatar: p.profileImage || null,
        role: p.role,
      };
    });

    // Initialize unreadCounts for all participants to 0
    const unreadCounts: Record<string, number> = {};
    allParticipantIds.forEach((id: string) => {
      unreadCounts[id] = 0;
    });

    // Create new conversation in Firestore
    const conversationData = {
      type,
      clubId,
      participantIds: allParticipantIds,
      participantDetails,
      groupName: type === 'group' || type === 'staff-group' ? groupName : null,
      lastMessage: null,
      unreadCounts,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const conversationRef = await db.collection('conversations').add(conversationData);

    return res.status(201).json({
      success: true,
      data: {
        conversationId: conversationRef.id,
        ...conversationData,
      },
    });
  } catch (error: any) {
    console.error('❌ Create Conversation Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create conversation',
      },
    });
  }
};

/**
 * Get user's conversations
 * @route GET /api/v1/chat/conversations
 * @access Protected
 */
export const getConversations = async (req: Request, res: Response): Promise<any> => {
  try {
    const currentUserId = req.user!._id.toString();
    const clubId = req.user!.clubId.toString();
    const { filter } = req.query; // 'all' | 'members' | 'staff'

    const conversationsRef = db.collection('conversations');
    let query = conversationsRef
      .where('clubId', '==', clubId)
      .where('participantIds', 'array-contains', currentUserId)
      .orderBy('updatedAt', 'desc');

    const snapshot = await query.get();

    let conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Refresh participant avatars from MongoDB so they're always up to date
    try {
      const allParticipantIds = [...new Set(
        conversations.flatMap((c: any) => c.participantIds || [])
      )];
      if (allParticipantIds.length > 0) {
        const users = await User.find({
          _id: { $in: allParticipantIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
        }).select('_id profileImage').lean();
        const avatarMap = new Map(users.map((u: any) => [u._id.toString(), u.profileImage || null]));
        conversations = conversations.map((conv: any) => ({
          ...conv,
          participantDetails: Object.fromEntries(
            Object.entries(conv.participantDetails || {}).map(([id, details]: [string, any]) => [
              id,
              { ...details, avatar: avatarMap.get(id) ?? details.avatar ?? null },
            ])
          ),
        }));
      }
    } catch (refreshError) {
      console.error('Failed to refresh participant avatars:', refreshError);
    }

    // Apply filter
    if (filter === 'members') {
      // Only conversations with members (exclude staff-only)
      conversations = conversations.filter((conv: any) => {
        if (conv.type === 'staff-group') return false;
        // Check if any participant is a member
        const participantRoles = Object.values(conv.participantDetails).map(
          (p: any) => p.role
        );
        return participantRoles.includes('MEMBER') || participantRoles.includes('PARENT');
      });
    } else if (filter === 'staff') {
      // Only conversations with staff (coaches/owners)
      conversations = conversations.filter((conv: any) => {
        if (conv.type === 'staff-group') return true;
        const participantRoles = Object.values(conv.participantDetails).map(
          (p: any) => p.role
        );
        return participantRoles.includes('COACH') || participantRoles.includes('OWNER');
      });
    }

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error('❌ Get Conversations Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch conversations',
      },
    });
  }
};

/**
 * Send message
 * @route POST /api/v1/chat/conversations/:conversationId/messages
 * @access Protected
 */
export const sendMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { conversationId } = req.params;
    const { text, images } = req.body;
    const senderId = req.user!._id.toString();
    const senderName = req.user!.fullName;
    const senderAvatar = req.user!.profileImage || null;

    if (!text && (!images || images.length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE',
          message: 'Message must have text or images',
        },
      });
    }

    // Verify conversation exists and user is participant
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    const conversationData = conversationDoc.data();
    if (!conversationData?.participantIds.includes(senderId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'User is not a participant in this conversation',
        },
      });
    }

    // Create message in Firestore
    const messageData = {
      senderId,
      senderName,
      senderAvatar,
      text: text || '',
      images: images || [],
      timestamp: new Date(),
      readBy: [senderId], // Sender has read it
    };

    const messageRef = await conversationRef.collection('messages').add(messageData);

    // Build unreadCounts update - increment for all participants except sender
    const currentUnreadCounts = conversationData.unreadCounts || {};
    const updatedUnreadCounts: Record<string, number> = { ...currentUnreadCounts };

    conversationData.participantIds.forEach((participantId: string) => {
      if (participantId !== senderId) {
        updatedUnreadCounts[participantId] = (updatedUnreadCounts[participantId] || 0) + 1;
      }
    });

    // Update conversation's lastMessage, unreadCounts, and refresh sender's avatar
    await conversationRef.update({
      lastMessage: {
        text: text || '📷 Image',
        senderId,
        senderName,
        timestamp: new Date(),
        imageUrl: images && images.length > 0 ? images[0] : null,
      },
      unreadCounts: updatedUnreadCounts,
      [`participantDetails.${senderId}.avatar`]: senderAvatar,
      updatedAt: new Date(),
    });

    // Send push notifications to other participants
    const recipientIds = conversationData.participantIds.filter(
      (id: string) => id !== senderId
    );
    if (recipientIds.length > 0) {
      // Fire and forget - don't wait for push notifications
      sendChatMessageNotification(
        recipientIds,
        senderName,
        text || '',
        conversationId
      ).catch((error) => {
        console.error('Failed to send push notification:', error);
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        messageId: messageRef.id,
        ...messageData,
      },
    });
  } catch (error: any) {
    console.error('❌ Send Message Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to send message',
      },
    });
  }
};

/**
 * Mark messages as read
 * @route POST /api/v1/chat/conversations/:conversationId/read
 * @access Protected
 */
export const markAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!._id.toString();

    const conversationRef = db.collection('conversations').doc(conversationId);

    // Reset unreadCounts for this user to 0
    const conversationDoc = await conversationRef.get();
    if (conversationDoc.exists) {
      // Set user's unread count to 0
      await conversationRef.update({
        [`unreadCounts.${userId}`]: 0,
      });
    }

    // Also update individual messages' readBy array
    const messagesRef = conversationRef.collection('messages');
    const unreadMessages = await messagesRef
      .where('readBy', 'not-in', [[userId]])
      .get();

    // Update each message to mark as read
    const batch = db.batch();
    unreadMessages.docs.forEach((doc) => {
      const readBy = doc.data().readBy || [];
      if (!readBy.includes(userId)) {
        batch.update(doc.ref, {
          readBy: [...readBy, userId],
        });
      }
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      data: {
        markedCount: unreadMessages.size,
      },
    });
  } catch (error: any) {
    console.error('❌ Mark As Read Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to mark messages as read',
      },
    });
  }
};

/**
 * Update FCM token
 * @route POST /api/v1/chat/fcm-token
 * @access Protected
 */
/**
 * Get club users for starting new conversations
 * @route GET /api/v1/chat/users
 * @access Protected
 */
export const getClubUsersForChat = async (req: Request, res: Response): Promise<any> => {
  try {
    const clubId = req.user!.clubId;
    const currentUserRole = req.user!.role;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_CLUB',
          message: 'User is not associated with a club',
        },
      });
    }

    // Get all users in the same club except current user
    let query: any = {
      _id: { $ne: req.user!._id },
      clubId: clubId,
    };

    // Parents can only message COACH and OWNER
    if (currentUserRole === 'PARENT') {
      query.role = { $in: ['COACH', 'OWNER'] };
    }

    const users = await User.find(query)
      .select('_id fullName profileImage role email')
      .sort({ role: 1, fullName: 1 });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('❌ Get Club Users Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch users',
      },
    });
  }
};

export const updateFCMToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const userId = req.user!._id;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'FCM token is required',
        },
      });
    }

    await User.findByIdAndUpdate(userId, {
      pushToken: token,
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'FCM token updated successfully',
      },
    });
  } catch (error: any) {
    console.error('❌ Update FCM Token Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update FCM token',
      },
    });
  }
};

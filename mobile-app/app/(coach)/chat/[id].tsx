import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/services/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { chatService } from '@/services/chatService';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  images: string[];
  timestamp: any;
  readBy: string[];
}

interface Conversation {
  id: string;
  type: string;
  participantIds: string[];
  participantDetails: Record<string, { name: string; avatar: string | null; role: string }>;
  groupName?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const openImageModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageUrl(null);
  };

  // Handle keyboard show - scroll to bottom
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Get conversation details
  useEffect(() => {
    if (!conversationId) return;

    const fetchConversation = async () => {
      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        if (conversationSnap.exists()) {
          setConversation({
            id: conversationSnap.id,
            ...conversationSnap.data(),
          } as Conversation);
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchConversation();
  }, [conversationId]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });
      setMessages(newMessages);
      setLoading(false);

      // Mark messages as read
      if (user?._id) {
        chatService.markAsRead(conversationId).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [conversationId, user?._id]);

  // Get chat title
  const getChatTitle = () => {
    if (!conversation || !user?._id) return 'Chat';

    if (conversation.type === 'group' || conversation.type === 'staff-group') {
      return conversation.groupName || 'Group Chat';
    }

    // For 1-on-1, show other participant's name
    const otherParticipantId = conversation.participantIds.find(
      (id) => id !== user._id
    );
    if (otherParticipantId && conversation.participantDetails[otherParticipantId]) {
      return conversation.participantDetails[otherParticipantId].name;
    }

    return 'Chat';
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!inputText.trim() && selectedImages.length === 0) || sending) return;

    setSending(true);
    try {
      await chatService.sendMessage(conversationId!, inputText.trim(), selectedImages);
      setInputText('');
      setSelectedImages([]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?._id;
    const timestamp = item.timestamp?.toDate?.() || new Date();

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <View style={styles.avatarSmall}>
            {item.senderAvatar ? (
              <Image source={{ uri: item.senderAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {item.senderName?.substring(0, 1).toUpperCase() || '?'}
              </Text>
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {!isOwnMessage && conversation?.type !== '1-on-1' && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}

          {item.images && item.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {item.images.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => openImageModal(imageUrl)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {item.text ? (
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.text}
            </Text>
          ) : null}

          <Text
            style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
            ]}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: getChatTitle(),
          headerBackTitle: 'Back',
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.selectedImageWrapper}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <MaterialCommunityIcons
              name="image-plus"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() && selectedImages.length === 0) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={(!inputText.trim() && selectedImages.length === 0) || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Zoom Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={closeImageModal}
          >
            <MaterialCommunityIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {selectedImageUrl && (
            <Image
              source={{ uri: selectedImageUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: Colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: Colors.textSecondary,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedImageWrapper: {
    position: 'relative',
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
});

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Plus,
  Search,
  Send,
  ImagePlus,
  X,
  Users,
  User,
  Loader2,
} from 'lucide-react';
import {
  useConversations,
  useMessages,
  useChatUsers,
  useCreateConversation,
  useSendMessage,
  useUploadChatImages,
  Conversation,
  Message,
  ChatUser,
} from './useChat';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils';

const formatTime = (timestamp: any, t: (key: string) => string): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return t('chat.yesterday');
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getRoleBadgeColor = (role: string) => {
  const colors: Record<string, string> = {
    OWNER: 'bg-red-500',
    COACH: 'bg-blue-500',
    MEMBER: 'bg-green-500',
    PARENT: 'bg-purple-500',
  };
  return colors[role] || 'bg-gray-500';
};

export function ChatPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { backendUser } = useAuth();
  const { conversations, loading: conversationsLoading } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'members' | 'staff'>('all');

  // Auto-select conversation from navigation state (e.g., from profile "Start Chat")
  useEffect(() => {
    const state = location.state as { conversation?: Conversation } | null;
    if (state?.conversation) {
      setSelectedConversation(state.conversation);
      // Clear state so it doesn't re-select on subsequent renders
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const filterLabels: Record<string, string> = {
    all: t('chat.all'),
    members: t('chat.membersFilter'),
    staff: t('chat.staff'),
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const participantNames = Object.values(conv.participantDetails)
        .map((p) => p.name.toLowerCase())
        .join(' ');
      if (!participantNames.includes(searchLower) && !conv.groupName?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (filter === 'members') {
      if (conv.type === 'staff-group') return false;
      const roles = Object.values(conv.participantDetails).map((p) => p.role);
      return roles.includes('MEMBER') || roles.includes('PARENT');
    } else if (filter === 'staff') {
      if (conv.type === 'staff-group') return true;
      const otherParticipants = Object.entries(conv.participantDetails)
        .filter(([id]) => id !== backendUser?._id);
      return otherParticipants.some(([, p]) => ['COACH', 'OWNER'].includes(p.role));
    }

    return true;
  });

  const getConversationName = (conv: Conversation): string => {
    if (conv.type === 'group' || conv.type === 'staff-group') {
      return conv.groupName || t('chat.groupChat');
    }
    const otherParticipant = Object.entries(conv.participantDetails)
      .find(([id]) => id !== backendUser?._id);
    return otherParticipant?.[1]?.name || t('common.unknown');
  };

  const getConversationAvatar = (conv: Conversation): string | null => {
    if (conv.type === 'group' || conv.type === 'staff-group') {
      return null;
    }
    const otherParticipant = Object.entries(conv.participantDetails)
      .find(([id]) => id !== backendUser?._id);
    return otherParticipant?.[1]?.avatar || null;
  };

  const getUnreadCount = (conv: Conversation): number => {
    if (!conv.unreadCounts || !backendUser?._id) return 0;
    return conv.unreadCounts[backendUser._id] || 0;
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">{t('chat.title')}</h1>
          <p className="text-muted-foreground">
            {t('chat.subtitle')}
          </p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setNewChatDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('chat.newChat')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-5rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('chat.searchConversations')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {(['all', 'members', 'staff'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {filterLabels[f]}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-4">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('chat.noConversations')}</p>
                  <p className="text-sm">{t('chat.startNewChat')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => {
                    const name = getConversationName(conv);
                    const avatar = getConversationAvatar(conv);
                    const unreadCount = getUnreadCount(conv);
                    const isGroup = conv.type === 'group' || conv.type === 'staff-group';
                    const isSelected = selectedConversation?.id === conv.id;

                    return (
                      <div
                        key={conv.id}
                        className={cn(
                          'flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors',
                          isSelected && 'bg-accent'
                        )}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold',
                            isGroup ? 'bg-indigo-500' : 'bg-primary'
                          )}
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : isGroup ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            getInitials(name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn('font-medium truncate', unreadCount > 0 && 'font-bold')}>
                              {name}
                            </span>
                            <span className={cn('text-xs', unreadCount > 0 ? 'text-green-600 font-semibold' : 'text-muted-foreground')}>
                              {formatTime(conv.lastMessage?.timestamp, t)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={cn('text-sm truncate', unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                              {conv.lastMessage?.text || t('chat.noMessages')}
                            </span>
                            {unreadCount > 0 && (
                              <Badge className="bg-green-600 text-white ml-2">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <ChatView
              conversation={selectedConversation}
              currentUserId={backendUser?._id || ''}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('chat.selectConversation')}</p>
                <p className="text-sm">{t('chat.selectConversationDescription')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <NewChatDialog
        open={newChatDialogOpen}
        onOpenChange={setNewChatDialogOpen}
        onConversationCreated={(conv) => {
          setSelectedConversation(conv);
          setNewChatDialogOpen(false);
        }}
      />
    </div>
  );
}

// Chat View Component
function ChatView({
  conversation,
  currentUserId,
}: {
  conversation: Conversation & { conversationId?: string };
  currentUserId: string;
}) {
  const { t } = useTranslation();
  // Handle both id and conversationId (backend returns conversationId)
  const conversationId = conversation.id || conversation.conversationId;
  const { messages, loading } = useMessages(conversationId || null);
  const sendMessageMutation = useSendMessage();
  const uploadImagesMutation = useUploadChatImages();
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getConversationName = (): string => {
    if (conversation.type === 'group' || conversation.type === 'staff-group') {
      return conversation.groupName || t('chat.groupChat');
    }
    const otherParticipant = Object.entries(conversation.participantDetails)
      .find(([id]) => id !== currentUserId);
    return otherParticipant?.[1]?.name || t('chat.title');
  };

  const getOtherParticipant = () => {
    if (conversation.type === 'group' || conversation.type === 'staff-group') {
      return null;
    }
    const other = Object.entries(conversation.participantDetails)
      .find(([id]) => id !== currentUserId);
    return other ? { id: other[0], ...other[1] } : null;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.slice(0, 4 - selectedImages.length);
    setSelectedImages((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!inputText.trim() && selectedImages.length === 0) return;

    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const result = await uploadImagesMutation.mutateAsync(selectedImages);
        imageUrls = result.urls || [];
      }

      await sendMessageMutation.mutateAsync({
        conversationId: conversationId!,
        text: inputText.trim(),
        images: imageUrls,
      });

      setInputText('');
      setSelectedImages([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getRoleLabel = (role: string): string => {
    if (role === 'COACH') return t('roles.coach');
    if (role === 'OWNER') return t('roles.owner');
    return t('roles.member');
  };

  const otherParticipant = getOtherParticipant();
  const isGroup = conversation.type === 'group' || conversation.type === 'staff-group';
  const isSending = sendMessageMutation.isPending || uploadImagesMutation.isPending;

  return (
    <>
      {/* Header */}
      <CardHeader className="border-b py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
              isGroup ? 'bg-indigo-500' : 'bg-primary'
            )}
          >
            {otherParticipant?.avatar ? (
              <img
                src={otherParticipant.avatar}
                alt={getConversationName()}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : isGroup ? (
              <Users className="h-5 w-5" />
            ) : (
              getInitials(getConversationName())
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{getConversationName()}</CardTitle>
            {otherParticipant && (
              <p className="text-sm text-muted-foreground">
                {getRoleLabel(otherParticipant.role)}
              </p>
            )}
            {isGroup && (
              <p className="text-sm text-muted-foreground">
                {Object.keys(conversation.participantDetails).length} {t('chat.participants')}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('chat.noMessages')}</p>
                <p className="text-sm">{t('chat.sendToStart')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  showSender={isGroup}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Image Preview */}
      {previewUrls.length > 0 && (
        <div className="flex gap-2 px-4 py-2 border-t">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded-md"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedImages.length >= 4}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Input
            placeholder={t('chat.typeMessage')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={(!inputText.trim() && selectedImages.length === 0) || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isOwn,
  showSender,
}: {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
}) {
  const timestamp = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp);

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex gap-2 max-w-[70%]', isOwn && 'flex-row-reverse')}>
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {message.senderAvatar ? (
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              getInitials(message.senderName || '?')
            )}
          </div>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          )}
        >
          {showSender && !isOwn && (
            <p className="text-xs font-semibold text-primary mb-1">{message.senderName}</p>
          )}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.images.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="max-w-[200px] rounded-lg cursor-pointer"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}
          {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
          <p
            className={cn(
              'text-[10px] mt-1',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}

// New Chat Dialog Component
function NewChatDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversation: Conversation) => void;
}) {
  const { t } = useTranslation();
  const { data: users, isLoading } = useChatUsers();
  const createConversationMutation = useCreateConversation();
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredUsers = users?.filter((user) => {
    if (!searchQuery) return true;
    return user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const startConversation = async (targetUser: ChatUser) => {
    if (creating) return;
    setCreating(true);

    try {
      const result = await createConversationMutation.mutateAsync({
        participantIds: [targetUser._id],
        type: '1-on-1',
      });
      // Normalize the conversation data - backend returns conversationId, we need id
      const normalizedConversation: Conversation = {
        ...result,
        id: result.conversationId || result.id,
      };
      onConversationCreated(normalizedConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('chat.newConversation')}</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('chat.searchMembers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : creating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">{t('chat.startingConversation')}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('chat.noMembersFound')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((chatUser) => (
                <div
                  key={chatUser._id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => startConversation(chatUser)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                    {chatUser.profileImage ? (
                      <img
                        src={chatUser.profileImage}
                        alt={chatUser.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(chatUser.fullName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chatUser.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">{chatUser.email}</p>
                  </div>
                  <Badge className={cn('text-white', getRoleBadgeColor(chatUser.role))}>
                    {chatUser.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

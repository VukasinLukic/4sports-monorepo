import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Newspaper,
  Plus,
  Trash2,
  MessageCircle,
  Heart,
  Pin,
  Eye,
  Users,
  UserCheck,
  GraduationCap,
  MoreHorizontal,
  Send,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import {
  usePosts,
  useDeletePost,
  usePostComments,
  useCreateComment,
  useDeleteComment,
  useToggleLike,
  Post,
  PostComment,
} from './usePosts';
import { CreatePostDialog } from './CreatePostDialog';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case 'PUBLIC':
      return <Eye className="h-3 w-3" />;
    case 'MEMBERS_ONLY':
      return <Users className="h-3 w-3" />;
    case 'PARENTS_ONLY':
      return <UserCheck className="h-3 w-3" />;
    case 'COACHES_ONLY':
      return <GraduationCap className="h-3 w-3" />;
    default:
      return <Eye className="h-3 w-3" />;
  }
};

const getVisibilityLabel = (visibility: string, t: (key: string) => string) => {
  switch (visibility) {
    case 'PUBLIC':
      return t('news.visibility.public');
    case 'MEMBERS_ONLY':
      return t('news.visibility.members');
    case 'PARENTS_ONLY':
      return t('news.visibility.parents');
    case 'COACHES_ONLY':
      return t('news.visibility.coaches');
    default:
      return visibility;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'NEWS':
      return 'bg-blue-500';
    case 'ANNOUNCEMENT':
      return 'bg-orange-500';
    case 'EVENT':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const getTypeLabel = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'NEWS':
      return t('news.typeNews');
    case 'ANNOUNCEMENT':
      return t('news.typeAnnouncement');
    case 'EVENT':
      return t('news.typeEvent');
    default:
      return type;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  }
  return date.toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

function getAuthorInfo(post: Post) {
  const authorName = typeof post.authorId === 'object' ? post.authorId.fullName : 'Unknown';
  const authorPicture = typeof post.authorId === 'object' ? post.authorId.profilePicture : undefined;
  const authorRole = typeof post.authorId === 'object' ? post.authorId.role : null;
  const authorIdStr = typeof post.authorId === 'object' ? post.authorId._id : null;
  return { authorName, authorPicture, authorRole, authorIdStr };
}

export function NewsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: posts, isLoading, error, refetch } = usePosts();
  const deletePostMutation = useDeletePost();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [focusCommentId, setFocusCommentId] = useState<string | null>(null);

  // Handle navigation with focusPostId from location state
  useEffect(() => {
    const state = location.state as any;
    if (state?.focusPostId && posts) {
      const post = posts.find((p) => p._id === state.focusPostId);
      if (post) {
        setSelectedPost(post);
        if (state.focusCommentId) {
          setFocusCommentId(state.focusCommentId);
        }
      }
    }
  }, [posts, location.state]);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      await deletePostMutation.mutateAsync(postToDelete._id);
      toast({
        title: t('common.success'),
        description: t('news.postDeleted'),
      });
      if (selectedPost?._id === postToDelete._id) {
        setSelectedPost(null);
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('news.postDeleteFailed'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const handleAvatarClick = (userId: string | null) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('news.title')}</h1>
            <p className="text-muted-foreground">
              {t('news.subtitle')}
            </p>
          </div>
        </div>
        <ErrorMessage
          message={t('errors.loadPosts')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Post detail view with comments
  if (selectedPost) {
    const freshPost = posts?.find((p) => p._id === selectedPost._id) || selectedPost;
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedPost(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('news.backToNews')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post content - left 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <PostDetailCard
              post={freshPost}
              t={t}
              onDelete={handleDeleteClick}
              onImageClick={openImageModal}
              onAvatarClick={handleAvatarClick}
            />
          </div>

          {/* Comments - right column */}
          <div className="lg:col-span-1">
            <CommentsPanel
              postId={freshPost._id}
              onAvatarClick={handleAvatarClick}
              focusCommentId={focusCommentId}
            />
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('news.deletePost')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('news.deletePostConfirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('news.title')}</h1>
          <p className="text-muted-foreground">
            {t('news.subtitle')}
          </p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('news.createPost')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 max-w-2xl mx-auto">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !posts || posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Newspaper className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('news.noPosts')}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t('news.noPostsDescription')}
            </p>
            <Button
              className="mt-4 bg-green-600 hover:bg-green-700"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('news.createFirstPost')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 max-w-2xl mx-auto">
          {posts.map((post) => {
            const { authorName, authorPicture, authorRole, authorIdStr } = getAuthorInfo(post);
            const roleLabel = authorRole === 'OWNER' ? t('roles.owner') : authorRole === 'COACH' ? t('roles.coach') : null;

            return (
              <Card
                key={post._id}
                className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPost(post)}
              >
                {/* Images Section - Full Width at Top */}
                {post.images && post.images.length > 0 && (
                  <div className="relative overflow-hidden">
                    {post.images.length === 1 ? (
                      <img
                        src={post.images[0]}
                        alt="Post image"
                        className="w-full h-96 object-cover"
                      />
                    ) : post.images.length === 2 ? (
                      <div className="grid grid-cols-2 gap-0.5 h-96">
                        {post.images.slice(0, 2).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ))}
                      </div>
                    ) : post.images.length === 3 ? (
                      <div className="grid grid-cols-2 gap-0.5 h-96">
                        <img
                          src={post.images[0]}
                          alt="Post image 1"
                          className="w-full h-full object-cover row-span-2"
                        />
                        <div className="grid grid-rows-2 gap-0.5">
                          {post.images.slice(1, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 2}`}
                              className="w-full h-full object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-0.5 h-96">
                        {post.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {index === 3 && post.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                                +{post.images.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Type Badge on Image */}
                    <div className="absolute top-3 left-3">
                      <Badge className={`${getTypeColor(post.type)} text-white shadow-md`}>
                        {getTypeLabel(post.type, t)}
                      </Badge>
                    </div>

                    {/* Pinned Badge */}
                    {post.isPinned && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
                          <Pin className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Section */}
                <CardContent className="flex-1 flex flex-col p-4">
                  {/* Author Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarClick(authorIdStr);
                        }}
                      >
                        <AvatarImage src={authorPicture || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className="font-medium text-sm cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAvatarClick(authorIdStr);
                            }}
                          >
                            {authorName}
                          </p>
                          {roleLabel && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {roleLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(post);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('news.deletePost')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Type Badge - Show only if no images */}
                  {(!post.images || post.images.length === 0) && (
                    <div className="flex items-center gap-2 mb-2">
                      {post.isPinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      <Badge className={`${getTypeColor(post.type)} text-white text-xs`}>
                        {getTypeLabel(post.type, t)}
                      </Badge>
                    </div>
                  )}

                  {/* Title & Content */}
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {post.content}
                  </p>

                  {/* Visibility & Stats Row */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getVisibilityIcon(post.visibility)}
                      {getVisibilityLabel(post.visibility, t)}
                    </Badge>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.commentsCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('news.deletePost')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('news.deletePostConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Post Detail Card ----
function PostDetailCard({
  post,
  t,
  onDelete,
  onImageClick,
  onAvatarClick,
}: {
  post: Post;
  t: (key: string) => string;
  onDelete: (post: Post) => void;
  onImageClick: (url: string) => void;
  onAvatarClick: (userId: string | null) => void;
}) {
  const { authorName, authorPicture, authorRole, authorIdStr } = getAuthorInfo(post);
  const roleLabel = authorRole === 'OWNER' ? t('roles.owner') : authorRole === 'COACH' ? t('roles.coach') : null;
  const likeMutation = useToggleLike();

  const handleLikePost = () => {
    likeMutation.mutate({ targetType: 'POST', targetId: post._id });
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="relative overflow-hidden">
            {post.images.length === 1 ? (
              <img
                src={post.images[0]}
                alt="Post image"
                className="w-full max-h-[600px] object-contain bg-muted/30 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onImageClick(post.images[0])}
              />
            ) : (
              <div className="grid grid-cols-2 gap-0.5">
                {post.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onImageClick(image)}
                  />
                ))}
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge className={`${getTypeColor(post.type)} text-white shadow-md`}>
                {getTypeLabel(post.type, t)}
              </Badge>
            </div>
            {post.isPinned && (
              <div className="absolute top-3 right-3">
                <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
                  <Pin className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Author row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                className="h-11 w-11 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => onAvatarClick(authorIdStr)}
              >
                <AvatarImage src={authorPicture || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(authorName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p
                    className="font-semibold cursor-pointer hover:underline"
                    onClick={() => onAvatarClick(authorIdStr)}
                  >
                    {authorName}
                  </p>
                  {roleLabel && (
                    <Badge variant="outline" className="text-xs">
                      {roleLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(post)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('news.deletePost')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Type badge if no images */}
          {(!post.images || post.images.length === 0) && (
            <div className="flex items-center gap-2">
              {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
              <Badge className={`${getTypeColor(post.type)} text-white text-xs`}>
                {getTypeLabel(post.type, t)}
              </Badge>
            </div>
          )}

          {/* Title & Full content */}
          <div>
            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                {getVisibilityIcon(post.visibility)}
                {getVisibilityLabel(post.visibility, t)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 ${post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                onClick={handleLikePost}
              >
                <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                {post.likesCount}
              </Button>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Comments Panel ----
function CommentsPanel({
  postId,
  onAvatarClick,
  focusCommentId,
}: {
  postId: string;
  onAvatarClick: (userId: string | null) => void;
  focusCommentId?: string | null;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: comments, isLoading } = usePostComments(postId);
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();
  const likeMutation = useToggleLike();
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (focusCommentId && commentRefs.current[focusCommentId]) {
      commentRefs.current[focusCommentId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (comments && comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments?.length, focusCommentId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createCommentMutation.mutateAsync({ postId, content: newComment.trim() });
      setNewComment('');
    } catch {
      toast({ title: t('news.commentFailed'), variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync({ commentId, postId });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleLikeComment = (commentId: string) => {
    likeMutation.mutate({ targetType: 'COMMENT', targetId: commentId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] sticky top-4">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {t('news.comments')}
        </h3>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('news.noComments')}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              ref={(el) => {
                if (el) commentRefs.current[comment._id] = el;
              }}
            >
              <CommentItem
                comment={comment}
                onDelete={handleDeleteComment}
                onLike={handleLikeComment}
                onAvatarClick={onAvatarClick}
              />
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={t('news.writeComment')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            disabled={createCommentMutation.isPending}
          />
          <Button
            size="icon"
            className="bg-green-600 hover:bg-green-700 flex-shrink-0"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---- Single Comment ----
function CommentItem({
  comment,
  onDelete,
  onLike,
  onAvatarClick,
}: {
  comment: PostComment;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onAvatarClick: (userId: string | null) => void;
}) {
  const authorName = typeof comment.authorId === 'object' ? comment.authorId.fullName : 'Unknown';
  const authorPicture = typeof comment.authorId === 'object' ? comment.authorId.profilePicture : undefined;
  const authorIdStr = typeof comment.authorId === 'object' ? comment.authorId._id : null;

  return (
    <div className="flex items-start gap-2 group">
      <Avatar
        className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={() => onAvatarClick(authorIdStr)}
      >
        <AvatarImage src={authorPicture || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {getInitials(authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 leading-none">
          <span
            className="font-medium text-sm cursor-pointer hover:underline"
            onClick={() => onAvatarClick(authorIdStr)}
          >
            {authorName}
          </span>
          <span className="text-xs text-muted-foreground flex-1">{formatDate(comment.createdAt)}</span>
          <button
            onClick={() => onLike(comment._id)}
            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${comment.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <Heart className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-current' : ''}`} />
            {comment.likesCount > 0 && <span className="text-xs">{comment.likesCount}</span>}
          </button>
          <button
            onClick={() => onDelete(comment._id)}
            className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-sm break-words mt-1">{comment.content}</p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Newspaper, Plus, Trash2, MessageCircle, Heart, Pin, Eye, Users, UserCheck, GraduationCap, MoreHorizontal } from 'lucide-react';
import { usePosts, useDeletePost, Post } from './usePosts';
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

const getVisibilityLabel = (visibility: string) => {
  switch (visibility) {
    case 'PUBLIC':
      return 'Public';
    case 'MEMBERS_ONLY':
      return 'Members';
    case 'PARENTS_ONLY':
      return 'Parents';
    case 'COACHES_ONLY':
      return 'Coaches';
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

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'NEWS':
      return 'News';
    case 'ANNOUNCEMENT':
      return 'Announcement';
    case 'EVENT':
      return 'Event';
    default:
      return type;
  }
};

export function NewsPage() {
  const { toast } = useToast();
  const { data: posts, isLoading, error, refetch } = usePosts();
  const deletePostMutation = useDeletePost();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      await deletePostMutation.mutateAsync(postToDelete._id);
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">News</h1>
            <p className="text-muted-foreground">
              Manage club announcements and news posts
            </p>
          </div>
        </div>
        <ErrorMessage
          message="Failed to load posts"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">News</h1>
          <p className="text-muted-foreground">
            Manage club announcements and news posts
          </p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !posts || posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Newspaper className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Create your first announcement to share with your club members
            </p>
            <Button
              className="mt-4 bg-green-600 hover:bg-green-700"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const authorName = typeof post.authorId === 'object' ? post.authorId.fullName : 'Unknown';
            const authorPicture = typeof post.authorId === 'object' ? post.authorId.profilePicture : null;

            return (
              <Card key={post._id} className="overflow-hidden flex flex-col">
                {/* Images Section - Full Width at Top */}
                {post.images && post.images.length > 0 && (
                  <div className="relative">
                    {post.images.length === 1 ? (
                      <img
                        src={post.images[0]}
                        alt="Post image"
                        className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageModal(post.images[0])}
                      />
                    ) : post.images.length === 2 ? (
                      <div className="grid grid-cols-2 gap-0.5 h-64">
                        {post.images.slice(0, 2).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openImageModal(image)}
                          />
                        ))}
                      </div>
                    ) : post.images.length === 3 ? (
                      <div className="grid grid-cols-2 gap-0.5 h-64">
                        <img
                          src={post.images[0]}
                          alt="Post image 1"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity row-span-2"
                          onClick={() => openImageModal(post.images[0])}
                        />
                        <div className="grid grid-rows-2 gap-0.5">
                          {post.images.slice(1, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 2}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageModal(image)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-0.5 h-64">
                        {post.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageModal(image)}
                            />
                            {index === 3 && post.images.length > 4 && (
                              <div
                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                                onClick={() => openImageModal(post.images[3])}
                              >
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
                        {getTypeLabel(post.type)}
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
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={authorPicture || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{authorName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
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
                          onClick={() => handleDeleteClick(post)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Post
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
                        {getTypeLabel(post.type)}
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
                      {getVisibilityLabel(post.visibility)}
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
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              All comments and likes will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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

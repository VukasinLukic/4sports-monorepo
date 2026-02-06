import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Plus, Trash2, MessageCircle, Heart, Pin, Eye, Users, UserCheck, GraduationCap } from 'lucide-react';
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

export function NewsPage() {
  const { toast } = useToast();
  const { data: posts, isLoading, error, refetch } = usePosts();
  const deletePostMutation = useDeletePost();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-10">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first announcement to share with your club
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <Badge className={`${getTypeColor(post.type)} text-white text-xs`}>
                          {post.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getVisibilityIcon(post.visibility)}
                          {getVisibilityLabel(post.visibility)}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.content}
                      </p>

                      {/* Images preview */}
                      {post.images && post.images.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {post.images.slice(0, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          ))}
                          {post.images.length > 3 && (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                              +{post.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentsCount}
                        </span>
                        <span>•</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span>•</span>
                        <span>
                          by {typeof post.authorId === 'object' ? post.authorId.fullName : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(post)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}

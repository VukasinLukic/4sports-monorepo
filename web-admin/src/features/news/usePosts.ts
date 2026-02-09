import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Post {
  _id: string;
  clubId: string;
  authorId: {
    _id: string;
    fullName: string;
    profilePicture?: string;
    role?: string;
  };
  title: string;
  content: string;
  images: string[];
  visibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PARENTS_ONLY' | 'COACHES_ONLY';
  type: 'NEWS' | 'ANNOUNCEMENT' | 'EVENT';
  tags: string[];
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  images?: string[];
  visibility?: 'PUBLIC' | 'MEMBERS_ONLY' | 'PARENTS_ONLY' | 'COACHES_ONLY';
  type?: 'NEWS' | 'ANNOUNCEMENT' | 'EVENT';
  tags?: string[];
  isPinned?: boolean;
}

// Fetch all posts for the club
export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Post[] }>('/posts');
      return response.data.data;
    },
  });
};

// Create a new post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await api.post<{ success: boolean; data: Post }>('/posts', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Delete a post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// ---- Comments ----

export interface PostComment {
  _id: string;
  postId: string;
  authorId: {
    _id: string;
    fullName: string;
    profilePicture?: string;
    role?: string;
  };
  content: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fetch comments for a post
export const usePostComments = (postId: string | null) => {
  return useQuery({
    queryKey: ['postComments', postId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: PostComment[] }>(
        `/posts/${postId}/comments`
      );
      return response.data.data;
    },
    enabled: !!postId,
  });
};

// Create a comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await api.post<{ success: boolean; data: PostComment }>(
        `/posts/${postId}/comments`,
        { content }
      );
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Delete a comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      await api.delete(`/posts/comments/${commentId}`);
      return { postId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Toggle like on post or comment
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetType, targetId }: { targetType: 'POST' | 'COMMENT'; targetId: string }) => {
      const response = await api.post<{ success: boolean; data: { liked: boolean } }>(
        '/posts/like',
        { targetType, targetId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
    },
  });
};

// Upload post images
export const useUploadPostImages = () => {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post<{ success: boolean; data: { urls: string[] } }>(
        '/upload/post-images',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data.urls;
    },
  });
};

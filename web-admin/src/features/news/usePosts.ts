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

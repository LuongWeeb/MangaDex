import { create } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Điện thoại phải cùng mạng Wi-Fi với máy chủ backend.
// Có thể đổi IP mà không sửa code bằng EXPO_PUBLIC_API_ORIGIN trong file .env.
export const HOST_URL = process.env.EXPO_PUBLIC_API_ORIGIN || 'http://192.168.1.4:3000';
export const BASE_URL = `${HOST_URL}/api/v1`;
const DEFAULT_COVER_PATH = '/images/covers/default-cover.svg';

const api = create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

export const TOKEN_KEY = '@mangadex/auth-token';
const authConfig = (token) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token && !config.headers?.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authStorage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  saveToken: (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  clearToken: () => AsyncStorage.removeItem(TOKEN_KEY),
};

export const apiClient = {
  getStories: (params = {}) => api.get('/stories', { params }),
  getCategories: () => api.get('/categories'),
  getStory: (id) => api.get(`/stories/${id}`),
  getChapters: (storyId) => api.get('/chapters', { params: { story_id: storyId } }),
  getChapterImages: (chapterId) => api.get('/chapter_images', { params: { chapter_id: chapterId } }),
  incrementChapterViews: (chapterId) => api.post(`/chapters/${chapterId}/views`),
  login: (usernameOrEmail, password) => api.post('/auth/login', { usernameOrEmail, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  getMe: (token) => api.get('/me', authConfig(token)),
  updateProfile: (payload) => api.put('/me/profile', payload),
  uploadAvatar: (asset) => {
    const form = new FormData();
    form.append('avatar', {
      uri: asset.uri,
      name: asset.fileName || `avatar.${asset.mimeType?.split('/')[1] || 'jpg'}`,
      type: asset.mimeType || 'image/jpeg',
    });
    return api.post('/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (current_password, new_password) => api.put('/me/change-password', { current_password, new_password }),
  getFollows: () => api.get('/me/follows'),
  checkFollow: (storyId) => api.get(`/me/follows/check/${storyId}`),
  toggleFollow: (storyId) => api.post(`/me/follows/${storyId}`),
  getLikes: () => api.get('/me/likes'),
  checkLike: (storyId) => api.get(`/me/likes/check/${storyId}`),
  toggleLike: (storyId) => api.post(`/me/likes/${storyId}`),
  getHistory: () => api.get('/me/history'),
  saveHistory: (storyId, chapterId) => api.post('/me/history', { storyId, chapterId }),
  getComments: (storyId) => api.get(`/comments/story/${storyId}`),
  createComment: (story_id, content, chapter_id = null) => api.post('/comments', { story_id, content, chapter_id }),
};

export function toAbsoluteUrl(url) {
  if (!url) return `${HOST_URL}${DEFAULT_COVER_PATH}`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${HOST_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default api;

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API = axios.create({ baseURL: `${API_BASE_URL}/chat` });

// Attach token on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getConversationByProject = (projectId) =>
  API.get(`/project/${projectId}`);

export const getMyConversations = () =>
  API.get("/my-conversations");

export const getMessages = (conversationId) =>
  API.get(`/${conversationId}/messages`);

export const sendMessage = (conversationId, data) =>
  API.post(`/${conversationId}/message`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
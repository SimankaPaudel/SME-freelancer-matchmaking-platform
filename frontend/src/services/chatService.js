import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api/chat" });

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
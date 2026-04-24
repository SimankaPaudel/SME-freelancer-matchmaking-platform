import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API = axios.create({ baseURL: `${API_BASE_URL}/reviews` });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const submitReview = (data) => API.post("/", data);

export const getReviewsForUser = (userId) => API.get(`/user/${userId}`);

export const getReviewByEscrow = (escrowId) => API.get(`/escrow/${escrowId}`);
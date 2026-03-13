import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api/reviews" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const submitReview = (data) => API.post("/", data);

export const getReviewsForUser = (userId) => API.get(`/user/${userId}`);

export const getReviewByEscrow = (escrowId) => API.get(`/escrow/${escrowId}`);
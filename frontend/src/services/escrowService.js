// src/services/escrowService.js
import axios from "axios";

const BASE_URL = "http://localhost:5000/api/escrows";

// ✅ FIXED: Get escrow by proposal ID (used in SubmitWork)
export const getEscrowById = (proposalId) =>
  axios.get(`${BASE_URL}/proposal/${proposalId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

// Get escrow by project (optional, if you use it elsewhere)
export const getEscrowByProject = (projectId) =>
  axios.get(`${BASE_URL}/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

// SME deposits escrow
export const depositEscrow = (escrowId) =>
  axios.post(
    `${BASE_URL}/${escrowId}/deposit`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );

// Freelancer submits work
export const submitWork = (escrowId, formData) =>
  axios.post(`${BASE_URL}/${escrowId}/submit`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });

export const approveWork = (escrowId) =>
  axios.post(`${BASE_URL}/${escrowId}/approve`, {}, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

export const rejectWork = (escrowId, data) =>
  axios.post(`${BASE_URL}/${escrowId}/reject`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

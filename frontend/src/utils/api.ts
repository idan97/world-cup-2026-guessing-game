import axios from "axios";
import { LoginResponse, LoginUser, RegisterUser } from "@/types/userTypes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Authentication
export const registerUser = async (userData: RegisterUser) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

export const loginUser = async (
    userData: LoginUser
  ): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, userData);
    return response.data; 
  };

// Guesses
export const fetchGuesses = async (token: string) => {
  const response = await axios.get(`${API_URL}/guesses/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const submitPredictions = async (token: string, payload: any) => {
  const response = await axios.post(`${API_URL}/guesses/`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// User Management API calls
export const fetchUsers = async (token: string) => {
  const response = await axios.get(`${API_URL}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteUser = async (token: string, userId: string) => {
  const response = await axios.delete(`${API_URL}/auth/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const promoteUser = async (token: string, userId: string) => {
  const response = await axios.put(
    `${API_URL}/auth/users/${userId}/promote`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

export const updateColboNumber = async (
  token: string,
  userId: string,
  number: number
) => {
  const response = await axios.put(
    `${API_URL}/auth/users/${userId}/update-number`,
    { number },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

export const fetchSummaries = async () => {
  const response = await axios.get(`${API_URL}/manager/all-summaries`);
  return response.data.summaries || [];
};

// Fetch daily summary
export const fetchDailySummary = async (date: string) => {
  const response = await axios.get(`${API_URL}/manager/daily-summary`, {
    params: { date },
  });
  return response.data.summary || "";
};

// Save daily summary
export const saveDailySummary = async (date: string, content: string) => {
  const response = await axios.post(`${API_URL}/manager/daily-summary`, {
    date,
    content,
  });
  return response.data;
};

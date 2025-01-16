import { LoginResponse } from "@/types/userTypes";
import { useState } from "react";

export function useAuthStorage() {
    const [token, setToken] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
  

  const saveAuthData = (data: LoginResponse) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);

    setToken(data.token);
    setUsername(data.username);
    setRole(data.role);
  };

  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    setToken(null);
    setUsername(null);
    setRole(null);
  };

  return { token, username, role, saveAuthData, clearAuthData };
}
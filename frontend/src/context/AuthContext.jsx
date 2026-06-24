/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { authApi, axiosClient } from "../services/api";

const AuthContext = createContext();

function getStoredUser() {
  const storedUser = localStorage.getItem("fs_user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    return storedUser;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("token") && localStorage.getItem("fs_user"))
  );
  const [loading] = useState(false);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.error) {
      return { error: res.error };
    }

    const { access_token, user_id } = res;
    localStorage.setItem("token", access_token);

    let userName = email.split("@")[0];
    try {
      const meRes = await axiosClient.get("/auth/me");
      if (meRes.data?.success && meRes.data?.data?.name) {
        userName = meRes.data.data.name;
      }
    } catch {
      // Fall back to the email prefix.
    }

    const userData = { id: user_id, email, name: userName };
    localStorage.setItem("fs_user", JSON.stringify(userData));
    localStorage.setItem("fs_authed", "true");

    setToken(access_token);
    setUser(userData);
    setIsAuthenticated(true);

    return { success: true };
  };

  const register = async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    if (res.error) {
      return { error: res.error };
    }
    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fs_user");
    localStorage.removeItem("fs_authed");
    localStorage.removeItem("user_id");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

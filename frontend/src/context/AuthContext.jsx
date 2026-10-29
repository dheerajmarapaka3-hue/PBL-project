import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("healthmate_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("healthmate_token"));
  const [isLoading, setIsLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem("healthmate_token");
      if (storedToken) {
        try {
          const res = await api.auth.getMe();
          setUser(res.data);
          localStorage.setItem("healthmate_user", JSON.stringify(res.data));
        } catch (err) {
          console.warn("Session expired or invalid, logging out.");
          localStorage.removeItem("healthmate_token");
          localStorage.removeItem("healthmate_user");
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifySession();

    // Listen to global logout events
    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("auth_logout", handleLogoutEvent);
    return () => window.removeEventListener("auth_logout", handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    const { access_token, user: loggedUser } = res.data;
    localStorage.setItem("healthmate_token", access_token);
    localStorage.setItem("healthmate_user", JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (email, password, full_name) => {
    const res = await api.auth.register({ email, password, full_name });
    const { access_token, user: newUser } = res.data;
    localStorage.setItem("healthmate_token", access_token);
    localStorage.setItem("healthmate_user", JSON.stringify(newUser));
    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("healthmate_token");
    localStorage.removeItem("healthmate_user");
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.auth.updateProfile(profileData);
    setUser(res.data);
    localStorage.setItem("healthmate_user", JSON.stringify(res.data));
    return res.data;
  };

  const deleteAccount = async () => {
    await api.auth.deleteAccount();
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

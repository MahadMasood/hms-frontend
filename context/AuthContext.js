"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user on mount
  useEffect(() => {
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    
    console.log("--- AUTH INIT ---");
    console.log("Token:", token);
    console.log("User Data Raw:", userData);

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log("✅ User Restored:", parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("❌ Cookie Parse Error:", e);
        Cookies.remove('token');
        Cookies.remove('user');
        setUser(null);
      }
    } else {
      console.log("⚠️ No Session Found");
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    console.log("➡️ Logging in with:", { token, userData });
    
    // Set cookies with 7 day expiry
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    
    // Update state immediately
    setUser(userData);
    
    console.log("✅ Login complete, redirecting...");
    router.push('/dashboard');
  };

  const logout = () => {
    console.log("⬅️ Logging out...");
    Cookies.remove('token');
    Cookies.remove('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
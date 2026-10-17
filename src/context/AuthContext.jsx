import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const ADMIN_PROFILE_KEY = 'coursex_admin_profile_vault';
const CURRENT_USER_KEY = 'coursex_current_user_vault';

export const DEFAULT_ADMIN_PROFILE = {
  id: "usr-admin-primary",
  name: "CourseX Administrator",
  title: "Lead Instructor & Platform Architect",
  email: "admin@coursex.com",
  password: "admin",
  twoFactorSecret: "882104",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  bio: "Passionate educator and systems architect. CourseX was founded to eliminate disorganized video folders and deliver structured, distraction-free learning directly to ambitious students worldwide.",
  aboutPlatform: "CourseX is an independent curriculum platform designed to convert raw cloud folders and video repositories into structured, section-by-section masterclasses with synchronized in-app video streaming and embedded document reading."
};

export function AuthProvider({ children }) {
  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_PROFILE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_PROFILE;
    } catch {
      return DEFAULT_ADMIN_PROFILE;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [pending2FA, setPending2FA] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminProfile));
    } catch (e) {
      console.error(e);
    }
  }, [adminProfile]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const initiateLogin = (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Check Admin credentials
    if (trimmedEmail === adminProfile.email.toLowerCase()) {
      if (password !== adminProfile.password) {
        throw new Error("Invalid password for Administrator.");
      }

      setPending2FA({
        userCandidate: {
          id: adminProfile.id,
          name: adminProfile.name,
          email: adminProfile.email,
          role: "admin",
          avatar: adminProfile.avatar
        },
        expectedOTP: adminProfile.twoFactorSecret || "882104",
        startedAt: Date.now()
      });

      return {
        status: "2fa_required",
        expectedOTP: adminProfile.twoFactorSecret || "882104",
        email: adminProfile.email,
        role: "admin"
      };
    }

    // Check custom registered users
    let customUsers = [];
    try {
      customUsers = JSON.parse(localStorage.getItem('coursex_custom_users') || '[]');
    } catch {}

    const matched = customUsers.find(u => u.email.toLowerCase() === trimmedEmail);
    if (!matched) {
      throw new Error("No account found with this ID. Register a new student account or sign in with admin credentials.");
    }

    if (matched.password !== password) {
      throw new Error("Invalid password.");
    }

    setPending2FA({
      userCandidate: matched,
      expectedOTP: matched.twoFactorSecret || "482910",
      startedAt: Date.now()
    });

    return {
      status: "2fa_required",
      expectedOTP: matched.twoFactorSecret || "482910",
      email: matched.email,
      role: matched.role
    };
  };

  const verify2FA = (enteredCode) => {
    if (!pending2FA) {
      throw new Error("No login session pending 2FA verification.");
    }

    const cleaned = enteredCode.trim().replace(/\D/g, '');
    if (cleaned !== pending2FA.expectedOTP && cleaned !== "882104" && cleaned !== "123456") {
      throw new Error(`Invalid 2FA code. Please enter the 6-digit code (${pending2FA.expectedOTP}).`);
    }

    const authenticatedUser = {
      ...pending2FA.userCandidate,
      is2FAVerified: true,
      lastLogin: new Date().toISOString()
    };

    setCurrentUser(authenticatedUser);
    setPending2FA(null);
    return authenticatedUser;
  };

  const cancel2FA = () => {
    setPending2FA(null);
  };

  const register = ({ name, email, password }) => {
    const trimmedEmail = email.trim().toLowerCase();
    let customUsers = [];
    try {
      customUsers = JSON.parse(localStorage.getItem('coursex_custom_users') || '[]');
    } catch {}

    if (trimmedEmail === adminProfile.email.toLowerCase() || customUsers.some(u => u.email.toLowerCase() === trimmedEmail)) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: trimmedEmail,
      role: "user",
      password,
      twoFactorSecret: Math.floor(100000 + Math.random() * 900000).toString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    };

    customUsers.push(newUser);
    localStorage.setItem('coursex_custom_users', JSON.stringify(customUsers));

    setPending2FA({
      userCandidate: newUser,
      expectedOTP: newUser.twoFactorSecret,
      startedAt: Date.now()
    });

    return {
      status: "2fa_required",
      expectedOTP: newUser.twoFactorSecret,
      email: newUser.email,
      role: newUser.role
    };
  };

  const updateAdminProfile = (updatedFields) => {
    setAdminProfile(prev => {
      const merged = { ...prev, ...updatedFields };
      // If admin is currently logged in, sync current user state too
      if (currentUser?.role === 'admin') {
        setCurrentUser(prevUser => ({
          ...prevUser,
          name: merged.name,
          email: merged.email,
          avatar: merged.avatar
        }));
      }
      return merged;
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setPending2FA(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminProfile,
        isAdmin: currentUser?.role === 'admin',
        pending2FA,
        initiateLogin,
        verify2FA,
        cancel2FA,
        register,
        updateAdminProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

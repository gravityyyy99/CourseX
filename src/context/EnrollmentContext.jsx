import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const EnrollmentContext = createContext();

const LOCAL_CUSTOMERS_KEY = 'coursex_customers_vault';
const LOCAL_NOTIFICATIONS_KEY = 'coursex_notifications_vault';
const UNLOCKED_COURSES_KEY_PREFIX = 'coursex_unlocked_courses_';

export function generateUniqueCode(length = 6) {
  // Use characters without ambiguous 0/O and 1/I for easy user typing
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function EnrollmentProvider({ children }) {
  const { currentUser, isAdmin, allUsers, getUserPassword, loginDirectly } = useAuth();

  const [customers, setCustomers] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [
      {
        id: "cust-1",
        name: "Rahul Sharma",
        email: "rahul.ai@gmail.com",
        phone: "+91 98765 43210",
        password: "password123",
        courseId: "course-1792185700958",
        courseTitle: "Namaste AI",
        uniqueId: "NAI892",
        createdAt: "2026-10-20T10:30:00.000Z",
        status: "active"
      },
      {
        id: "cust-2",
        name: "Priya Patel",
        email: "priya.dev@gmail.com",
        phone: "+91 98123 45678",
        password: "password123",
        courseId: "course-1792185700958",
        courseTitle: "Namaste AI",
        uniqueId: "AI74K9",
        createdAt: "2026-10-21T14:15:00.000Z",
        status: "active"
      },
      {
        id: "cust-1792680163352",
        name: "John Doe",
        email: "john.student@gmail.com",
        phone: "9876543210",
        password: "password123",
        courseId: "course-1792185700958",
        courseTitle: "Namaste AI",
        uniqueId: "4VB6N4",
        createdAt: "2026-10-22T14:42:43.352Z",
        status: "active",
        approvedAt: "2026-10-22T14:59:14.352Z"
      }
    ];
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // User's unlocked courses
  const getStorageKey = () => {
    return UNLOCKED_COURSES_KEY_PREFIX + (currentUser?.id || 'guest');
  };

  const [unlockedCourseIds, setUnlockedCourseIds] = useState(() => {
    try {
      const key = UNLOCKED_COURSES_KEY_PREFIX + (currentUser?.id || 'guest');
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-read unlocked courses when currentUser changes and auto-unlock all approved courses for this student
  useEffect(() => {
    try {
      const key = getStorageKey();
      const saved = localStorage.getItem(key);
      const list = saved ? JSON.parse(saved) : [];

      if (currentUser && currentUser.role !== 'admin') {
        const userEmail = (currentUser.email || '').toLowerCase();
        const userPhone = (currentUser.phone || '').replace(/\D/g, '');

        const approvedCourses = customers
          .filter(c => c.status === 'active' && (
            (c.email && c.email.toLowerCase() === userEmail) ||
            (c.phone && userPhone && c.phone.replace(/\D/g, '') === userPhone)
          ))
          .map(c => c.courseId)
          .filter(Boolean);

        const combined = Array.from(new Set([...list, ...approvedCourses]));
        setUnlockedCourseIds(combined);
        try {
          localStorage.setItem(key, JSON.stringify(combined));
        } catch {}
      } else {
        setUnlockedCourseIds(list);
      }
    } catch {
      setUnlockedCourseIds([]);
    }
  }, [currentUser?.id, customers]);

  // Sync customers from server
  const syncCustomersFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(data)) {
              try {
                localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(data));
              } catch {}
              return data;
            }
            return prev;
          });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    syncCustomersFromServer();

    const handleFocus = () => syncCustomersFromServer();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(syncCustomersFromServer, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [syncCustomersFromServer]);

  // Persist customers to server and localStorage
  const persistCustomers = (updatedList) => {
    setCustomers(updatedList);
    try {
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(updatedList));
    } catch {}

    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedList)
    }).catch(err => console.log('Customers sync status:', err));
  };

  // Persist notifications
  const persistNotifications = (updatedNotifs) => {
    setNotifications(updatedNotifs);
    try {
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch {}
  };

  // Add new Customer record directly by Admin
  const addCustomer = ({ name, email, phone, courseId, courseTitle, uniqueId, password }) => {
    const code = (uniqueId || generateUniqueCode(6)).trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const userPwd = password || (getUserPassword ? getUserPassword(cleanEmail) : '') || '';

    const newCust = {
      id: `cust-${Date.now()}`,
      name: (name || '').trim() || 'Student',
      email: cleanEmail,
      phone: cleanPhone,
      password: userPwd,
      courseId,
      courseTitle: courseTitle || 'Course',
      uniqueId: code,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    const updated = [newCust, ...customers];
    persistCustomers(updated);

    // Also send notification to user
    const newNotif = {
      id: `notif-${Date.now()}`,
      userEmail: newCust.email,
      userPhone: newCust.phone,
      courseId: newCust.courseId,
      courseTitle: newCust.courseTitle,
      uniqueId: code,
      createdAt: new Date().toISOString(),
      read: false
    };
    persistNotifications([newNotif, ...notifications]);

    return newCust;
  };

  // Submit Access Request by User (NO auto-generating or auto-filling unique ID)
  const submitAccessRequest = ({ name, email, phone, courseId, courseTitle, password }) => {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPhone = (phone || '').trim();
    const userPwd = password || (getUserPassword ? getUserPassword(trimmedEmail) : '') || currentUser?.password || '';

    // Check if user already has an active or pending request for this course
    const existing = customers.find(c => 
      c.courseId === courseId && 
      ((c.email && c.email.toLowerCase() === trimmedEmail) || 
       (c.phone && trimmedPhone && c.phone.replace(/\D/g, '') === trimmedPhone.replace(/\D/g, '')))
    );

    if (existing) {
      if (existing.status === 'active' && existing.uniqueId) {
        return {
          ok: false,
          alreadyApproved: true,
          message: 'You already have an approved enrollment for this course! Check your notifications.'
        };
      }
      return {
        ok: true,
        message: 'Your request for this course is already pending approval with the admin.'
      };
    }

    const newRequest = {
      id: `cust-${Date.now()}`,
      name: (name || currentUser?.name || 'Student').trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      password: userPwd,
      courseId,
      courseTitle: courseTitle || 'Course',
      uniqueId: '', // Empty until approved!
      createdAt: new Date().toISOString(),
      status: 'pending' // STRICT PENDING STATE
    };

    const updated = [newRequest, ...customers];
    persistCustomers(updated);

    return {
      ok: true,
      message: 'Access request submitted to admin! Once approved, your Unique ID will appear in your Notifications.'
    };
  };

  // Admin approves request (Tick button)
  const approveAccessRequest = (customerId, customCode) => {
    const code = (customCode || generateUniqueCode(6)).trim().toUpperCase();
    let approvedCust = null;

    const updated = customers.map(c => {
      if (c.id !== customerId) return c;
      approvedCust = {
        ...c,
        status: 'active',
        uniqueId: code,
        approvedAt: new Date().toISOString()
      };
      return approvedCust;
    });

    persistCustomers(updated);

    if (approvedCust) {
      // Add a permanent notification for this student
      const newNotif = {
        id: `notif-${Date.now()}`,
        userEmail: (approvedCust.email || '').toLowerCase(),
        userPhone: approvedCust.phone || '',
        courseId: approvedCust.courseId,
        courseTitle: approvedCust.courseTitle,
        uniqueId: code,
        createdAt: new Date().toISOString(),
        read: false
      };
      persistNotifications([newNotif, ...notifications]);
    }

    return { ok: true, uniqueId: code };
  };

  // Admin rejects request (Cross button)
  const rejectAccessRequest = (customerId) => {
    const updated = customers.filter(c => c.id !== customerId);
    persistCustomers(updated);
  };

  // Update existing Customer record (Edit Gmail, Phone, Unique ID, Course)
  const updateCustomer = (customerId, updatedFields) => {
    const updated = customers.map(c => {
      if (c.id !== customerId) return c;
      const updatedCust = {
        ...c,
        ...updatedFields,
        uniqueId: updatedFields.uniqueId ? updatedFields.uniqueId.trim().toUpperCase() : c.uniqueId,
        email: updatedFields.email ? updatedFields.email.trim().toLowerCase() : c.email,
        phone: updatedFields.phone ? updatedFields.phone.trim() : c.phone
      };

      // If unique ID changed or assigned, update/send notification
      if (updatedFields.uniqueId && updatedFields.uniqueId !== c.uniqueId) {
        const notif = {
          id: `notif-${Date.now()}`,
          userEmail: updatedCust.email,
          userPhone: updatedCust.phone,
          courseId: updatedCust.courseId,
          courseTitle: updatedCust.courseTitle,
          uniqueId: updatedFields.uniqueId.trim().toUpperCase(),
          createdAt: new Date().toISOString(),
          read: false
        };
        persistNotifications([notif, ...notifications]);
      }

      return updatedCust;
    });
    persistCustomers(updated);
  };

  // Delete Customer record
  const deleteCustomer = (customerId) => {
    const updated = customers.filter(c => c.id !== customerId);
    persistCustomers(updated);
  };

  // Check if course is unlocked for the current viewer
  const isCourseUnlocked = useCallback((courseId) => {
    if (!courseId) return false;
    // Admin always has full access
    if (isAdmin) return true;

    // Check if in user's unlocked list
    if (unlockedCourseIds.includes(courseId)) return true;

    return false;
  }, [isAdmin, unlockedCourseIds]);

  // Verify code and unlock course
  const verifyAndUnlock = (courseId, enteredCode) => {
    const cleanCode = (enteredCode || '').trim().toUpperCase();
    if (!cleanCode) {
      return { ok: false, message: 'Please enter a valid Unique ID.' };
    }

    // Find if this unique ID exists for THIS COURSE and is ACTIVE
    const matchedCustomer = customers.find(c => 
      c.courseId === courseId && 
      c.status === 'active' &&
      c.uniqueId && 
      c.uniqueId.toUpperCase() === cleanCode
    );

    if (matchedCustomer) {
      // Unlock this course!
      const updated = Array.from(new Set([...unlockedCourseIds, courseId]));
      setUnlockedCourseIds(updated);
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(updated));
      } catch {}

      // If customer record doesn't have the user's phone or email, update it
      if (currentUser?.email && (!matchedCustomer.email || matchedCustomer.email !== currentUser.email)) {
        updateCustomer(matchedCustomer.id, {
          email: currentUser.email,
          phone: currentUser.phone || matchedCustomer.phone,
          name: currentUser.name || matchedCustomer.name
        });
      }

      return {
        ok: true,
        message: `Success! You have unlocked ${matchedCustomer.courseTitle || 'the course'}.`
      };
    }

    // Check if the code was meant for a different course
    const differentCourseCustomer = customers.find(c => 
      c.status === 'active' && 
      c.uniqueId && 
      c.uniqueId.toUpperCase() === cleanCode
    );
    if (differentCourseCustomer) {
      return {
        ok: false,
        message: `This Unique ID is for "${differentCourseCustomer.courseTitle}", not for this course. Unique IDs are strictly course-specific.`
      };
    }

    // Check if there is a pending request with this code or not yet approved
    const isPending = customers.some(c => 
      c.courseId === courseId && 
      c.status === 'pending' && 
      currentUser && 
      c.email === currentUser.email
    );
    if (isPending) {
      return {
        ok: false,
        message: 'Your enrollment request is pending approval by Admin. You will receive your code in Notifications once approved.'
      };
    }

    return {
      ok: false,
      message: 'Invalid Unique ID for this course. Please contact Admin or submit an access request.'
    };
  };

  // Get user-specific notifications
  const userNotifications = notifications.filter(n => {
    if (!currentUser) return false;
    const userEmail = (currentUser.email || '').toLowerCase();
    const userPhoneClean = (currentUser.phone || '').replace(/\D/g, '');
    const notifPhoneClean = (n.userPhone || '').replace(/\D/g, '');

    const matchEmail = n.userEmail && n.userEmail.toLowerCase() === userEmail;
    const matchPhone = notifPhoneClean && userPhoneClean && notifPhoneClean === userPhoneClean;
    return matchEmail || matchPhone;
  });

  const markNotificationRead = (notifId) => {
    const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    persistNotifications(updated);
  };

  // Login student directly with ANY of their valid Unique IDs and unlock ALL courses they enrolled in
  const loginWithUniqueId = (enteredCode) => {
    const cleanCode = (enteredCode || '').trim().toUpperCase();
    if (!cleanCode) {
      return { ok: false, message: 'Please enter your 5–6 character Unique ID.' };
    }

    const matchedCustomer = customers.find(c => 
      c.status === 'active' && 
      c.uniqueId && 
      c.uniqueId.toUpperCase() === cleanCode
    );

    if (!matchedCustomer) {
      // Check if there is a pending request with this code or not approved yet
      const isPending = customers.some(c => 
        c.status === 'pending' && 
        (c.uniqueId === cleanCode || (c.email && c.email.toLowerCase() === cleanCode.toLowerCase()))
      );
      if (isPending) {
        return {
          ok: false,
          message: 'Your access request is currently pending admin approval. You can log in once approved.'
        };
      }
      return {
        ok: false,
        message: 'Invalid Unique ID. Please check your code or request course access.'
      };
    }

    // Find student identifiers
    const studentEmail = (matchedCustomer.email || '').toLowerCase();
    const studentPhone = (matchedCustomer.phone || '').replace(/\D/g, '');

    // Find ALL active courses this student has taken
    const allEnrolledCourses = customers.filter(c => 
      c.status === 'active' && 
      ((c.email && c.email.toLowerCase() === studentEmail) ||
       (c.phone && studentPhone && c.phone.replace(/\D/g, '') === studentPhone))
    );

    const enrolledCourseIds = allEnrolledCourses.map(c => c.courseId).filter(Boolean);

    // Unlock ALL of this student's courses!
    setUnlockedCourseIds(prev => {
      const combined = Array.from(new Set([...prev, ...enrolledCourseIds]));
      try {
        localStorage.setItem(UNLOCKED_COURSES_KEY_PREFIX + (matchedCustomer.id || studentEmail), JSON.stringify(combined));
      } catch {}
      return combined;
    });

    // Find matching user from allUsers or construct one
    const matchedUser = (allUsers || []).find(u => 
      (u.email && u.email.toLowerCase() === studentEmail) ||
      (u.phone && studentPhone && u.phone.replace(/\D/g, '') === studentPhone)
    );

    const userToLogin = {
      id: matchedUser?.id || matchedCustomer.id,
      name: matchedCustomer.name || matchedUser?.name || 'Student',
      email: matchedCustomer.email || matchedUser?.email || '',
      phone: matchedCustomer.phone || matchedUser?.phone || '',
      password: matchedUser?.password || matchedCustomer.password || '',
      role: 'user',
      avatar: matchedUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(matchedCustomer.name || 'Student')}`,
      is2FAVerified: true,
      loginMethod: 'unique_id'
    };

    if (loginDirectly) {
      loginDirectly(userToLogin);
    }

    return {
      ok: true,
      user: userToLogin,
      enrolledCourseIds,
      enrolledCount: enrolledCourseIds.length,
      courseTitles: allEnrolledCourses.map(c => c.courseTitle).filter(Boolean),
      message: `Signed in successfully as ${userToLogin.name}! ${enrolledCourseIds.length} course(s) unlocked.`
    };
  };

  return (
    <EnrollmentContext.Provider
      value={{
        customers,
        notifications,
        userNotifications,
        unlockedCourseIds,
        isCourseUnlocked,
        verifyAndUnlock,
        submitAccessRequest,
        approveAccessRequest,
        rejectAccessRequest,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        generateUniqueCode,
        markNotificationRead,
        loginWithUniqueId
      }}
    >
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  return useContext(EnrollmentContext);
}

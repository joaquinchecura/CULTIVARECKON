import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn } = useClerkAuth();
  const clerk = useClerk();
  const [authError, setAuthError] = useState(null);

  // Simula el comportamiento de Base44: si no hay sesión, authError = auth_required
  useEffect(() => {
    if (isUserLoaded && !isSignedIn) {
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    } else {
      setAuthError(null);
    }
  }, [isUserLoaded, isSignedIn]);

  const isAuthenticated = !!isSignedIn;
  const isLoadingAuth = !isUserLoaded;
  const authChecked = isUserLoaded;

  const logout = () => {
    clerk.signOut();
  };

  const navigateToLogin = () => {
    clerk.redirectToSignIn();
  };

  const checkUserAuth = async () => {
    // Clerk maneja esto automáticamente, no hace falta hacer nada
  };

  const checkAppState = async () => {
    // No-op, Clerk no necesita esto
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
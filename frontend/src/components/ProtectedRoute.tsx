import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = () => {
      const userId = localStorage.getItem('userId');
      setIsLoggedIn(userId !== null);
      setIsLoading(false);
    };
    
    // Kontrollera initialt
    checkLoginStatus();
    
    // Lyssna på login status ändringar
    const handleLoginChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('loginStatusChanged', handleLoginChange);
    
    return () => {
      window.removeEventListener('loginStatusChanged', handleLoginChange);
    };
  }, []);

  // Visa loading medan vi kontrollerar
  if (isLoading) {
    return <div>Laddar...</div>;
  }
  
  if (!isLoggedIn) {
    // Omdirigera till login-sidan om användaren inte är inloggad
    return <Navigate to="/user/login" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;

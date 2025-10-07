import "./Header.css";
import logo from "../images/1cc7d577-c28b-480b-841d-c7b0d020a93d.png";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Kontrollera om användaren är inloggad
    const checkLoginStatus = () => {
      const userId = localStorage.getItem('userId');
      setIsLoggedIn(userId !== null);
    };
    
    // Kontrollera initialt
    checkLoginStatus();
    
    // Lyssna på localStorage ändringar
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    // Lyssna på storage events (från andra tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Lyssna på custom events (från samma tab)
    window.addEventListener('loginStatusChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginStatusChanged', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    // Trigga event för att uppdatera andra komponenter
    window.dispatchEvent(new CustomEvent('loginStatusChanged'));
    // Omdirigera till hem-sidan
    window.location.href = '/';
  };

  return (
    <div className="container-header">
      <div className="logo-container">
        <img src={logo} alt="logo" />
      </div>
      <div className="nav">
        <NavLink to={"/"}>Hem</NavLink>
        <NavLink to={"/product"}>Produkter</NavLink>
        {isLoggedIn && <NavLink to={"/cart"}>Varukorg</NavLink>}
        {!isLoggedIn ? (
          <>
            <NavLink to={"/user/register"}>Registrera dig</NavLink>
            <NavLink to={"/user/login"}>Logga in</NavLink>
          </>
        ) : (
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            Logga ut
          </button>
        )}
      </div>
    </div>
  );
}
export default Header;

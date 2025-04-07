import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../Navigation/Navigation';
import './Header.css';

function Header({ user, handleLogout, clearProgress }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleClearProgressClick = () => {
         if (window.confirm("Ви впевнені, що хочете очистити весь прогрес? Цю дію не можна скасувати.")) {
             clearProgress();
             setIsMenuOpen(false);
         }
    };

     const handleLogoutClick = () => {
        handleLogout();
        setIsMenuOpen(false);
     }

    return (
        <header className="header">
            <div className="header-content">
                 <h1>Мій Здоровий Спосіб Життя</h1>
                 {user && (
                     <button ref={buttonRef} className="menu-toggle-button" onClick={toggleMenu} aria-label="Відкрити/закрити меню">
                         <div className="menu-icon-bar"></div>
                         <div className="menu-icon-bar"></div>
                     </button>
                 )}
                 {!user && (
                     <Navigation user={user} />
                 )}
            </div>

            {isMenuOpen && user && (
                <div ref={menuRef} className="dropdown-menu">
                    <div className="menu-user-info">
                        Профіль: {user.email}
                    </div>
                    <Navigation user={user} inMenu={true} closeMenu={() => setIsMenuOpen(false)} />
                    <div className="menu-actions">
                         <button onClick={handleClearProgressClick} className="menu-button menu-button-danger">
                            Очистити прогрес
                         </button>
                         <button onClick={handleLogoutClick} className="menu-button">
                            Вийти
                         </button>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
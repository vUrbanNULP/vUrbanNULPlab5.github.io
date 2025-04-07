import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';
function Navigation({ user, inMenu = false, closeMenu = () => {} }) {
    const navigate = useNavigate();
    const handleNavClick = (path) => {
        navigate(path);
        closeMenu();
    };
    const listItems = (
        <>
            {user && (
                <>
                    {}
                    {inMenu ? (
                         <>
                           <li><button onClick={() => handleNavClick('/')}>Тренування</button></li>
                           <li><button onClick={() => handleNavClick('/progress')}>Мій Прогрес</button></li>
                           <li><button onClick={() => handleNavClick('/diet')}>Раціон</button></li>
                         </>
                    ) : (
                         <>
                            <li><Link to="/">Тренування</Link></li>
                            <li><Link to="/progress">Мій Прогрес</Link></li>
                            <li><Link to="/diet">Раціон</Link></li>
                          </>
                    )}
                </>
            )}
            {!user && !inMenu && (
                 <li><Link to="/login">Вхід / Реєстрація</Link></li>
            )}
        </>
    );
    if (inMenu) {
        return (
            <div className="navigation navigation-in-menu">
                 <ul>{listItems}</ul>
            </div>
        );
    } else {
        return (
            <nav className="navigation">
                <ul>{listItems}</ul>
            </nav>
        );
    }
}
export default Navigation;
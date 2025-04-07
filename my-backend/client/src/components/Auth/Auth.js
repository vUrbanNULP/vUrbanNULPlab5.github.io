import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import apiService from '../../api/apiService';
import './Auth.css';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Будь ласка, введіть email та пароль.');
            setLoading(false);
            return;
        }

        if (isLogin) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const firebaseUser = userCredential.user;
                console.log("Вхід через Firebase успішний, отримуємо ID токен...");

                const idToken = await firebaseUser.getIdToken(true);
                console.log("Отримано Firebase ID токен.");

                const response = await apiService.login(idToken);
                const { token: appToken, user: appUser } = response;
                localStorage.setItem('authToken', appToken);
                console.log("JWT додатка отримано з бекенду та збережено в localStorage.");

                navigate('/');

            } catch (err) {
                 console.error("Помилка входу:", err.code, err.message, err.response?.data);
                 if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                     setError('Неправильний email або пароль.');
                 }
                 else if (err.response?.data?.message) {
                    setError(`Помилка сервера: ${err.response.data.message}`);
                 }
                  else {
                    setError('Помилка входу. Спробуйте ще раз.');
                 }
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const response = await apiService.register(email, password);
                console.log("Виклик API реєстрації успішний:", response.message); // Використовуємо response.message якщо він є

                alert('Реєстрація успішна! Тепер ви можете увійти.');
                setIsLogin(true);

            } catch (err) {
                console.error("Помилка реєстрації:", err.code, err.message, err.response?.data);
                 if (err.response?.data?.message) {
                      if (err.response.status === 409) {
                          setError('Цей email вже використовується.');
                      } else if (err.response.status === 400) {
                          setError(err.response.data.message);
                      }
                       else {
                          setError(`Помилка реєстрації: ${err.response.data.message}`);
                      }
                 }
                 else {
                     setError('Помилка реєстрації. Спробуйте ще раз.');
                 }
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="auth-container">
            <h2>{isLogin ? 'Вхід' : 'Реєстрація'}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="button-primary" disabled={loading}>
                    {loading ? 'Обробка...' : (isLogin ? 'Увійти' : 'Зареєструватися')}
                </button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-button" disabled={loading}>
                {isLogin ? 'Немає акаунту? Зареєструватися' : 'Вже є акаунт? Увійти'}
            </button>
        </div>
    );
}

export default Auth;
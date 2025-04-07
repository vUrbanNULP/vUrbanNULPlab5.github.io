const express = require('express');
const jwt =require('jsonwebtoken');
const { authAdmin } = require('../firebaseAdmin');
const authenticateToken = require('../middleware/authenticateToken');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Потрібно вказати Email та пароль.' });
    }

    try {
        const userRecord = await authAdmin.createUser({
            email: email,
            password: password,
        });
        console.log('Користувача успішно зареєстровано:', userRecord.uid);
        res.status(201).json({ message: 'Користувача успішно створено', userId: userRecord.uid });
    } catch (error) {
        console.error('Помилка створення користувача:', error.message);
        if (error.code === 'auth/email-already-exists') {
           return res.status(409).json({ message: 'Цей email вже використовується.' });
        }
        if (error.code === 'auth/invalid-password') {
            return res.status(400).json({ message: 'Пароль повинен містити щонайменше 6 символів.' });
        }
        res.status(500).json({ message: 'Помилка створення користувача', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
         return res.status(400).json({ message: 'Необхідно надати Firebase ID Token.' });
    }

    try {
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        console.log(`Firebase ID Token перевірено для UID: ${uid}, Email: ${email}`);

        const payload = { uid: uid, email: email };
        const appToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
             message: 'Вхід успішний',
             token: appToken,
             user: { uid: uid, email: email }
            });

    } catch (error) {
        console.error('Помилка перевірки Firebase ID token або генерації токена додатка:', error);
         if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ message: 'Недійсний або прострочений Firebase токен.' });
         }
        res.status(500).json({ message: 'Автентифікація не вдалася', error: error.message });
    }
});

router.get('/profile', authenticateToken, (req, res) => {
    console.log('Доступ до профілю для користувача:', req.user.email);
    res.status(200).json({ user: req.user });
});


module.exports = router;
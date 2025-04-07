const express = require('express');
const { db, admin } = require('../firebaseAdmin');
const authenticateToken = require('../middleware/authenticateToken');
const { writeBatch } = require("firebase-admin/firestore");

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.uid;
    console.log(`Отримання логів тренувань для користувача ${userId}`);

    try {
        const logsQuery = db.collection('userWorkoutLogs')
                             .where('userId', '==', userId)
                             .orderBy('timestamp', 'desc');
        const snapshot = await logsQuery.get();

        if (snapshot.empty) {
            console.log(`Не знайдено логів тренувань для користувача ${userId}`);
            return res.status(200).json({});
        }

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        const groupedLogs = logs.reduce((acc, log) => {
            const type = log.workoutType || 'невідомий';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(log);
            return acc;
        }, {});

        console.log(`Повернення ${logs.length} логів, згрупованих за типом, для користувача ${userId}`);
        res.status(200).json(groupedLogs);

    } catch (error) {
        console.error('Помилка отримання логів тренувань:', error);
        res.status(500).json({ message: 'Не вдалося отримати логи тренувань', error: error.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.uid;
    const logData = req.body;
    console.log(`Додавання логу тренування для користувача ${userId}:`, logData);

    if (!logData || !logData.type || !logData.workoutType || !logData.startTime || !logData.endTime || !logData.duration || logData.durationSeconds == null || !logData.workoutDate) {
        return res.status(400).json({ message: 'Відсутні обов\'язкові поля логу тренування.' });
    }

    try {
        const logWithUser = {
            ...logData,
            userId: userId,
            timestamp: admin.firestore.Timestamp.now()
        };

        const docRef = await db.collection('userWorkoutLogs').add(logWithUser);
        console.log(`Лог тренування додано з ID: ${docRef.id} для користувача ${userId}`);
        res.status(201).json({ id: docRef.id, ...logWithUser });

    } catch (error) {
        console.error('Помилка додавання логу тренування:', error);
        res.status(500).json({ message: 'Не вдалося додати лог тренування', error: error.message });
    }
});

router.delete('/', authenticateToken, async (req, res) => {
    const userId = req.user.uid;
    console.log(`Спроба очистити логи тренувань для користувача ${userId}`);

    try {
        const logsQuery = db.collection('userWorkoutLogs').where('userId', '==', userId);
        const snapshot = await logsQuery.get();

        if (snapshot.empty) {
            console.log(`Немає логів тренувань для очищення для користувача ${userId}`);
            return res.status(200).json({ message: 'Очищено логи тренувань користувача' });
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        console.log(`Успішно очищено ${snapshot.size} логів тренувань для користувача ${userId}`);
        res.status(200).json({ message: `Успішно очищено ${snapshot.size} логів тренувань.` });

    } catch (error) {
        console.error('Помилка очищення логів тренувань:', error);
        res.status(500).json({ message: 'Не вдалося очистити логи тренувань', error: error.message });
    }
});

router.get('/programs', async (req, res) => {
    console.log("Отримання списку програм тренувань");
    try {
        const programsCol = db.collection('workoutPrograms');
        const programSnapshot = await programsCol.get();
        const programList = programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Повернення ${programList.length} програм тренувань`);
        res.status(200).json(programList);
    } catch (error) {
        console.error("Помилка отримання програм тренувань:", error);
        res.status(500).json({ message: 'Не вдалося отримати програми тренувань', error: error.message });
    }
});


module.exports = router;
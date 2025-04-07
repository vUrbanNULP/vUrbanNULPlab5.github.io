const express = require('express');
const { db, admin } = require('../firebaseAdmin');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  const dateString = req.query.date;

  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return res
      .status(400)
      .json({ message: 'Необхідний дійсний параметр запиту дати (YYYY-MM-DD).' });
  }

  console.log(`Отримання елементів дієти для користувача ${userId} на дату ${dateString}`);

  try {
    const selectedDate = new Date(dateString + 'T00:00:00Z');
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: 'Недійсний формат дати.' });
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const startTimestamp = admin.firestore.Timestamp.fromDate(startOfDay);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endOfDay);

    const dietQuery = db
      .collection('userDietItems')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startTimestamp)
      .where('timestamp', '<=', endTimestamp)
      .orderBy('timestamp', 'asc');

    const dietSnapshot = await dietQuery.get();
    const dietItems = dietSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      `Повернення ${dietItems.length} елементів дієти для користувача ${userId} на ${dateString}`
    );
    res.status(200).json(dietItems);
  } catch (error) {
    console.error('Помилка отримання елементів дієти:', error);
    res
      .status(500)
      .json({ message: 'Не вдалося отримати елементи дієти', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  const dietItemData = req.body;
  console.log(`Додавання елемента дієти для користувача ${userId}:`, dietItemData);

  if (!dietItemData || !dietItemData.name || dietItemData.calories == null) {
    return res
      .status(400)
      .json({ message: 'Відсутні обов\'язкові поля елемента дієти (назва, калорії).' });
  }

  const calories = Number(dietItemData.calories);
  if (isNaN(calories) || calories <= 0) {
    return res
      .status(400)
      .json({ message: 'Калорії повинні бути додатним числом.' });
  }

  try {
    const itemWithUser = {
      name: dietItemData.name,
      calories: calories,
      userId: userId,
      timestamp: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection('userDietItems').add(itemWithUser);
    console.log(`Елемент дієти додано з ID: ${docRef.id} для користувача ${userId}`);
    res.status(201).json({ id: docRef.id, ...itemWithUser });
  } catch (error) {
    console.error('Помилка додавання елемента дієти:', error);
    res
      .status(500)
      .json({ message: 'Не вдалося додати елемент дієти', error: error.message });
  }
});

module.exports = router;
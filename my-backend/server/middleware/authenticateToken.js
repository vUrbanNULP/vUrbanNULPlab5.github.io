const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('Токен автентифікації відсутній');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Помилка перевірки JWT:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    console.log('Токен перевірено для користувача:', user.email);
    next();
  });
}

module.exports = authenticateToken;
const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;

const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING;

if (serviceAccountJsonString) {
    console.log("Знайдено змінну середовища FIREBASE_SERVICE_ACCOUNT_JSON_STRING. Парсинг...");
    try {
        serviceAccount = JSON.parse(serviceAccountJsonString);
        console.log("Обліковий запис сервісу успішно розпарсено з JSON рядка.");
    } catch (error) {
        console.error("!!! Помилка парсингу JSON рядка облікового запису сервісу:", error);
        console.error("Отриманий рядок:", serviceAccountJsonString);
        process.exit(1);
    }
} else {
    console.log("FIREBASE_SERVICE_ACCOUNT_JSON_STRING не знайдено. Шукаємо FIREBASE_SERVICE_ACCOUNT_KEY_PATH...");
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    if (serviceAccountPath) {
        try {
            serviceAccount = require(serviceAccountPath);
            console.log(`Обліковий запис сервісу успішно завантажено зі шляху: ${serviceAccountPath}`);
        } catch (error) {
            console.error(`!!! Помилка завантаження облікового запису сервісу зі шляху (${serviceAccountPath}):`, error);
            process.exit(1);
        }
    } else {
        console.error("!!! Критична помилка: Жодна зі змінних середовища FIREBASE_SERVICE_ACCOUNT_JSON_STRING або FIREBASE_SERVICE_ACCOUNT_KEY_PATH не встановлена.");
        process.exit(1);
    }
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK успішно ініціалізовано.");
} catch (error) {
    console.error("!!! Помилка ініціалізації Firebase Admin SDK:", error);
    process.exit(1);
}

const db = admin.firestore();
const authAdmin = admin.auth();

module.exports = { db, authAdmin, admin };
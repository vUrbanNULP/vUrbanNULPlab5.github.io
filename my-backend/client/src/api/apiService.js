import App from "../App";

const productionApiUrl = process.env.REACT_APP_API_URL || '/api';
const localApiUrl = process.env.REACT_APP_LOCAL_API_URL;

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? (process.env.REACT_APP_API_URL || '/api')
  : (process.env.REACT_APP_LOCAL_API_URL || 'http://localhost:5000/api');

if (!API_BASE_URL) {
    console.warn("API_BASE_URL не вдалося визначити. За замовчуванням встановлено '/api'. Перевірте змінні середовища.");
}

console.log(`Використовується базовий URL API: ${API_BASE_URL}`);

const handleResponse = async (response) => {
    const requestInfo = `[Відповідь API] ${response.url} - Статус: ${response.status} ${response.statusText}`;

    if (response.ok) {
        const responseClone = response.clone();
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.indexOf("application/json") !== -1) {
            try {
                const data = await response.json();
                console.log(requestInfo, "-> OK (JSON)", data);
                return data;
            } catch (error) {
                console.warn(requestInfo, "-> OK, але не вдалося розпарсити тіло JSON. Content-Type:", contentType, "Помилка:", error);
                 try {
                    const textBody = await responseClone.text();
                    console.warn("Тіло відповіді (текст):", textBody);
                 } catch (textError) {
                    console.warn("Не вдалося прочитати тіло відповіді як текст з клону.");
                 }
                return { success: true, status: response.status, message: "Отримано тип контенту JSON, але не вдалося розпарсити тіло." };
            }
        } else {
             if (response.status === 200 || response.status === 204) {
                 console.log(requestInfo, "-> OK (Немає тіла JSON або Статус 204)");
                 return { success: true, status: response.status, message: response.statusText || 'Операція успішна' };
             } else {
                 console.log(requestInfo, "-> OK (Не JSON)", "Content-Type:", contentType || 'N/A');
                 return { success: true, status: response.status };
             }
        }
    } else {
        console.error(requestInfo, "-> ПОМИЛКА");
        const responseCloneForError = response.clone();
        let errorData = { message: `Запит не вдався зі статусом ${response.status}` };
        try {
            const errorJson = await response.json();
            errorData = { ...errorData, ...errorJson, status: response.status };
            console.error("Деталі помилки (JSON):", errorData);
        } catch (e) {
            console.error("Не вдалося розпарсити тіло помилки як JSON.");
             try {
                 const textBody = await responseCloneForError.text();
                 console.error("Тіло помилки (текст):", textBody);
                 errorData.rawError = textBody;
                 if (textBody && (!errorData.message || !errorData.message.includes(textBody))) {
                    errorData.message += ` Тіло: ${textBody.substring(0, 100)}${textBody.length > 100 ? '...' : ''}`;
                 }
             } catch (textError) {
                 console.error("Не вдалося прочитати тіло помилки як текст з клону.");
             }
        }
         const error = new Error(errorData.message || `HTTP помилка ${response.status}`);
         error.response = { data: errorData, status: response.status };
         throw error;
    }
};

const request = async (endpoint, method = 'GET', data = null, options = {}) => {
    if (!API_BASE_URL) {
        const errorMessage = "Неможливо виконати запит API, оскільки API_BASE_URL не встановлено.";
        console.error(`[Запит API] ${errorMessage}`);
        const error = new Error(errorMessage);
        error.response = { data: { message: errorMessage }, status: 500 };
        throw error;
    }

    const url = API_BASE_URL.replace(/\/$/, '') + '/' + endpoint.replace(/^\//, '');
    //const url = API_BASE_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);

    const config = {
        method: method,
        headers: {
            ...(data && !['GET', 'HEAD'].includes(method.toUpperCase()) && { 'Content-Type': 'application/json' }),
            ...options.headers,
        },
        ...options,
    };

    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    } else {
        if (!endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
             console.warn(`[Запит API] Токен автентифікації не знайдено в localStorage для запиту до ${endpoint}`);
        }
    }

    if (data && !['GET', 'HEAD'].includes(method.toUpperCase())) {
        try {
            config.body = JSON.stringify(data);
        } catch (error) {
            console.error("[Запит API] Не вдалося перетворити дані запиту в рядок:", data, error);
            const requestError = new Error("Не вдалося підготувати дані запиту.");
            requestError.cause = error;
            throw requestError;
        }
    }

    console.log(`[Запит API] ${method} ${url}`, data ? `Дані: ${config.body}` : '');

    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
           console.error(`[Запит API] Мережева помилка або проблема CORS для ${method} ${url}:`, error);
           const networkError = new Error(`Мережева помилка: Не вдалося підключитися до ${url}. Сервер запущено та CORS налаштовано?`);
           networkError.cause = error;
           networkError.response = { data: { message: networkError.message }, status: 0 };
           throw networkError;
        }
        console.error(`[Запит API] Помилка під час fetch або обробки відповіді для ${method} ${url}:`, error.response?.data || error.message, error);
        throw error;
    }
};


export const apiService = {
    register: (email, password) => request('/auth/register', 'POST', { email, password }),
    login: (idToken) => request('/auth/login', 'POST', { idToken }),
    getProfile: () => request('/auth/profile', 'GET'),

    getWorkoutPrograms: () => request('/workouts/programs', 'GET'),
    getGroupedWorkoutLogs: () => request('/workouts', 'GET'),
    addWorkoutLog: (logData) => request('/workouts', 'POST', logData),
    clearWorkoutLogs: () => request('/workouts', 'DELETE'),

    getDietItems: (dateString) => request(`/diet?date=${dateString}`, 'GET'),
    addDietItem: (itemData) => request('/diet', 'POST', itemData),
  };

  export default apiService;
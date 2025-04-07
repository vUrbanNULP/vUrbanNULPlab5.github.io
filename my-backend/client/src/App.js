import React, { useState, useCallback, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { auth } from './firebase/config';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import apiService from './api/apiService';
import Header from './components/Header/Header';
import WorkoutSection from './components/WorkoutSection/WorkoutSection';
import ProgressSection from './components/ProgressSection/ProgressSection';
import DietSection from './components/DietSection/DietSection';
import Footer from './components/Footer/Footer';
import Auth from './components/Auth/Auth';
import './App.css';

const formatDateForInput = (date) => {
  if (!date || isNaN(date.getTime())) {
    const today = new Date();
    const month = `${today.getMonth() + 1}`.padStart(2, '0');
    const day = `${today.getDate()}`.padStart(2, '0');
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
  }
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workoutLogGrouped, setWorkoutLogGrouped] = useState({});
  const [currentDiet, setCurrentDiet] = useState([]);
  const [workoutPrograms, setWorkoutPrograms] = useState([]);
  const [selectedDietDate, setSelectedDietDate] = useState(new Date());
  const [errorLoadingData, setErrorLoadingData] = useState(null);
  const [isInitialAuthCheckComplete, setIsInitialAuthCheckComplete] =
    useState(false);

  useEffect(() => {
    console.log('[Перевірка Автентифікації] Налаштування слухача onIdTokenChanged.');
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      console.log(
        '[Перевірка Автентифікації] Спрацював onIdTokenChanged. Користувач Firebase:',
        firebaseUser ? firebaseUser.email : 'null'
      );
      const storedToken = localStorage.getItem('authToken');
      console.log(
        '[Перевірка Автентифікації] Збережений authToken:',
        storedToken ? 'Існує' : 'Не знайдено'
      );

      if (firebaseUser && storedToken) {
        console.log(
          '[Перевірка Автентифікації] Користувач Firebase та токен знайдені. Перевірка токену через API...'
        );
        try {
          const profileResponse = await apiService.getProfile();
          console.log('[Перевірка Автентифікації] Відповідь API /profile:', profileResponse);

          if (profileResponse && profileResponse.user) {
            setUser(profileResponse.user);
            console.log(
              '[Перевірка Автентифікації] Стан користувача встановлено з профілю API:',
              profileResponse.user
            );
          } else {
            console.error(
              "[Перевірка Автентифікації] Відповідь API /profile не містить поля 'user':",
              profileResponse
            );
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } catch (error) {
          console.error(
            '[Перевірка Автентифікації] Помилка перевірки токену або помилка API:',
            error.response?.data || error.message,
            error
          );
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } else {
        console.log(
          '[Перевірка Автентифікації] Немає користувача Firebase або збереженого токену. Очищення стану користувача та даних.'
        );
        if (storedToken) {
          localStorage.removeItem('authToken');
        }
        setUser(null);
        setWorkoutLogGrouped({});
        setCurrentDiet([]);
        setWorkoutPrograms([]);
        setErrorLoadingData(null);
      }
      console.log('[Перевірка Автентифікації] Початкову перевірку автентифікації завершено.');
      setLoading(false);
      setIsInitialAuthCheckComplete(true);
    });

    return () => {
      console.log('[Перевірка Автентифікації] Відписка від onIdTokenChanged.');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      console.log('[Завантаження Даних] Спроба завантажити програми тренувань...');
      try {
        const programsResponse = await apiService.getWorkoutPrograms();
        console.log(
          '[Завантаження Даних] Отримана відповідь щодо програм тренувань:',
          programsResponse
        );
        setWorkoutPrograms(
          Array.isArray(programsResponse) ? programsResponse : []
        );
        if (!Array.isArray(programsResponse)) {
          console.warn(
            '[Завантаження Даних] Відповідь програм тренувань не була масивом:',
            programsResponse
          );
        }
      } catch (error) {
        console.error(
          '[Завантаження Даних] Помилка завантаження програм тренувань через API:',
          error.response?.data || error.message,
          error
        );
        setErrorLoadingData('Не вдалося завантажити програми тренувань.');
        setWorkoutPrograms([]);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    console.log(
      `[Ефект Даних Користувача] Перевірка умов. Користувач: ${
        user ? user.uid : 'null'
      }, ПеревіркаАвтентифікаціїЗавершена: ${isInitialAuthCheckComplete}`
    );
    if (user && user.uid && isInitialAuthCheckComplete) {
      console.log(
        `[Ефект Даних Користувача] Умови виконано для користувача ${
          user.uid
        }. Завантаження даних для дати: ${selectedDietDate.toLocaleDateString()}`
      );
      setErrorLoadingData(null);
      let fetchError = null;

      const fetchUserData = async () => {
        try {
          console.log('[Ефект Даних Користувача] Спроба завантажити журнали тренувань...');
          const logsResponse = await apiService.getGroupedWorkoutLogs();
          console.log(
            '[Ефект Даних Користувача] Отримана відповідь щодо журналів тренувань:',
            logsResponse
          );

          if (typeof logsResponse === 'object' && logsResponse !== null) {
            setWorkoutLogGrouped(logsResponse);
            console.log('[Ефект Даних Користувача] Оновлено стан згрупованих журналів тренувань.');
          } else {
            console.warn(
              '[Ефект Даних Користувача] Відповідь журналів тренувань не була об\'єктом:',
              logsResponse
            );
            setWorkoutLogGrouped({});
          }
        } catch (error) {
          console.error(
            '!!! [Ефект Даних Користувача] Помилка завантаження журналів тренувань:',
            error.response?.data || error.message,
            error
          );
          fetchError = 'Не вдалося завантажити журнал тренувань.';
          setWorkoutLogGrouped({});
        }

        try {
          const dateString = formatDateForInput(selectedDietDate);
          console.log(
            `[Ефект Даних Користувача] Спроба завантажити елементи дієти для ${dateString}...`
          );
          const dietResponse = await apiService.getDietItems(dateString);
          console.log(
            `[Ефект Даних Користувача] Отримана відповідь щодо елементів дієти для ${dateString}:`,
            dietResponse
          );

          if (Array.isArray(dietResponse)) {
            setCurrentDiet(dietResponse);
            console.log('[Ефект Даних Користувача] Оновлено стан елементів дієти.');
          } else {
            console.warn(
              `[Ефект Даних Користувача] Відповідь елементів дієти для ${dateString} не була масивом:`,
              dietResponse
            );
            setCurrentDiet([]);
          }
        } catch (error) {
          console.error(
            '!!! [Ефект Даних Користувача] Помилка завантаження елементів дієти:',
            error.response?.data || error.message,
            error
          );
          fetchError = fetchError
            ? `${fetchError} Також не вдалося завантажити раціон.`
            : 'Не вдалося завантажити раціон.';
          setCurrentDiet([]);
        }

        if (fetchError) {
          setErrorLoadingData(fetchError);
          console.log(
            '[Ефект Даних Користувача] Завершено завантаження даних з помилками:',
            fetchError
          );
        } else {
          console.log('[Ефект Даних Користувача] Завершено завантаження даних успішно.');
        }
      };

      fetchUserData();
    } else if (!user && isInitialAuthCheckComplete) {
      console.log(
        '[Ефект Даних Користувача] Користувач відсутній після перевірки автентифікації. Очищення даних користувача.'
      );
      setWorkoutLogGrouped({});
      setCurrentDiet([]);
      setErrorLoadingData(null);
    } else {
      console.log(
        `[Ефект Даних Користувача] Завантаження даних пропущено. Користувач: ${
          user ? user.uid : 'null'
        }, ПеревіркаАвтентифікаціїЗавершена: ${isInitialAuthCheckComplete}`
      );
    }
  }, [user, selectedDietDate, isInitialAuthCheckComplete]);

  const addWorkoutLogEntry = useCallback(
    async (logEntry) => {
      if (!user) {
        console.warn('ДодатиЗаписТренування: Користувач не автентифікований.');
        alert('Помилка: Користувач не автентифікований.');
        return;
      }
      console.log('[Виклик API] Спроба додати запис тренування:', logEntry);
      try {
        const newLog = await apiService.addWorkoutLog(logEntry);
        console.log('[Виклик API] Відповідь на додавання запису тренування:', newLog);

        if (
          !newLog ||
          !newLog.id ||
          !newLog.workoutType ||
          !newLog.timestamp
        ) {
          console.error(
            '[Виклик API] Отримано недійсний об\'єкт логу після додавання:',
            newLog
          );
          alert('Помилка: Отримано недійсні дані після збереження тренування.');
          return;
        }

        setWorkoutLogGrouped((prevGrouped) => {
          const type = newLog.workoutType;
          const currentLogs = prevGrouped[type] || [];
          if (currentLogs.some((log) => log.id === newLog.id)) {
            console.warn(
              `[Оновлення Стану] Лог з ID ${newLog.id} вже існує в стані. Оновлення пропущено.`
            );
            return prevGrouped;
          }
          const updatedGroup = [...currentLogs, newLog];
          updatedGroup.sort(
            (a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0)
          );
          console.log(
            `[Оновлення Стану] Оновлення журналів тренувань для типу '${type}'. Нова кількість: ${updatedGroup.length}`
          );
          return { ...prevGrouped, [type]: updatedGroup };
        });
      } catch (e) {
        console.error(
          '!!! [Виклик API] Помилка додавання запису тренування:',
          e.response?.data?.message || e.message,
          e
        );
        alert(
          `Помилка збереження тренування: ${
            e.response?.data?.message || e.message
          }`
        );
      }
    },
    [user]
  );

  const addDietItem = useCallback(
    async (dietItem) => {
      if (!user) {
        console.warn('ДодатиЕлементДієти: Користувач не автентифікований.');
        alert('Помилка: Користувач не автентифікований.');
        return;
      }
      console.log('[Виклик API] Спроба додати елемент дієти:', dietItem);
      try {
        const addedItem = await apiService.addDietItem(dietItem);
        console.log('[Виклик API] Відповідь на додавання елемента дієти:', addedItem);

        if (!addedItem || !addedItem.id || !addedItem.timestamp) {
          console.error(
            '[Виклик API] Отримано недійсний об\'єкт елемента дієти після додавання:',
            addedItem
          );
          alert('Помилка: Отримано недійсні дані після збереження продукту.');
          return;
        }

        const addedDate = new Date(addedItem.timestamp.seconds * 1000);
        const selectedDateStart = new Date(selectedDietDate);
        selectedDateStart.setHours(0, 0, 0, 0);
        const selectedDateEnd = new Date(selectedDietDate);
        selectedDateEnd.setHours(23, 59, 59, 999);

        if (addedDate >= selectedDateStart && addedDate <= selectedDateEnd) {
          console.log(
            `[Оновлення Стану] Доданий елемент дієти (${addedItem.id}) відповідає вибраній даті. Оновлення стану.`
          );
          setCurrentDiet((prevDiet) => {
            if (prevDiet.some((item) => item.id === addedItem.id)) {
              console.warn(
                `[Оновлення Стану] Елемент дієти з ID ${addedItem.id} вже існує в стані. Оновлення пропущено.`
              );
              return prevDiet;
            }
            return [...prevDiet, addedItem].sort(
              (a, b) => (a.timestamp?.seconds ?? 0) - (b.timestamp?.seconds ?? 0)
            );
          });
        } else {
          console.log(
            `[Оновлення Стану] Доданий елемент дієти (${
              addedItem.id
            }) для іншої дати (${addedDate.toLocaleDateString()}). Не оновлюємо поточний стан дієти для ${selectedDietDate.toLocaleDateString()}.`
          );
        }
      } catch (e) {
        console.error(
          '!!! [Виклик API] Помилка додавання елемента дієти:',
          e.response?.data?.message || e.message,
          e
        );
        alert(
          `Помилка збереження продукту: ${
            e.response?.data?.message || e.message
          }`
        );
      }
    },
    [user, selectedDietDate]
  );

  const clearProgress = useCallback(async () => {
    if (!user) {
      console.warn('ОчиститиПрогрес: Користувач не автентифікований.');
      alert('Помилка: Користувач не автентифікований.');
      return;
    }
    console.log(
      `[Виклик API] Спроба очистити прогрес тренування через DELETE /workouts для користувача: ${user.uid}`
    );
    try {
      const response = await apiService.clearWorkoutLogs();
      console.log(
        '[Виклик API] Відповідь на очищення даних (через DELETE /workouts):',
        response
      );

      setWorkoutLogGrouped({});

      console.log(
        '[Оновлення Стану] Прогрес тренувань очищено.'
      );
      const successMessage =
        response?.message ||
        'Весь прогрес успішно очищено.';
      alert(successMessage);
    } catch (error) {
      console.error(
        '!!! [Виклик API] Помилка очищення даних користувача через DELETE /workouts:',
        error.response?.data?.message || error.message,
        error
      );
      alert(
        `Не вдалося очистити прогрес: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    console.log('[Вихід] Ініціювання виходу...');
    localStorage.removeItem('authToken');
    console.log('[Вихід] Токен автентифікації видалено з localStorage.');
    signOut(auth)
      .then(() => {
        console.log('[Вихід] Вихід з Firebase успішний.');
      })
      .catch((error) => {
        console.error('[Вихід] Помилка виходу з Firebase:', error);
        setUser(null);
        setWorkoutLogGrouped({});
        setCurrentDiet([]);
      })
      .finally(() => {
      });
  }, []);

  const handleDietDateChange = (newDateString) => {
    console.log('[Дата Дієти] Дата змінена на:', newDateString);
    const newDate = new Date(newDateString);
    if (!isNaN(newDate.getTime())) {
      const currentSelectedDate = new Date(selectedDietDate);
      currentSelectedDate.setHours(0, 0, 0, 0);
      newDate.setHours(0, 0, 0, 0);

      if (newDate.getTime() !== currentSelectedDate.getTime()) {
        console.log('[Дата Дієти] Встановлення нового стану вибраної дати:', newDate);
        setSelectedDietDate(new Date(newDateString));
      } else {
        console.log(
          '[Дата Дієти] Нова дата така ж, як поточна вибрана дата. Зміна стану не потрібна.'
        );
      }
    } else {
      console.error('[Дата Дієти] Отримано недійсний рядок дати:', newDateString);
    }
  };

  if (loading) {
    return <div>Перевірка автентифікації...</div>;
  }

  console.log(
    '[Рендер] Рендеринг компонента App. Користувач:',
    user?.uid,
    'Завантаження:',
    loading,
    'ПеревіркаАвтентифікаціїЗавершена:',
    isInitialAuthCheckComplete
  );
  console.log('[Рендер] Поточний Стан - workoutLogGrouped:', workoutLogGrouped);
  console.log('[Рендер] Поточний Стан - currentDiet:', currentDiet);
  console.log('[Рендер] Поточний Стан - workoutPrograms:', workoutPrograms);

  return (
    <Router>
      <div className="app">
        <Header
          user={user}
          handleLogout={handleLogout}
          clearProgress={clearProgress}
        />
        <main className="main-content">
          {errorLoadingData && (
            <div className="error-message data-loading-error">
              {errorLoadingData}
            </div>
          )}

          <Routes>
            <Route
              path="/login"
              element={!user ? <Auth /> : <Navigate to="/" replace />}
            />

            <Route
              path="/"
              element={
                user ? (
                  <WorkoutSectionContainer
                    addWorkoutLogEntry={addWorkoutLogEntry}
                    workoutPrograms={workoutPrograms}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/progress"
              element={
                user ? (
                  <ProgressSectionContainer
                    workoutLogGrouped={workoutLogGrouped}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/diet"
              element={
                user ? (
                  <DietSectionContainer
                    currentDiet={currentDiet}
                    addDietItem={addDietItem}
                    selectedDate={selectedDietDate}
                    onDateChange={handleDietDateChange}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="*"
              element={<Navigate to={user ? '/' : '/login'} replace />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function WorkoutSectionContainer({ addWorkoutLogEntry, workoutPrograms }) {
  return (
    <WorkoutSection
      addWorkoutLogEntry={addWorkoutLogEntry}
      workoutPrograms={workoutPrograms}
    />
  );
}

function ProgressSectionContainer({ workoutLogGrouped }) {
  return <ProgressSection workoutLogGrouped={workoutLogGrouped} />;
}

function DietSectionContainer({
  currentDiet,
  addDietItem,
  selectedDate,
  onDateChange,
}) {
  return (
    <DietSection
      currentDiet={currentDiet}
      addDietItem={addDietItem}
      selectedDate={selectedDate}
      onDateChange={onDateChange}
    />
  );
}

export default App;
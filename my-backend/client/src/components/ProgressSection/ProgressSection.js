import React, { useState, useMemo } from 'react';
import WorkoutLog from './WorkoutLog/WorkoutLog';
import ProgressGraph from './ProgressGraph/ProgressGraph';
import './ProgressSection.css';

const getTimestampMs = (timestamp) => {
    if (!timestamp) {
        return null;
    }
    if (typeof timestamp.seconds === 'number') {
        return timestamp.seconds * 1000;
    }
    if (typeof timestamp._seconds === 'number') {
        return timestamp._seconds * 1000;
    }
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.getTime();
        }
    }
    if (timestamp instanceof Date) {
         if (!isNaN(timestamp.getTime())) {
             return timestamp.getTime();
         }
    }
    return null;
};


function ProgressSection({ workoutLogGrouped }) {
    console.log("[СекціяПрогресу] Отримані props - workoutLogGrouped:", workoutLogGrouped);

    const [isLogVisible, setIsLogVisible] = useState(false);

    const toggleLogVisibility = () => {
        setIsLogVisible(!isLogVisible);
    };

    const flatWorkoutLog = useMemo(() => {
        console.log("[СекціяПрогресу] Обчислення flatWorkoutLog з:", workoutLogGrouped);
        if (typeof workoutLogGrouped !== 'object' || workoutLogGrouped === null) {
            console.warn("[СекціяПрогресу] workoutLogGrouped не є об'єктом, повертаємо порожній масив для плоского журналу.");
            return [];
        }
        try {
            const flatLog = Object.values(workoutLogGrouped)
                   .flat()
                   .sort((a, b) => (getTimestampMs(b?.timestamp) ?? 0) - (getTimestampMs(a?.timestamp) ?? 0));
            console.log("[СекціяПрогресу] Обчислений flatWorkoutLog:", flatLog);
            return flatLog;
        } catch (error) {
            console.error("[СекціяПрогресу] Помилка обчислення flatWorkoutLog:", error);
            return [];
        }
    }, [workoutLogGrouped]);

    const chartData = useMemo(() => {
        console.log("[СекціяПрогресу] Обчислення chartData з:", workoutLogGrouped);
        if (typeof workoutLogGrouped !== 'object' || workoutLogGrouped === null || Object.keys(workoutLogGrouped).length === 0) {
            console.log("[СекціяПрогресу] workoutLogGrouped порожній або недійсний, повертаємо порожні дані для діаграми.");
            return { labels: [], datasets: [] };
        }

        try {
            const today = new Date();
            const labels = [];
            const last7DaysTimestampsStart = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                labels.push(date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }));
                date.setHours(0, 0, 0, 0);
                last7DaysTimestampsStart.push(date.getTime());
            }
            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            const dailyDurationsByType = {};
            labels.forEach(label => dailyDurationsByType[label] = {});

            const workoutTypes = Object.keys(workoutLogGrouped);
            console.log("[СекціяПрогресу Діаграма] Знайдені типи тренувань:", workoutTypes);

            labels.forEach(label => {
                workoutTypes.forEach(type => {
                    dailyDurationsByType[label][type] = 0;
                });
            });

            Object.entries(workoutLogGrouped).forEach(([type, logs]) => {
                 if (!Array.isArray(logs)) {
                    console.warn(`[СекціяПрогресу Діаграма] Логи для типу '${type}' не є масивом:`, logs);
                    return;
                 }
                logs.forEach((logEntry, index) => {
                    if (!logEntry || typeof logEntry !== 'object') {
                        console.warn(`[СекціяПрогресу Діаграма] Недійсний запис журналу за індексом ${index} для типу '${type}':`, logEntry);
                        return;
                    }

                    const logTimestampMs = getTimestampMs(logEntry.timestamp);

                    if (logTimestampMs === null) {
                        console.warn(`[СекціяПрогресу Діаграма] Не вдалося розпарсити дійсну мітку часу з запису журналу (тип: ${type}, індекс: ${index}):`, logEntry.timestamp, "Повний лог:", logEntry);
                        return;
                    }

                    if (logTimestampMs < last7DaysTimestampsStart[0] || logTimestampMs > endOfToday.getTime()) {
                        return;
                    }

                    const logDate = new Date(logTimestampMs);
                    const logDateString = logDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });

                    if (dailyDurationsByType[logDateString] !== undefined) {
                        const duration = logEntry.durationSeconds ?? 0;
                        if (typeof duration !== 'number' || duration < 0) {
                           console.warn(`[СекціяПрогресу Діаграма] Недійсний або відсутній durationSeconds у записі журналу (тип: ${type}, індекс: ${index}):`, logEntry);
                        }
                        if (dailyDurationsByType[logDateString][type] === undefined) {
                            dailyDurationsByType[logDateString][type] = 0;
                        }
                        dailyDurationsByType[logDateString][type] += Math.max(0, duration);
                    } else {
                        console.warn(`[СекціяПрогресу Діаграма] Обчислений рядок дати ${logDateString} не знайдено в мітках для логу:`, logEntry);
                    }
                });
            });

            console.log("[СекціяПрогресу Діаграма] Обчислені щоденні тривалості:", dailyDurationsByType);

            const datasets = workoutTypes.map((type, index) => {
                const backgroundColor = [
                    'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'
                ][index % 6];
                const borderColor = backgroundColor.replace('0.6', '1');

                return {
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    data: labels.map(label => dailyDurationsByType[label]?.[type] || 0),
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1,
                };
            });

            const filteredDatasets = datasets.filter(ds => ds.data.some(d => d > 0));
            console.log("[СекціяПрогресу Діаграма] Фінальні набори даних для діаграми (відфільтровані):", filteredDatasets);

            return {
                labels: labels,
                datasets: filteredDatasets,
            };
        } catch (error) {
            console.error("[СекціяПрогресу] Помилка обчислення chartData:", error);
            return { labels: [], datasets: [] };
        }
    }, [workoutLogGrouped]);

    return (
        <section id="progress" className="progress-section">
            <h2>Мій Прогрес</h2>
            <p>Тут відображається ваша статистика тренувань за останні 7 днів.</p>

            {chartData.datasets.length > 0 ? (
                 <ProgressGraph chartData={chartData} />
             ) : (
                 <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    {Object.keys(workoutLogGrouped).length > 0
                        ? 'Немає даних тренувань для відображення на графіку за останні 7 днів.'
                        : 'Журнал тренувань порожній. Завершіть тренування, щоб побачити прогрес.'}
                 </p>
             )}

            <div className="toggle-log-button-container">
                <button id="toggle-log-button" className="button-primary" onClick={toggleLogVisibility}>
                    {isLogVisible ? 'Приховати журнал' : 'Показати журнал'}
                </button>
            </div>
            <WorkoutLog isVisible={isLogVisible} workoutLog={flatWorkoutLog} />
        </section>
    );
}

export default ProgressSection;
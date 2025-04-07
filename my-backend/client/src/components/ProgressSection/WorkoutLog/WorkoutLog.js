import React from 'react';
import './WorkoutLog.css';

function WorkoutLog({ isVisible, workoutLog }) {
    console.log("[ЖурналТренувань] Отримані props - isVisible:", isVisible, "workoutLog:", workoutLog);

    const formatLogTimestamp = (timestamp) => {
        if (!timestamp) return 'Н/Д';
        try {
            let date;
            if (timestamp.toDate) {
                date = timestamp.toDate();
            } else if (timestamp.seconds) {
                 date = new Date(timestamp.seconds * 1000);
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                 date = new Date(timestamp);
            }

            if (isNaN(date.getTime())) {
                console.warn("[ФорматЖурналуТренувань] Не вдалося розпарсити мітку часу в дійсну дату:", timestamp);
                return 'Недійсна дата';
            }
            return date.toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'medium' });
        } catch (e) {
            console.error("[ФорматЖурналуТренувань] Помилка форматування мітки часу:", timestamp, e);
            return 'Помилка формату';
        }
    };

    const isWorkoutLogArray = Array.isArray(workoutLog);
    if (!isWorkoutLogArray) {
        console.warn("[ЖурналТренувань] prop workoutLog не є масивом:", workoutLog);
    }

    return (
        <div id="workout-log" style={{ display: isVisible ? 'block' : 'none' }} className="workout-log">
            <h3>Журнал тренувань</h3>
            <ul id="log-list" className="log-list">
                {!isWorkoutLogArray || workoutLog.length === 0 ? (
                    <li>Журнал тренувань порожній або дані некоректні.</li>
                ) : (
                    workoutLog.map((logEntry, index) => {
                        if (!logEntry || typeof logEntry !== 'object') {
                             console.warn(`[ЖурналТренувань] Недійсний запис журналу за індексом ${index}:`, logEntry);
                             return <li key={`invalid-${index}`}>Некоректний запис у журналі</li>;
                        }
                        const keyId = logEntry.id || `log-${index}`;
                        if (!logEntry.id) {
                            console.warn(`[ЖурналТренувань] Запис журналу за індексом ${index} не має 'id'. Використовується індекс як ключ. Запис:`, logEntry);
                        }

                        const dateDisplay = logEntry.workoutDate
                                            ? new Date(logEntry.workoutDate + 'T00:00:00').toLocaleDateString('uk-UA')
                                            : formatLogTimestamp(logEntry.timestamp);
                        const typeDisplay = logEntry.type || 'Н/Д';
                        const workoutTypeDisplay = logEntry.workoutType || 'Н/Д';
                        const startTimeDisplay = logEntry.startTime || 'Н/Д';
                        const endTimeDisplay = logEntry.endTime || 'Н/Д';
                        const durationDisplay = logEntry.duration || 'Н/Д';

                        return (
                            <li key={keyId}>
                                Дата: {dateDisplay} |
                                Тренування: {typeDisplay} ({workoutTypeDisplay}) |
                                Час: {startTimeDisplay} - {endTimeDisplay} |
                                Тривалість: {durationDisplay}
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}

export default WorkoutLog;
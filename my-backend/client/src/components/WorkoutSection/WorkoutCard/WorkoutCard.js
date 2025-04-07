import React, { useState, useEffect } from 'react';
import './WorkoutCard.css';

function WorkoutCard({ workout, setCurrentWorkout, setWorkoutStartTime, currentWorkout, addWorkoutLogEntry }) {
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [buttonText, setButtonText] = useState('Почати тренування');
    const [descriptionText, setDescriptionText] = useState(workout.description);
    const originalDescription = workout.description;
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        if (currentWorkout && currentWorkout.title === workout.title) {
            setIsWorkoutActive(true);
            setButtonText('Зупинити тренування');
        } else {
            setIsWorkoutActive(false);
            setButtonText('Почати тренування');
            setStartTime(null);
        }
    }, [currentWorkout, workout.title]);

    const calculateWorkoutDuration = (start, end) => {
         try {
            const startTimeParts = start.split(':').map(Number);
            const endTimeParts = end.split(':').map(Number);

            const startTimeDate = new Date();
            startTimeDate.setHours(startTimeParts[0], startTimeParts[1], startTimeParts[2], 0);
            const endTimeDate = new Date();
            endTimeDate.setHours(endTimeParts[0], endTimeParts[1], endTimeParts[2], 0);

            let durationMs = endTimeDate - startTimeDate;
             if (durationMs < 0) {
                 durationMs += 24 * 60 * 60 * 1000;
             }

            const durationSec = Math.round(durationMs / 1000);
            const minutes = Math.floor(durationSec / 60);
            const seconds = durationSec % 60;
            return {
                durationString: `${minutes} хв ${seconds} сек`,
                durationSeconds: durationSec
            };
         } catch (e) {
            console.error("Помилка розрахунку тривалості:", e);
            return { durationString: "Помилка", durationSeconds: 0 };
         }
    };

    const handleStartStopWorkout = () => {
        const currentTime = new Date();
         const timeString = currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
         const dateString = currentTime.toLocaleDateString('uk-UA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('.').reverse().join('-');

        if (!isWorkoutActive) {
            setCurrentWorkout({ title: workout.title, type: workout.type });
            setWorkoutStartTime(timeString);
            setStartTime(timeString);
        } else {
            const endTime = timeString;
            if (!startTime) {
                 console.error("Неможливо зупинити тренування: час початку відсутній.");
                 alert("Помилка: Неможливо зупинити тренування, час початку відсутній.");
                 setCurrentWorkout(null);
                 setWorkoutStartTime(null);
                 return;
            }

            const { durationString, durationSeconds } = calculateWorkoutDuration(startTime, endTime);

            const logEntry = {
                type: workout.title,
                workoutType: workout.type,
                startTime: startTime,
                endTime: endTime,
                duration: durationString,
                durationSeconds: durationSeconds,
                workoutDate: dateString
            };

            addWorkoutLogEntry(logEntry);

            setCurrentWorkout(null);
            setWorkoutStartTime(null);
        }
    };

     const handleMouseOver = () => {
         setDescriptionText('Натисніть "Почати тренування", щоб розпочати!');
     };
     const handleMouseOut = () => {
         setDescriptionText(originalDescription);
     };

     const imagePath = workout.img ? `/img/${workout.img.replace(/^img\//, '')}` : null;

     return (
        <div className="workout-card">
            {imagePath && <img src={imagePath} alt={workout.title} />}
            <h3>{workout.title}</h3>
            <p>{descriptionText}</p>
            <button
                className={`workout-card-button ${isWorkoutActive ? 'active' : ''}`}
                onClick={handleStartStopWorkout}
                disabled={!!currentWorkout && currentWorkout.title !== workout.title}
            >
                {buttonText}
            </button>
        </div>
    );
}

export default WorkoutCard;
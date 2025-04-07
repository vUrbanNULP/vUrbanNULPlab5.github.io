import React from 'react';
import './CurrentWorkoutStatus.css';

function CurrentWorkoutStatus({ currentWorkout, workoutStartTime }) {
    return (
        <div id="current-workout-status" className="current-workout-status">
            {currentWorkout ? (
                <p>Поточне тренування: {currentWorkout.title}. Розпочато: {workoutStartTime}</p>
            ) : (
                <p>Тренування не розпочато.</p>
            )}
        </div>
    );
}

export default CurrentWorkoutStatus;
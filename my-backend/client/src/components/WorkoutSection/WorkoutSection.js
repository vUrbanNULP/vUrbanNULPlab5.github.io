import React, { useState, useEffect } from 'react';
import WorkoutCard from './WorkoutCard/WorkoutCard';
import CurrentWorkoutStatus from './CurrentWorkoutStatus/CurrentWorkoutStatus';
import './WorkoutSection.css';

function WorkoutSection({ addWorkoutLogEntry, workoutPrograms }) {
    const [currentWorkout, setCurrentWorkout] = useState(null);
    const [workoutStartTime, setWorkoutStartTime] = useState(null);
    const [filterType, setFilterType] = useState('всі');
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);

    useEffect(() => {
        console.log("Фільтрація програм тренувань. Фільтр:", filterType, "Програми:", workoutPrograms);
        const filtered = filterType === 'всі'
            ? workoutPrograms
            : workoutPrograms.filter(workout => workout.type === filterType);
        setFilteredWorkouts(filtered);
    }, [filterType, workoutPrograms]);

    const handleFilterChange = (event) => {
        setFilterType(event.target.value);
    };

    return (
        <section id="workouts" className="workout-section">
            <h2>Тренування</h2>
            <p>Перегляньте список тренувань, доступних для вашого рівня.</p>

            <div className="workout-filter">
                <label htmlFor="workout-type-filter">Фільтрувати за типом:</label>
                <select id="workout-type-filter" value={filterType} onChange={handleFilterChange}>
                    <option value="всі">Всі типи</option>
                    <option value="початківці">Для початківців</option>
                    <option value="кардіо">Кардіо</option>
                    <option value="силове">Силове</option>
                    <option value="йога">Йога</option>
                </select>
            </div>

             {workoutPrograms.length === 0 && <p>Завантаження програм тренувань...</p>}
             {workoutPrograms.length > 0 && filteredWorkouts.length === 0 && <p>Немає тренувань, що відповідають вибраному фільтру.</p>}

            <div className="workout-grid">
                {filteredWorkouts.map((workout) => (
                    <WorkoutCard
                        key={workout.id || workout.title}
                        workout={workout}
                        setCurrentWorkout={setCurrentWorkout}
                        setWorkoutStartTime={setWorkoutStartTime}
                        currentWorkout={currentWorkout}
                        addWorkoutLogEntry={addWorkoutLogEntry}
                    />
                ))}
            </div>

            <CurrentWorkoutStatus currentWorkout={currentWorkout} workoutStartTime={workoutStartTime} />
        </section>
    );
}

export default WorkoutSection;
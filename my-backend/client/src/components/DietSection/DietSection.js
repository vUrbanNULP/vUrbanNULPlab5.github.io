import React from 'react';
import DietForm from './DietForm/DietForm';
import DietList from './DietList/DietList';
import './DietSection.css';

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

function DietSection({ currentDiet, addDietItem, selectedDate, onDateChange }) {

    const handleDateInputChange = (event) => {
        onDateChange(event.target.value);
    };

     const displayDate = selectedDate && !isNaN(selectedDate.getTime())
        ? selectedDate.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });


    return (
        <section id="diet" className="diet-section">
            <h2>Раціон</h2>
            <p>Плануйте свій щоденний раціон та відслідковуйте калорії.</p>

            <div id="diet-form-container" className="diet-form-container">
                <h3>Додати продукт до раціону</h3>
                <DietForm onAddItem={addDietItem} />
            </div>

            <div id="diet-plan" className="diet-plan">
                 <h3 className="diet-plan-heading">Раціон за {displayDate}</h3>

                 <div className="diet-date-picker">
                     <label htmlFor="diet-date">Переглянути раціон за:</label>
                     <input
                         type="date"
                         id="diet-date"
                         name="diet-date"
                         value={formatDateForInput(selectedDate)}
                         onChange={handleDateInputChange}
                     />
                 </div>

                <DietList currentDiet={currentDiet} />
            </div>
        </section>
    );
}

export default DietSection;
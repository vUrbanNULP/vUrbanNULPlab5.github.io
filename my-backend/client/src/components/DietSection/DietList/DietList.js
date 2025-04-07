import React from 'react';
import './DietList.css';

function DietList({ currentDiet }) {
    console.log("[СписокДієти] Отримані props - currentDiet:", currentDiet);

    const isDietArray = Array.isArray(currentDiet);
    if (!isDietArray) {
        console.warn("[СписокДієти] prop currentDiet не є масивом:", currentDiet);
    }

    let totalCalories = 0;
    if (isDietArray && currentDiet.length > 0) {
        totalCalories = currentDiet.reduce((sum, item) => {
            if (!item || typeof item !== 'object') {
                console.warn("[СписокДієти Розрахунок] Недійсний елемент у масиві дієти:", item);
                return sum;
            }
            const calories = Number(item.calories);
            if (isNaN(calories)) {
                console.warn("[СписокДієти Розрахунок] Елемент має недійсні калорії:", item);
                return sum;
            }
            return sum + calories;
        }, 0);
    }
    console.log("[СписокДієти] Розраховано загальну кількість калорій:", totalCalories);

    return (
        <ul id="diet-list" className="diet-list-ul">
            {!isDietArray || currentDiet.length === 0 ? (
                <li>Ваш раціон на цю дату порожній або дані некоректні.</li>
            ) : (
                currentDiet.map((item, index) => {
                     if (!item || typeof item !== 'object') {
                         console.warn(`[СписокДієти] Недійсний елемент дієти за індексом ${index}:`, item);
                         return <li key={`invalid-diet-${index}`}>Некоректний запис у раціоні</li>;
                     }
                    const keyId = item.id || `diet-${index}`;
                     if (!item.id) {
                        console.warn(`[СписокДієти] Елемент дієти за індексом ${index} не має 'id'. Використовується індекс як ключ. Елемент:`, item);
                    }
                    const nameDisplay = item.name || 'N/A';
                    const caloriesDisplay = item.calories !== undefined && !isNaN(Number(item.calories)) ? Number(item.calories) : 'N/A';

                    return (
                        <li key={keyId}>
                            {nameDisplay} - {caloriesDisplay} калорій
                        </li>
                    );
                })
            )}
            {isDietArray && currentDiet.length > 0 && (
                <li className="total-calories">
                    Загальна кількість калорій: {totalCalories}
                </li>
            )}
        </ul>
    );
}

export default DietList;
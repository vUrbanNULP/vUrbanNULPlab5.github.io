import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './ProgressGraph.css';
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);
function ProgressGraph({ chartData }) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Тривалість тренувань (сек) за типами за останні 7 днів',
            },
            tooltip: {
                 callbacks: {
                     label: function(context) {
                         let label = context.dataset.label || '';
                         if (label) {
                             label += ': ';
                         }
                         if (context.parsed.y !== null) {
                             const totalSeconds = context.parsed.y;
                             const minutes = Math.floor(totalSeconds / 60);
                             const seconds = totalSeconds % 60;
                             label += `${minutes} хв ${seconds} сек`;
                         }
                         return label;
                     }
                 }
             }
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Тривалість (секунди)'
                },
                beginAtZero: true,
                 ticks: {
                     stepSize: 60,
                 }
            },
        },
    };
    return (
        <div id="progress-graph-container" className="progress-graph-container">
            <h3>Графік прогресу</h3>
            <div className="chart-wrapper">
                <Bar options={options} data={chartData} />
            </div>
        </div>
    );
}
export default ProgressGraph;
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default in form
    document.getElementById('date').valueAsDate = new Date();

    let categoryChartInstance = null;
    let predictionChartInstance = null;

    // Load initial data
    fetchDashboardData();

    // Handle form submission
    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const expense = {
            Description: document.getElementById('desc').value,
            Amount: parseFloat(document.getElementById('amount').value),
            Category: document.getElementById('category').value,
            Date: document.getElementById('date').value
        };

        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expense)
            });

            if (response.ok) {
                // Clear form
                document.getElementById('desc').value = '';
                document.getElementById('amount').value = '';
                
                // Show success (could be a nice toast notification)
                const btn = e.target.querySelector('button');
                const originalText = btn.textContent;
                btn.textContent = 'Added Successfully!';
                btn.style.background = 'var(--success)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);

                // Refresh data
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    });

    async function fetchDashboardData() {
        try {
            // Fetch insights
            const insightsRes = await fetch('/api/insights');
            const insights = await insightsRes.json();
            
            if (!insights.error) {
                updateInsights(insights);
                renderCategoryChart(insights.category_breakdown);
            }

            // Fetch predictions
            const predictionsRes = await fetch('/api/predict');
            const predictions = await predictionsRes.json();
            
            if (!predictions.error && Array.isArray(predictions)) {
                updatePredictions(predictions);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    }

    function updateInsights(insights) {
        document.getElementById('total-spent').textContent = `$${insights.total_spending.toFixed(2)}`;
        document.getElementById('avg-daily').textContent = `$${insights.avg_daily.toFixed(2)}`;

        // Find top category
        if (insights.category_breakdown && Object.keys(insights.category_breakdown).length > 0) {
            const topCat = Object.entries(insights.category_breakdown).reduce((a, b) => a[1] > b[1] ? a : b)[0];
            document.getElementById('top-category').textContent = topCat;
        }

        // Update suggestions
        const suggestionsDiv = document.getElementById('suggestions');
        if (insights.suggestions && insights.suggestions.length > 0) {
            suggestionsDiv.innerHTML = insights.suggestions.map(s => 
                `<div class="suggestion-item">${s}</div>`
            ).join('');
        } else {
            suggestionsDiv.innerHTML = '<p class="text-muted">Your spending looks healthy! No current alerts.</p>';
        }
    }

    function updatePredictions(predictions) {
        const predictionsList = document.getElementById('predictions-list');
        predictionsList.innerHTML = predictions.slice(0, 3).map(p => `
            <div class="prediction-item">
                <span>${new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span style="color: var(--warning); font-weight: 600;">$${p.predicted_amount.toFixed(2)}</span>
            </div>
        `).join('');

        renderPredictionChart(predictions);
    }

    function renderCategoryChart(categoryData) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        // Define theme colors
        const colors = [
            '#6366f1', // Primary
            '#ec4899', // Secondary
            '#8b5cf6', // Purple
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#06b6d4'  // Cyan
        ];

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#f8fafc',
                            padding: 20,
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    function renderPredictionChart(predictions) {
        const ctx = document.getElementById('predictionChart').getContext('2d');
        
        if (predictionChartInstance) {
            predictionChartInstance.destroy();
        }

        const labels = predictions.map(p => {
            const d = new Date(p.date);
            return `${d.getMonth()+1}/${d.getDate()}`;
        });
        const data = predictions.map(p => p.predicted_amount);

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)'); // warning color
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

        predictionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Predicted Spending ($)',
                    data: data,
                    borderColor: '#f59e0b',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4, // Smooth curve
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'Inter' },
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'Inter' }
                        }
                    }
                }
            }
        });
    }
});

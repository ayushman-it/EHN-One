document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle
    const menuToggle = document.querySelector('.layout-menu-toggle');
    const layoutMenu = document.getElementById('layout-menu');
    if (menuToggle && layoutMenu) {
        menuToggle.addEventListener('click', function() {
            layoutMenu.classList.toggle('show');
        });
    }

    // Menu items with submenus
    document.querySelectorAll('.menu-link.menu-toggle').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.closest('.menu-item');
            parent.classList.toggle('open');
        });
    });

    // Chart.js defaults
    Chart.defaults.font.family = "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.display = false;

    const primaryColor = '#7367f0';
    const successColor = '#28c76f';
    const dangerColor = '#ea5455';
    const warningColor = '#ff9f43';
    const infoColor = '#00cfe7';
    const borderColor = '#e7e7e7';

    // Revenue Growth Chart
    const revenueCtx = document.getElementById('revenueGrowthChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    data: [30, 45, 35, 50, 40, 60, 45],
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(115, 103, 240, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { display: false }
                    },
                    y: {
                        grid: { color: borderColor, drawBorder: false },
                        border: { display: false },
                        ticks: { display: false }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#333',
                        padding: 10,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        cornerRadius: 6
                    }
                }
            }
        });
    }

    // Earning Reports Chart
    const earningCtx = document.getElementById('earningReportsChart');
    if (earningCtx) {
        new Chart(earningCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Orders',
                    data: [30, 40, 45, 50, 49, 60, 70, 91, 85, 75, 65, 80],
                    backgroundColor: primaryColor,
                    borderRadius: 4,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#828697' }
                    },
                    y: {
                        grid: { color: borderColor, drawBorder: false },
                        border: { display: false },
                        ticks: { color: '#828697', stepSize: 25 }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#333',
                        padding: 10,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        cornerRadius: 6
                    }
                }
            }
        });
    }

    // Sales Last Month Chart (Donut)
    const salesCtx = document.getElementById('salesLastMonthChart');
    if (salesCtx) {
        new Chart(salesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [{
                    data: [44, 55, 41, 67, 22],
                    backgroundColor: [primaryColor, successColor, dangerColor, warningColor, infoColor],
                    borderWidth: 0,
                    spacing: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '68%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#333',
                        padding: 10,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        cornerRadius: 6
                    }
                }
            }
        });
    }

    // Project Status Chart (Line)
    const projectCtx = document.getElementById('projectStatusChart');
    if (projectCtx) {
        new Chart(projectCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                datasets: [
                    {
                        label: 'Donates',
                        data: [30, 40, 35, 50, 45],
                        borderColor: dangerColor,
                        backgroundColor: 'rgba(234, 84, 85, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0
                    },
                    {
                        label: 'Podcasts',
                        data: [20, 30, 45, 55, 60],
                        borderColor: successColor,
                        backgroundColor: 'rgba(40, 199, 111, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#828697', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: borderColor, drawBorder: false },
                        border: { display: false },
                        ticks: { color: '#828697', font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#333',
                        padding: 10,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        cornerRadius: 6
                    }
                }
            }
        });
    }
});

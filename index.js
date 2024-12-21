
const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const chartCanvas = document.getElementById('chartCanvas');
const chartTypeRadios = document.querySelectorAll('input[name="chartType"]');
let chartInstance = null;
let selectedChartType = 'bar'; // Default chart type is 'bar'

// Show the file explorer when the box is clicked
uploadBox.addEventListener('click', function () {
    fileInput.click(); // Trigger file input click
});

// Handle file input change event (file selected from file explorer)
fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        // Display file name
        fileNameDisplay.textContent = `Selected file: ${file.name}`;
        parseXLSX(file);
    }
});

// Handle dragover event (when the file is dragged over the div)
uploadBox.addEventListener('dragover', function (event) {
    event.preventDefault(); // Necessary to allow for a drop
    uploadBox.style.border = '2px dashed #4CAF50'; // Visual feedback
});

// Handle dragleave event (when the file leaves the div)
uploadBox.addEventListener('dragleave', function (event) {
    event.preventDefault();
    uploadBox.style.border = '2px dashed #ccc'; // Reset visual feedback
});

// Handle drop event (when the file is dropped into the div)
uploadBox.addEventListener('drop', function (event) {
    event.preventDefault(); // Prevent the file from being opened or downloaded automatically
    uploadBox.style.border = '2px dashed #ccc'; // Reset visual feedback

    // Get the dropped file
    const file = event.dataTransfer.files[0];

    if (file && file.name.endsWith('.xlsx')) {
        // Display the file name
        fileNameDisplay.textContent = `Dropped file: ${file.name}`;
        parseXLSX(file);
    } else {
        // If the file isn't XLSX, show an error
        fileNameDisplay.textContent = 'Please drop an XLSX file.';
    }
});

// Listen for changes on radio buttons to select chart type
chartTypeRadios.forEach(radio => {
    radio.addEventListener('change', function () {
        selectedChartType = document.querySelector('input[name="chartType"]:checked').value;

        // Regenerate the chart with the new selected type
        if (chartInstance) {
            chartInstance.destroy(); // Destroy the previous chart instance
        }
        generateChart(); // Generate a new chart with the selected type
    });
});

// Function to parse XLSX and generate chart
function parseXLSX(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, {
            type: 'binary'
        });
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
            generateChart(jsonData);
        }
    };

    reader.readAsBinaryString(file);
}

// Function to generate the chart
function generateChart(data) {
    // Dynamically get the first column for labels
    const labels = data.map(row => Object.values(row)[0]); // First column for x-axis labels
    const datasets = [];

    // Get all other columns for the data (except the first column, which is the label)
    const valueColumns = Object.keys(data[0]).slice(1); // Skipping the first column for the datasets

    // Create a dataset for each value column
    valueColumns.forEach((col, index) => {
        datasets.push({
            label: col,
            data: data.map(row => parseFloat(row[col]) || 0), // Handling potential NaN values
            backgroundColor: getRandomColor(),
            borderColor: getRandomColor(),
            borderWidth: 1
        });
    });

    // Destroy previous chart instance (if any)
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Create the new chart instance with the selected chart type
    chartInstance = new Chart(chartCanvas, {
        type: selectedChartType, // Dynamically change chart type based on the radio button
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return tooltipItem.raw;
                        }
                    }
                }
            },
            // Wait until chart is fully rendered to trigger the download
            animation: {
                onComplete: function () {
                    // Trigger chart download as image once the chart is fully rendered
                    chartCanvas.toBlob(function (blob) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'chart.png'; // File name for download
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    });
                }
            }
        }
    });
}

// Generate random color for each dataset
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Combined data structure for medication records
let medicationRecords = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initRecordsPage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load records
    loadAllRecords();
    
    // Set default date and render calendar
    setDefaultDate();
    renderCalendar();
});

// Initialize Records Page
function initRecordsPage() {
    // Set current year in footer
    document.querySelector('footer .bi-c-circle').nextElementSibling.textContent = 
        ` ${new Date().getFullYear()} Pill Reminder. All rights reserved.`;
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Set Up Event Listeners
function setupEventListeners() {
    // Responsive adjustments
    window.addEventListener('resize', handleResponsiveAdjustments);
    
    // Add keyboard support for date input
    document.getElementById('select-date').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            showRecords();
        }
    });
}

// Load All Records
function loadAllRecords() {
    // Load from pillReminderRecords
    const savedRecords = localStorage.getItem('pillReminderRecords');
    if (savedRecords) {
        try {
            medicationRecords = JSON.parse(savedRecords) || {};
        } catch (e) {
            console.error('Error loading saved records:', e);
        }
    }
    
    // Load current day data from pillReminderData
    const homepageData = localStorage.getItem('pillReminderData');
    if (homepageData) {
        try {
            const parsedData = JSON.parse(homepageData);
            if (parsedData.medications) {
                processHomepageData(parsedData.medications, {});
            }
        } catch (e) {
            console.error('Error loading homepage data:', e);
        }
    }

    // Refresh records display
    showRecords();
}

// Process Homepage Data into Records Format
function processHomepageData(medications, statusData) {
    const todayStr = formatDate(new Date());

    // Initialize today's records if not exists
    if (!medicationRecords[todayStr]) {
        medicationRecords[todayStr] = [];
    }

    // Clear existing homepage-sourced records for today
    medicationRecords[todayStr] = medicationRecords[todayStr].filter(record => record.source !== 'homepage');

    // Process each time period
    ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
        if (medications[todayStr] && medications[todayStr][timeOfDay]) {
            medications[todayStr][timeOfDay].forEach(med => {
                medicationRecords[todayStr].push({
                    id: med.id,
                    name: med.name,
                    time: med.time,
                    status: med.status || 'missed',
                    timeOfDay: timeOfDay,
                    timestamp: med.timestamp,
                    source: 'homepage'
                });
            });
        }
    });

    // Save records
    saveRecords();
}

// Set Default Date to Today
function setDefaultDate() {
    const today = new Date();
    const dateStr = formatDate(today);
    document.getElementById('select-date').value = dateStr;
    
    // Load today's records by default
    showRecords();
}

// Render Calendar
function renderCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    const monthYearDisplay = document.getElementById('calendar-month-year');
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear calendar
    calendarBody.innerHTML = '';
    
    // Get first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Create calendar rows
    let row = document.createElement('tr');
    let dayCount = 1;
    
    // Add empty cells for days before the first
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('td');
        cell.className = 'empty';
        row.appendChild(cell);
    }
    
    // Add days
    while (dayCount <= daysInMonth) {
        if (row.children.length === 7) {
            calendarBody.appendChild(row);
            row = document.createElement('tr');
        }
        
        const cell = document.createElement('td');
        const dateStr = formatDate(new Date(currentYear, currentMonth, dayCount));
        const records = medicationRecords[dateStr] || [];
        
        cell.innerHTML = `
            <div class="calendar-day">${dayCount}</div>
            <div class="calendar-records">
                ${records.map(r => `
                    <div>${r.name} (${r.status || 'No status'})</div>
                `).join('')}
            </div>
        `;
        
        if (records.length > 0) {
            cell.className = 'has-records';
        }
        
        cell.addEventListener('click', () => {
            document.getElementById('select-date').value = dateStr;
            showRecords();
        });
        
        row.appendChild(cell);
        dayCount++;
    }
    
    // Fill remaining cells
    while (row.children.length < 7) {
        const cell = document.createElement('td');
        cell.className = 'empty';
        row.appendChild(cell);
    }
    
    calendarBody.appendChild(row);
}

// Change Month
function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Format Date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Show Records for Selected Date
function showRecords() {
    const dateInput = document.getElementById('select-date');
    const dateStr = dateInput.value;
    const recordsContainer = document.getElementById('recorded-list');
    
    // Update calendar to match selected date
    const selectedDate = new Date(dateStr);
    currentMonth = selectedDate.getMonth();
    currentYear = selectedDate.getFullYear();
    renderCalendar();
    
    // Clear existing records
    recordsContainer.innerHTML = '';
    
    // Get records for selected date
    const records = medicationRecords[dateStr] || [];
    
    if (records.length === 0) {
        // Show empty state
        recordsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <h5>No records for this date</h5>
                <p>No medication records found for ${formatDisplayDate(dateStr)}</p>
            </div>
        `;
    } else {
        // Sort records by time
        records.sort((a, b) => {
            const timeA = a.time.replace(':', '');
            const timeB = b.time.replace(':', '');
            return timeA.localeCompare(timeB);
        });
        
        // Group records by timeOfDay
        const groupedRecords = {
            morning: [],
            afternoon: [],
            evening: []
        };
        
        records.forEach(record => {
            if (record.timeOfDay) {
                groupedRecords[record.timeOfDay].push(record);
            }
        });
        
        // Display records by timeOfDay
        ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
            if (groupedRecords[timeOfDay].length > 0) {
                const section = document.createElement('div');
                section.className = 'mb-3';
                section.innerHTML = `<h6 class="text-capitalize">${timeOfDay}</h6>`;
                
                groupedRecords[timeOfDay].forEach(record => {
                    const recordElement = createRecordElement(record);
                    section.appendChild(recordElement);
                });
                
                recordsContainer.appendChild(section);
            }
        });
    }
}

// Format Date for Display (e.g., "November 1, 2023")
function formatDisplayDate(dateStr) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

// Create Record Element
function createRecordElement(record) {
    const recordElement = document.createElement('div');
    recordElement.className = 'record-item';
    recordElement.setAttribute('data-id', record.id);
    
    // Status class based on record status
    const statusClass = record.status === 'taken' ? 'status-taken' : record.status === 'missed' ? 'status-missed' : '';
    const statusText = record.status ? record.status.toUpperCase() : 'NO STATUS';
    
    recordElement.innerHTML = `
        <div>
            <span class="fw-bold">${record.name}</span>
            ${record.source === 'homepage' && isToday(record.timestamp) ? '<span class="badge bg-info ms-2">Today</span>' : ''}
        </div>
        <div class="d-flex align-items-center gap-3">
            <span class="record-time">${formatTime(record.time)}</span>
            <span class="record-status ${statusClass}">${statusText}</span>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-secondary" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Edit record"
                        onclick="editRecord('${record.id}', '${record.name.replace(/'/g, "\\'")}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Delete record"
                        onclick="deleteRecord('${document.getElementById('select-date').value}', '${record.id}', '${record.name.replace(/'/g, "\\'")}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return recordElement;
}

// Check if Timestamp is Today
function isToday(timestamp) {
    const today = new Date();
    const recordDate = new Date(timestamp);
    return today.toDateString() === recordDate.toDateString();
}

// Format Time (e.g., "08:00" to "08:00 AM")
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
}

// Edit Record Function
function editRecord(id, name) {
    const dateStr = document.getElementById('select-date').value;
    const record = medicationRecords[dateStr]?.find(r => r.id == id);
    
    if (record) {
        const newName = prompt('Edit medication name:', record.name);
        if (newName && newName.trim() !== '') {
            record.name = newName.trim();
            
            const newStatus = prompt('Update status (taken/missed):', record.status);
            if (newStatus && ['taken', 'missed'].includes(newStatus.toLowerCase())) {
                record.status = newStatus.toLowerCase();
            }
            
            // Save and refresh
            saveRecords();
            showRecords();
            
            showAlert('Record updated successfully!', 'success');
        }
    } else {
        showAlert('Record not found!', 'danger');
    }
}

// Delete Record Function
function deleteRecord(dateStr, id, name) {
    if (confirm(`Are you sure you want to delete the record for ${name}?`)) {
        if (medicationRecords[dateStr]) {
            medicationRecords[dateStr] = medicationRecords[dateStr].filter(r => r.id != id);
            
            // If no more records for this date, remove the date entry
            if (medicationRecords[dateStr].length === 0) {
                delete medicationRecords[dateStr];
            }
            
            // Save and refresh
            saveRecords();
            showRecords();
            
            showAlert('Record deleted successfully!', 'success');
        }
    }
}

// Save Records to localStorage
function saveRecords() {
    localStorage.setItem('pillReminderRecords', JSON.stringify(medicationRecords));
}

// Show Alert Message
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error('Alert container not found');
        return;
    }
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Append to container
    alertContainer.appendChild(alertDiv);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.classList.add('fade');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}

// Handle Responsive Adjustments
function handleResponsiveAdjustments() {
    // Adjust card margins on smaller screens
    const cards = document.querySelectorAll('.card');
    const windowWidth = window.innerWidth;
    
    if (windowWidth < 768) {
        cards.forEach(card => {
            card.style.marginBottom = '1rem';
        });
        
        // Stack buttons vertically on small screens
        document.querySelectorAll('.btn-group').forEach(group => {
            group.classList.add('btn-group-vertical');
            group.classList.remove('btn-group');
        });
    } else {
        cards.forEach(card => {
            card.style.marginBottom = '1.5rem';
        });
        
        // Horizontal button groups on larger screens
        document.querySelectorAll('.btn-group-vertical').forEach(group => {
            group.classList.add('btn-group');
            group.classList.remove('btn-group-vertical');
        });
    }
}
document.addEventListener('languageChange', (e) => {
    if (typeof LanguageManager !== 'undefined') {
        LanguageManager.setLanguage(e.detail.language);
    }
});
// Initial responsive adjustments
handleResponsiveAdjustments();
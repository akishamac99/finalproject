// Medication data structure (daily, keyed by date)
let medications = {};

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initHomePage();
    
    // Load any saved data
    loadSavedData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set default times
    setDefaultTimes();
});

// Initialize Home Page
function initHomePage() {
    // Set current year in footer
    document.querySelector('footer .bi-c-circle').nextElementSibling.textContent = 
        ` ${new Date().getFullYear()} Pill Reminder. All rights reserved.`;
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Set aria-live attributes for dynamic content
    document.querySelectorAll('.medicine-list').forEach(list => {
        list.setAttribute('aria-live', 'polite');
    });
}

// Set Up Event Listeners
function setupEventListeners() {
    // Add keyboard support for inputs
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const timeOfDay = this.id.split('Medicine')[0];
                addMedicine(timeOfDay);
            }
        });
    });
    
    // Responsive adjustments
    window.addEventListener('resize', handleResponsiveAdjustments);
}

// Load Saved Data from localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('pillReminderData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            medications = parsedData.medications || {};
            
            // Get today's data
            const todayStr = formatDate(new Date());
            const todayMeds = medications[todayStr] || { morning: [], afternoon: [], evening: [] };
            
            // Render loaded medications
            ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
                todayMeds[timeOfDay].forEach(med => {
                    renderMedicineItem(timeOfDay, med);
                });
            });
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Save Data to localStorage
function saveData() {
    const dataToSave = { medications };
    localStorage.setItem('pillReminderData', JSON.stringify(dataToSave));
    // Sync with records
    syncWithRecords();
}

// Set Default Times for Medication Inputs
function setDefaultTimes() {
    // Morning default (8:00 AM)
    document.getElementById('morningTime').value = '08:00';
    // Afternoon default (1:00 PM)
    document.getElementById('afternoonTime').value = '13:00';
    // Evening default (8:00 PM)
    document.getElementById('eveningTime').value = '20:00';
}

// Add Medicine to a Time Period
function addMedicine(timeOfDay) {
    const medicineInput = document.getElementById(`${timeOfDay}Medicine`);
    const timeInput = document.getElementById(`${timeOfDay}Time`);
    const medicineName = medicineInput.value.trim();
    const medicineTime = timeInput.value;
    
    // Validate input
    if (!medicineName) {
        showAlert('Please enter a medicine name', 'danger');
        medicineInput.focus();
        return;
    }
    
    if (!medicineTime) {
        showAlert('Please select a time', 'danger');
        timeInput.focus();
        return;
    }
    
    // Get today's date
    const todayStr = formatDate(new Date());
    
    // Initialize today's medications if not exists
    if (!medications[todayStr]) {
        medications[todayStr] = { morning: [], afternoon: [], evening: [] };
    }
    
    // Create medicine object
    const medicine = {
        id: Date.now(),
        name: medicineName,
        time: medicineTime,
        timestamp: new Date().toISOString(),
        status: null // Initial status is null
    };
    
    // Add to medications array
    medications[todayStr][timeOfDay].push(medicine);
    
    // Render the new medicine
    renderMedicineItem(timeOfDay, medicine);
    
    // Clear the input
    medicineInput.value = '';
    medicineInput.focus();
    
    // Save to localStorage
    saveData();
    
    // Show success message
    showAlert(`${medicineName} added to ${timeOfDay} medications`, 'success');
}

// Render Medicine Item to the DOM
function renderMedicineItem(timeOfDay, medicine) {
    const list = document.getElementById(`${timeOfDay}List`);
    
    // Create medicine item element
    const item = document.createElement('div');
    item.className = 'medicine-item';
    item.setAttribute('data-id', medicine.id);
    item.innerHTML = `
        <div class="medicine-details" onclick="toggleMedicineExpansion('${timeOfDay}', ${medicine.id})">
            <div>
                <span class="fw-bold">${medicine.name}</span>
                ${medicine.status ? `<span class="ms-2 badge ${medicine.status === 'taken' ? 'bg-success' : 'bg-danger'}">${medicine.status.toUpperCase()}</span>` : ''}
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="medicine-time">${formatTime(medicine.time)}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); removeMedicine('${timeOfDay}', ${medicine.id}, '${medicine.name.replace(/'/g, "\\'")}')" 
                        aria-label="Remove ${medicine.name}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
        <div class="medicine-status" id="status-${medicine.id}">
            <span class="status-option taken ${medicine.status === 'taken' ? 'selected' : ''}" 
                  onclick="setMedicineStatus('${timeOfDay}', ${medicine.id}, 'taken')" 
                  role="button" tabindex="0">TAKEN</span>
            <span class="mx-2">|</span>
            <span class="status-option missed ${medicine.status === 'missed' ? 'selected' : ''}" 
                  onclick="setMedicineStatus('${timeOfDay}', ${medicine.id}, 'missed')" 
                  role="button" tabindex="0">MISSED</span>
        </div>
    `;
    
    // Add to the beginning of the list
    list.insertBefore(item, list.firstChild);
    
    // If list was empty, remove empty state
    if (list.querySelector('.empty-state')) {
        list.innerHTML = '';
        list.appendChild(item);
    }
}

// Toggle Medicine Expansion
function toggleMedicineExpansion(timeOfDay, id) {
    const statusDiv = document.getElementById(`status-${id}`);
    if (statusDiv.classList.contains('expanded')) {
        statusDiv.classList.remove('expanded');
    } else {
        // Collapse all other expanded items in the same time period
        document.querySelectorAll(`#${timeOfDay}List .medicine-status.expanded`).forEach(div => {
            div.classList.remove('expanded');
        });
        statusDiv.classList.add('expanded');
    }
}

// Set Medicine Status
function setMedicineStatus(timeOfDay, id, status) {
    const todayStr = formatDate(new Date());
    if (medications[todayStr] && medications[todayStr][timeOfDay]) {
        const medicine = medications[todayStr][timeOfDay].find(med => med.id === id);
        if (medicine) {
            medicine.status = status;
            
            // Update DOM
            const item = document.querySelector(`#${timeOfDay}List [data-id="${id}"]`);
            const details = item.querySelector('.medicine-details');
            const statusDiv = item.querySelector('.medicine-status');
            const nameSpan = details.querySelector('.fw-bold');
            
            // Update status badge
            const existingBadge = details.querySelector('.badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            const badge = document.createElement('span');
            badge.className = `ms-2 badge ${status === 'taken' ? 'bg-success' : 'bg-danger'}`;
            badge.textContent = status.toUpperCase();
            nameSpan.insertAdjacentElement('afterend', badge);
            
            // Update status buttons
            statusDiv.querySelectorAll('.status-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            statusDiv.querySelector(`.status-option.${status}`).classList.add('selected');
            
            // Save data
            saveData();
            
            // Show confirmation
            showAlert(`${medicine.name} marked as ${status}`, 'success');
        }
    }
}

// Remove Medicine from a Time Period
function removeMedicine(timeOfDay, id, name) {
    if (!confirm(`Are you sure you want to delete "${name}" from ${timeOfDay} medications?`)) {
        return;
    }
    
    const todayStr = formatDate(new Date());
    if (medications[todayStr]) {
        // Remove from array
        medications[todayStr][timeOfDay] = medications[todayStr][timeOfDay].filter(med => med.id !== id);
        
        // Remove from DOM
        const item = document.querySelector(`#${timeOfDay}List [data-id="${id}"]`);
        if (item) {
            item.remove();
        }
        
        // If list is now empty, show empty state
        const list = document.getElementById(`${timeOfDay}List`);
        if (list.children.length === 0) {
            showEmptyState(timeOfDay);
        }
        
        // Save to localStorage
        saveData();
        
        // Show confirmation
        showAlert(`"${name}" removed from ${timeOfDay} medications`, 'info');
    }
}

// Show Empty State for a Time Period
function showEmptyState(timeOfDay) {
    const list = document.getElementById(`${timeOfDay}List`);
    list.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-capsule"></i>
            <p>No medications scheduled</p>
        </div>`;
}

// Format Date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format Time (HH:MM to 12-hour format)
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
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

// Sync with Records
function syncWithRecords() {
    const todayStr = formatDate(new Date());
    let records = JSON.parse(localStorage.getItem('pillReminderRecords')) || {};

    if (!records[todayStr]) {
        records[todayStr] = [];
    }

    // Clear existing records for today to avoid duplicates
    records[todayStr] = [];

    // Add all medications for today
    if (medications[todayStr]) {
        ['morning', 'afternoon', 'evening'].forEach(timeOfDay => {
            medications[todayStr][timeOfDay].forEach(med => {
                records[todayStr].push({
                    id: med.id,
                    name: med.name,
                    dosage: '',
                    time: med.time,
                    status: med.status || 'missed',
                    timeOfDay: timeOfDay, // Explicitly set timeOfDay
                    source: 'homepage',
                    timestamp: med.timestamp
                });
            });
        });
    }

    // Save records to localStorage
    localStorage.setItem('pillReminderRecords', JSON.stringify(records));
}

// Helper to determine time of day for a given time
function timeOfDayForTime(time) {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
}

// Handle Responsive Adjustments
function handleResponsiveAdjustments() {
    const cards = document.querySelectorAll('.medication-card');
    const windowWidth = window.innerWidth;
    
    if (windowWidth < 768) {
        cards.forEach(card => {
            card.style.padding = '1rem';
        });
    } else {
        cards.forEach(card => {
            card.style.padding = '1.5rem';
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
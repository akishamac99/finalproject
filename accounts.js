// User data structure
let users = {};
let currentUser = null;

// Constants for validation
const MIN_PASSWORD_LENGTH = 8;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Show Alert Message
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error('Alert container not found');
        return;
    }

    while (alertContainer.firstChild) {
        alertContainer.removeChild(alertContainer.firstChild);
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150); // Wait for fade transition
    }, 5000);
}

// Load User Data from localStorage
function loadUserData() {
    try {
        const savedUsers = localStorage.getItem('pillReminderUsers');
        if (savedUsers) {
            users = JSON.parse(savedUsers) || {};
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showAlert('danger', 'Error loading saved data. Starting with fresh data.');
    }
}

// Save User Data to localStorage
function saveUserData() {
    try {
        localStorage.setItem('pillReminderUsers', JSON.stringify(users));
    } catch (e) {
        console.error('Error saving user data:', e);
        showAlert('danger', 'Failed to save user data.');
    }
}

// Check Login Status
function checkLoginStatus() {
    try {
        const loggedInUser = localStorage.getItem('pillReminderCurrentUser');
        if (loggedInUser && users[loggedInUser]) {
            currentUser = loggedInUser;
            showLoggedInState();
        } else {
            showLoggedOutState();
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        showAlert('warning', 'Error checking login status. Please try logging in again.');
    }
}

// Show Logged In State
function showLoggedInState() {
    try {
        const welcomeText = document.querySelector('.content-section h2');
        if (welcomeText) {
            welcomeText.innerHTML = `<i class="bi bi-person-check"></i> Welcome, ${currentUser}`;
        }

        const signInBtn = document.getElementById('signInBtn');
        if (signInBtn) {
            signInBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i> Sign Out';
            signInBtn.classList.remove('btn-primary');
            signInBtn.classList.add('btn-danger');
            // Remove existing listeners and reattach
            signInBtn.replaceWith(signInBtn.cloneNode(true));
            const newSignInBtn = document.getElementById('signInBtn');
            newSignInBtn.addEventListener('click', handleSignOut);
            newSignInBtn.disabled = false;
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }

        const passwordSection = document.querySelector('#current-password')?.closest('.content-section');
        if (passwordSection) {
            passwordSection.style.display = 'block';
        }

        showAlert('success', `Welcome back, ${currentUser}! You are now logged in.`);
    } catch (error) {
        console.error('Error showing logged in state:', error);
        showAlert('danger', 'Error updating login state. Please refresh the page.');
    }
}

// Show Logged Out State
function showLoggedOutState() {
    try {
        const authHeader = document.querySelector('.content-section .section-title:has(i.bi-key-fill)');
        if (authHeader) {
            authHeader.innerHTML = '<i class="bi bi-key-fill"></i> Account Authentication';
        }

        const welcomeText = document.querySelector('.content-section h2');
        if (welcomeText) {
            welcomeText.innerHTML = '<i class="bi bi-person"></i> Please Sign In or Register';
        }

        const signInBtn = document.getElementById('signInBtn');
        if (signInBtn) {
            signInBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
            signInBtn.classList.remove('btn-danger');
            signInBtn.classList.add('btn-primary');
            // Remove existing listeners and reattach
            signInBtn.replaceWith(signInBtn.cloneNode(true));
            const newSignInBtn = document.getElementById('signInBtn');
            newSignInBtn.classList.add('btn', 'btn-primary');
            newSignInBtn.addEventListener('click', handleSignIn);
            newSignInBtn.disabled = false; // Ensure button is enabled
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.style.display = 'block';
            registerBtn.disabled = false; // Ensure button is enabled
        }

        const passwordSection = document.querySelector('#current-password')?.closest('.content-section');
        if (passwordSection) {
            passwordSection.style.display = 'none';
        }

        const inputs = ['username', 'password', 'current-password', 'new-password', 'confirm-password'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
                input.classList.remove('is-invalid', 'was-validated');
            }
        });

        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.classList.remove('was-validated'));
    } catch (error) {
        console.error('Error showing logged out state:', error);
        showAlert('danger', 'Error updating logout state. Please refresh the page.');
    }
}

// Handle Sign In
function handleSignIn(e) {
    e.preventDefault();
    const button = e.target.closest('button'); // Ensure we target the button even if clicking child elements
    const originalText = button.innerHTML;

    try {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';

        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;

        if (!username || !password) {
            showAlert('danger', 'Please enter both username and password.');
            return;
        }

        if (!USERNAME_REGEX.test(username)) {
            showAlert('danger', 'Username must be 3-20 characters and contain only letters, numbers, or underscores.');
            return;
        }

        if (!users[username]) {
            showAlert('danger', 'Username not found. Please register first.');
            return;
        }

        if (users[username].password !== password) {
            showAlert('danger', 'Incorrect password. Please try again.');
            return;
        }

        currentUser = username;
        localStorage.setItem('pillReminderCurrentUser', currentUser);
        showLoggedInState();
    } catch (error) {
        console.error('Error during sign in:', error);
        showAlert('danger', 'Error signing in. Please try again.');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Handle Register
function handleRegister(e) {
    e.preventDefault();
    const button = e.target.closest('button');
    const originalText = button.innerHTML;

    try {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';

        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;

        if (!username || !password) {
            showAlert('danger', 'Please enter both username and password.');
            return;
        }

        if (!USERNAME_REGEX.test(username)) {
            showAlert('danger', 'Username must be 3-20 characters and contain only letters, numbers, or underscores.');
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            showAlert('danger', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            showAlert('danger', 'Password must include uppercase, lowercase, number, and special character.');
            return;
        }

        if (users[username]) {
            showAlert('danger', 'Username already exists. Please choose another.');
            return;
        }

        users[username] = {
            password: password,
            createdAt: new Date().toISOString(),
            medications: []
        };

        saveUserData();
        currentUser = username;
        localStorage.setItem('pillReminderCurrentUser', currentUser);
        showLoggedInState();
        showAlert('success', 'Account created successfully! You are now logged in.');
    } catch (error) {
        console.error('Error during registration:', error);
        showAlert('danger', 'Error registering. Please try again.');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Handle Sign Out
function handleSignOut(e) {
    e.preventDefault();
    const button = e.target.closest('button');
    const originalText = button.innerHTML;

    try {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing out...';

        currentUser = null;
        localStorage.removeItem('pillReminderCurrentUser');
        showLoggedOutState();
        showAlert('success', 'You have been successfully signed out.');
    } catch (error) {
        console.error('Error during sign out:', error);
        showAlert('danger', 'Error signing out. Please try again.');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Handle Password Change
function handlePasswordChange(e) {
    e.preventDefault();
    const inputs = {
        current: document.getElementById('current-password'),
        new: document.getElementById('new-password'),
        confirm: document.getElementById('confirm-password')
    };

    if (!inputs.current || !inputs.new || !inputs.confirm) {
        showAlert('danger', 'Password inputs not found.');
        return;
    }

    const currentPassword = inputs.current.value;
    const newPassword = inputs.new.value;
    const confirmPassword = inputs.confirm.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('danger', 'Please fill in all password fields.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('danger', 'New passwords do not match.');
        return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        showAlert('danger', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
        return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
        showAlert('danger', 'Password must include uppercase, lowercase, number, and special character.');
        return;
    }

    if (users[currentUser].password !== currentPassword) {
        showAlert('danger', 'Current password is incorrect.');
        return;
    }

    users[currentUser].password = newPassword;
    saveUserData();
    inputs.current.value = '';
    inputs.new.value = '';
    inputs.confirm.value = '';
    showAlert('success', 'Password changed successfully!');
}

// Handle Support Question
function handleSupportQuestion(e) {
    e.preventDefault();
    const questionInput = document.getElementById('question');
    if (!questionInput) {
        showAlert('danger', 'Question input not found.');
        return;
    }

    const question = questionInput.value.trim();
    if (!question) {
        showAlert('danger', 'Please enter your question.');
        return;
    }

    const questionEntry = {
        user: currentUser || 'anonymous',
        question,
        timestamp: new Date().toISOString()
    };

    try {
        const questionEntries = JSON.parse(localStorage.getItem('pillReminderQuestions') || '[]');
        questionEntries.push(questionEntry);
        localStorage.setItem('pillReminderQuestions', JSON.stringify(questionEntries));
        questionInput.value = '';
        showAlert('success', 'Your question has been submitted successfully!');
    } catch (e) {
        console.error('Error submitting question:', e);
        showAlert('danger', 'Failed to submit question.');
    }
}

// Handle Feedback
function handleFeedback(e) {
    e.preventDefault();
    const feedbackInput = document.getElementById('feedback');
    if (!feedbackInput) {
        showAlert('danger', 'Feedback input not found.');
        return;
    }

    const feedback = feedbackInput.value.trim();
    if (!feedback) {
        showAlert('danger', 'Please enter your feedback.');
        return;
    }

    const feedbackEntry = {
        user: currentUser || 'anonymous',
        feedback,
        timestamp: new Date().toISOString()
    };

    try {
        const feedbackEntries = JSON.parse(localStorage.getItem('pillReminderFeedback') || '[]');
        feedbackEntries.push(feedbackEntry);
        localStorage.setItem('pillReminderFeedback', JSON.stringify(feedbackEntries));
        feedbackInput.value = '';
        showAlert('success', 'Thank you for your feedback!');
    } catch (e) {
        console.error('Error submitting feedback:', e);
        showAlert('danger', 'Failed to submit feedback.');
    }
}

// Validate Username
function validateUsername(e) {
    const usernameInput = e.target;
    const username = usernameInput.value.trim();
    if (username && !USERNAME_REGEX.test(username)) {
        usernameInput.classList.add('is-invalid');
        showAlert('warning', 'Username can only contain letters, numbers, and underscores (3-20 characters).');
    } else {
        usernameInput.classList.remove('is-invalid');
    }
}

// Validate Password Strength
function validatePasswordStrength(e) {
    const usernameInput = e.target;
    const username = usernameInput.value.trim();
    if (username && !USERNAME_REGEX.test(username)) {
        usernameInput.classList.add('is-invalid');
        showAlert('warning', 'Username can only contain letters, numbers, and underscores (3-20 characters).');
    } else {
        usernameInput.classList.remove('is-invalid');
    }
}

// Validate Password Strength
function validatePasswordStrength(e) {
    const passwordInput = e.target;
    const password = passwordInput.value;
    if (password.length > 0 && password.length < MIN_PASSWORD_LENGTH) {
        passwordInput.classList.add('is-invalid');
        showAlert('warning', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    } else if (password.length > 0 && !PASSWORD_REGEX.test(password)) {
        passwordInput.classList.add('is-invalid');
        showAlert('warning', 'Password must include uppercase, lowercase, number, and special character.');
    } else {
        passwordInput.classList.remove('is-invalid');
    }
}

// Initialize Form Validation
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// Initialize Account Page
function initAccountPage() {
    try {
        const footerText = document.querySelector('footer .bi-c-circle')?.nextElementSibling;
        if (footerText) {
            footerText.textContent = ` ${new Date().getFullYear()} Pill Reminder. All rights reserved.`;
        }

        const passwordSection = document.querySelector('#current-password')?.closest('.content-section');
        if (passwordSection) {
            passwordSection.style.display = 'none';
        }

        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        document.querySelectorAll('button').forEach(button => {
            button.dataset.originalText = button.innerHTML;
        });
    } catch (error) {
        console.error('Error in initAccountPage:', error);
        showAlert('danger', 'Error initializing page. Please refresh.');
    }
}

// Export records to PDF
function handleExportRecords(e) {
    e.preventDefault();
    if (!currentUser) {
        showAlert('danger', 'Please sign in to export records.');
        return;
    }

    try {
        let records = null;
        let source = '';
        const possibleKeys = ['records', 'pillReminderRecords', 'medicationRecords', 'medRecords', 'userRecords'];
        for (const key of possibleKeys) {
            const rawRecords = localStorage.getItem(key);
            if (rawRecords) {
                records = JSON.parse(rawRecords);
                source = key;
                break;
            }
        }

        if (!records && users[currentUser]?.medications) {
            records = users[currentUser].medications;
            source = 'user.medications';
        }

        if (!records) {
            const backupData = localStorage.getItem(`pillReminderBackup_${currentUser}`);
            if (backupData) {
                records = JSON.parse(backupData)?.medications;
                source = `pillReminderBackup_${currentUser}`;
            }
        }

        if (!window.jspdf) {
            throw new Error('jsPDF library not loaded');
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setProperties({
            title: 'Medication Records',
            author: 'Pill Reminder',
            creator: 'Pill Reminder App'
        });

        doc.setFontSize(16);
        doc.text('Medication Records', 20, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`User: ${currentUser}`, 20, 35);

        let y = 45;
        const headers = ['Date', 'Time Period', 'Medicine', 'Time', 'Status'];
        const tableData = [];
        let hasRecords = false;

        if (records) {
            if (possibleKeys.includes(source)) {
                for (const date in records) {
                    const dayRecords = records[date];
                    for (const period in dayRecords) {
                        const medicines = Array.isArray(dayRecords[period]) ? dayRecords[period] : [dayRecords[period]];
                        medicines.forEach(med => {
                            hasRecords = true;
                            tableData.push([
                                date,
                                period.charAt(0).toUpperCase() + period.slice(1),
                                med.name || 'N/A',
                                med.time || 'N/A',
                                med.status || 'N/A'
                            ]);
                        });
                    }
                }
            } else {
                records.forEach(med => {
                    hasRecords = true;
                    tableData.push([
                        med.date || 'N/A',
                        med.period ? (med.period.charAt(0).toUpperCase() + med.period.slice(1)) : 'N/A',
                        med.name || 'N/A',
                        med.time || 'N/A',
                        med.status || 'N/A'
                    ]);
                });
            }
        }

        if (hasRecords) {
            if (!doc.autoTable) {
                throw new Error('jspdf-autotable plugin not loaded');
            }
            doc.autoTable({
                startY: y,
                head: [headers],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [40, 167, 69] },
                margin: { top: 45 },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 40 }
                }
            });
        } else {
            doc.setFontSize(12);
            doc.text('No medication records available.', 20, y + 10);
        }

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medication_records.pdf';
        a.click();
        URL.revokeObjectURL(url);

        showAlert('success', 'PDF exported and downloaded successfully.');
    } catch (error) {
        console.error('Error exporting records:', error);
        showAlert('danger', 'Failed to export records: ' + error.message);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    const elements = {
        signInBtn: document.getElementById('signInBtn'),
        registerBtn: document.getElementById('registerBtn'),
        setPasswordBtn: document.getElementById('setPasswordBtn'),
        exportRecordsBtn: document.getElementById('exportRecordsBtn'),
        submitQuestionBtn: document.getElementById('submitQuestionBtn'),
        submitFeedbackBtn: document.getElementById('submitFeedbackBtn'),
        username: document.getElementById('username'),
        newPassword: document.getElementById('new-password')
    };

    if (elements.signInBtn) {
        elements.signInBtn.addEventListener('click', handleSignIn);
    } else {
        console.warn('Sign In button not found');
    }

    if (elements.registerBtn) {
        elements.registerBtn.addEventListener('click', handleRegister);
    } else {
        console.warn('Register button not found');
    }

    if (elements.setPasswordBtn) {
        elements.setPasswordBtn.addEventListener('click', handlePasswordChange);
    } else {
        console.warn('Change Password button not found');
    }

    if (elements.exportRecordsBtn) {
        elements.exportRecordsBtn.addEventListener('click', handleExportRecords);
    } else {
        console.warn('Export Records button not found');
    }

    if (elements.submitQuestionBtn) {
        elements.submitQuestionBtn.addEventListener('click', handleSupportQuestion);
    } else {
        console.warn('Submit Question button not found');
    }

    if (elements.submitFeedbackBtn) {
        elements.submitFeedbackBtn.addEventListener('click', handleFeedback);
    } else {
        console.warn('Submit Feedback button not found');
    }

    if (elements.username) {
        elements.username.addEventListener('input', validateUsername);
    } else {
        console.warn('Username input not found');
    }

    if (elements.newPassword) {
        elements.newPassword.addEventListener('input', validatePasswordStrength);
    } else {
        console.warn('New password input not found');
    }

    let lastKeyPress = 0;
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const now = Date.now();
                if (now - lastKeyPress < 300) return;
                lastKeyPress = now;
                e.preventDefault();
                const section = input.closest('.content-section') || input.closest('.modal-content');
                if (section) {
                    const submitBtn = section.querySelector('.btn-primary, .btn-danger');
                    if (submitBtn) submitBtn.click();
                }
            }
        });
    });
}
document.addEventListener('languageChange', (e) => {
    if (typeof LanguageManager !== 'undefined') {
        LanguageManager.setLanguage(e.detail.language);
    }
});
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
        initAccountPage();
        loadUserData();
        setupEventListeners();
        checkLoginStatus();
        initFormValidation();

        if (typeof applyGlobalSettings === 'function') {
            applyGlobalSettings();
        } else {
            console.warn('applyGlobalSettings not found');
        }
    } catch (error) {
        console.error('Error initializing accounts page:', error);
        showAlert('danger', 'An error occurred while loading the page. Please refresh.');
    }
});
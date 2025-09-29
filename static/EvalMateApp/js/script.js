// Store user data in memory (since localStorage is not available)
let userData = {};

// === INLINE VALIDATION FUNCTIONS (NEW) ===
function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    input.classList.add('error');
    input.classList.remove('success');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    input.parentElement.appendChild(errorDiv);
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    input.classList.remove('error');
}

function showFieldSuccess(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    clearFieldError(inputId);
    input.classList.add('success');
}

// === ORIGINAL UTILITY FUNCTIONS ===
function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function validateName(name) {
    const nameRegex = /^[A-Za-z\s'-]+$/;
    return nameRegex.test(name);
}

// === LOGIN PAGE FUNCTIONALITY ===
function initLoginPage() {
    initCustomSelect();
    
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    
    // Add IDs if missing
    if (usernameInput && !usernameInput.id) {
        usernameInput.id = 'username';
    }
    if (passwordInput && !passwordInput.id) {
        passwordInput.id = 'password';
    }
    
    // Username validation
    if (usernameInput) {
        usernameInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('username', 'Username is required');
            } else {
                showFieldSuccess('username');
            }
        });
        
        usernameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('username');
            }
        });
    }
    
    // Password validation
    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            if (!this.value) {
                showFieldError('password', 'Password is required');
            } else {
                showFieldSuccess('password');
            }
        });
        
        passwordInput.addEventListener('input', function() {
            if (this.value) {
                clearFieldError('password');
            }
        });
    }
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showMessage('successMessage', 'Password reset link sent to your email!');
        });
    }
}

function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType') ? document.getElementById('userType').value : '';
    const loginBtn = document.querySelector('.login-btn');

    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    if (!email || !password || !userType) {
        showMessage('errorMessage', 'Please fill in all fields.', true);
        return;
    }

    if (!validateEmail(email)) {
        showMessage('errorMessage', 'Please enter a valid email address.', true);
        return;
    }

    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    setTimeout(() => {
        const userKey = `${email}_${userType}`;
        if (userData[userKey]) {
            if (userData[userKey].password === password) {
                showMessage('successMessage', `Welcome back! Logging in as ${userType}...`);
                
                setTimeout(() => {
                    console.log(`Login successful for ${email} (${userType})`);
                }, 1500);
            } else {
                showMessage('errorMessage', 'Invalid password. Please try again.', true);
            }
        } else {
            showMessage('errorMessage', 'Account not found. Please check your credentials or sign up.', true);
        }

        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }, 1500);
}

// === REGISTER PAGE FUNCTIONALITY ===
function initRegisterPage() {
    const typeButtons = document.querySelectorAll('.type-btn');
    const accountTypeInput = document.getElementById('accountType');

    // Account type selection
    if (typeButtons && accountTypeInput) {
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const selectedType = btn.getAttribute('data-type');
                accountTypeInput.value = selectedType;
                
                const studentIdLabel = document.querySelector('label[for="studentId"]');
                if (studentIdLabel) {
                    if (selectedType === 'faculty') {
                        studentIdLabel.textContent = 'Faculty ID';
                        document.getElementById('studentId').placeholder = 'Enter your faculty ID';
                    } else {
                        studentIdLabel.textContent = 'Student ID';
                        document.getElementById('studentId').placeholder = 'Enter your student ID';
                    }
                }
            });
        });
    }

    // === INLINE VALIDATION FOR ALL FIELDS ===
    
    // First Name
    const firstNameInput = document.getElementById('firstName');
    if (firstNameInput) {
        firstNameInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('firstName', 'First name is required');
            } else if (!validateName(value)) {
                showFieldError('firstName', 'Only letters, spaces, hyphens, and apostrophes allowed');
            } else {
                showFieldSuccess('firstName');
            }
        });
        
        firstNameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('firstName');
            }
        });
    }
    
    // Last Name
    const lastNameInput = document.getElementById('lastName');
    if (lastNameInput) {
        lastNameInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('lastName', 'Last name is required');
            } else if (!validateName(value)) {
                showFieldError('lastName', 'Only letters, spaces, hyphens, and apostrophes allowed');
            } else {
                showFieldSuccess('lastName');
            }
        });
        
        lastNameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('lastName');
            }
        });
    }
    
    // Email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('email', 'Email is required');
            } else if (!validateEmail(value)) {
                showFieldError('email', 'Please enter a valid email address');
            } else {
                showFieldSuccess('email');
            }
        });
        
        emailInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('email');
            }
        });
    }
    
    // Username
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('username', 'Username is required');
            } else if (value.length < 3) {
                showFieldError('username', 'Username must be at least 3 characters');
            } else {
                showFieldSuccess('username');
            }
        });
        
        usernameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('username');
            }
        });
    }
    
    // Password (password1)
    const passwordInput = document.getElementById('password1');
    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            const value = this.value;
            if (!value) {
                showFieldError('password1', 'Password is required');
            } else if (!validatePassword(value)) {
                showFieldError('password1', 'Password must be 8+ characters with uppercase, lowercase, and number');
            } else {
                showFieldSuccess('password1');
            }
        });
        
        passwordInput.addEventListener('input', function() {
            if (this.value) {
                clearFieldError('password1');
                const confirmInput = document.getElementById('password2');
                if (confirmInput && confirmInput.value) {
                    validatePasswordMatch();
                }
            }
        });
    }
    
    // Confirm Password (password2)
    const confirmPasswordInput = document.getElementById('password2');
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('blur', validatePasswordMatch);
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value) {
                clearFieldError('password2');
            }
        });
    }
    
    // Student/Faculty ID
    const studentIdInput = document.getElementById('studentId');
    if (studentIdInput) {
        studentIdInput.addEventListener('blur', function() {
            const value = this.value.trim();
            const accountType = accountTypeInput ? accountTypeInput.value : 'student';
            const label = accountType === 'faculty' ? 'Faculty ID' : 'Student ID';
            
            if (!value) {
                showFieldError('studentId', `${label} is required`);
            } else {
                showFieldSuccess('studentId');
            }
        });
        
        studentIdInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('studentId');
            }
        });
    }
    
    // Phone Number (optional)
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/[-\s\(\)]/g, ''))) {
                    showFieldError('phoneNumber', 'Please enter a valid phone number');
                } else {
                    showFieldSuccess('phoneNumber');
                }
            }
        });
        
        phoneInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('phoneNumber');
            }
        });
    }
    
    // Institution
    const institutionInput = document.getElementById('institution');
    if (institutionInput) {
        institutionInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('institution', 'Institution is required');
            } else {
                showFieldSuccess('institution');
            }
        });
        
        institutionInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('institution');
            }
        });
    }
    
    // Department
    const departmentInput = document.getElementById('department');
    if (departmentInput) {
        departmentInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('department', 'Department is required');
            } else {
                showFieldSuccess('department');
            }
        });
        
        departmentInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('department');
            }
        });
    }
}

function validatePasswordStrength() {
    const password = document.getElementById('password1') ? document.getElementById('password1').value : '';
    const passwordInput = document.getElementById('password1');
    
    if (!passwordInput) return;
    
    if (password.length === 0) {
        passwordInput.classList.remove('error', 'success');
        return;
    }
    
    if (validatePassword(password)) {
        passwordInput.classList.remove('error');
        passwordInput.classList.add('success');
    } else {
        passwordInput.classList.remove('success');
        passwordInput.classList.add('error');
    }
}

function validatePasswordMatch() {
    const passwordInput = document.getElementById('password1');
    const confirmPasswordInput = document.getElementById('password2');
    
    if (!passwordInput || !confirmPasswordInput) return;
    
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
        confirmPasswordInput.classList.remove('error', 'success');
        return;
    }
    
    if (!confirmPassword) {
        showFieldError('password2', 'Please confirm your password');
    } else if (password !== confirmPassword) {
        showFieldError('password2', 'Passwords do not match');
    } else {
        showFieldSuccess('password2');
    }
}

function handleRegister() {
    const formData = {
        accountType: document.getElementById('accountType').value,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password1').value,
        confirmPassword: document.getElementById('password2').value,
        studentId: document.getElementById('studentId').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        institution: document.getElementById('institution').value.trim(),
        department: document.getElementById('department').value.trim()
    };

    const registerBtn = document.querySelector('.register-btn');

    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    const validationError = validateRegistrationForm(formData);
    if (validationError) {
        showMessage('errorMessage', validationError, true);
        return;
    }

    registerBtn.classList.add('loading');
    registerBtn.disabled = true;

    setTimeout(() => {
        const userKey = `${formData.email}_${formData.accountType}`;
        if (userData[userKey]) {
            showMessage('errorMessage', 'An account with this email and user type already exists.', true);
        } else {
            userData[userKey] = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                username: formData.username,
                password: formData.password,
                accountType: formData.accountType,
                studentId: formData.studentId,
                phoneNumber: formData.phoneNumber,
                institution: formData.institution,
                department: formData.department,
                createdAt: new Date().toISOString()
            };

            showMessage('successMessage', 'Account created successfully! You can now log in.');
            
            document.getElementById('registerForm').reset();
            
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-type') === 'student') {
                    btn.classList.add('active');
                }
            });
            document.getElementById('accountType').value = 'student';
            
            document.querySelectorAll('input').forEach(input => {
                input.classList.remove('error', 'success');
            });
            
            document.querySelectorAll('.field-error').forEach(error => {
                error.remove();
            });

            setTimeout(() => {
                console.log('Registration successful');
            }, 2000);
        }

        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
    }, 2000);
}

function validateRegistrationForm(formData) {
    const requiredFields = [
        { field: 'firstName', name: 'First Name' },
        { field: 'lastName', name: 'Last Name' },
        { field: 'email', name: 'Email Address' },
        { field: 'username', name: 'Username' },
        { field: 'password', name: 'Password' },
        { field: 'confirmPassword', name: 'Confirm Password' },
        { field: 'studentId', name: formData.accountType === 'faculty' ? 'Faculty ID' : 'Student ID' },
        { field: 'institution', name: 'Institution' },
        { field: 'department', name: 'Department' }
    ];

    for (let { field, name } of requiredFields) {
        if (!formData[field]) {
            return `${name} is required.`;
        }
    }

    if (!validateEmail(formData.email)) {
        return 'Please enter a valid email address.';
    }

    if (!validatePassword(formData.password)) {
        return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.';
    }

    if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match.';
    }

    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!nameRegex.test(formData.firstName)) {
        return 'First name should only contain letters, spaces, hyphens, and apostrophes.';
    }
    if (!nameRegex.test(formData.lastName)) {
        return 'Last name should only contain letters, spaces, hyphens, and apostrophes.';
    }

    if (formData.phoneNumber) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(formData.phoneNumber.replace(/[-\s\(\)]/g, ''))) {
            return 'Please enter a valid phone number.';
        }
    }

    return null;
}

// === CUSTOM SELECT FUNCTIONALITY ===
function initCustomSelect() {
    const selectSelected = document.querySelector('.select-selected');
    const selectItems = document.querySelector('.select-items');
    const selectOptions = document.querySelectorAll('.select-items div');
    const userIndicator = document.getElementById('userIndicator');
    
    if (!selectSelected || !selectItems) return;
    
    selectSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        selectItems.classList.toggle('select-hide');
    });
    
    selectOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.getAttribute('data-value');
            const text = this.innerHTML;
            
            selectSelected.innerHTML = text;
            selectItems.classList.add('select-hide');
            
            let hiddenInput = document.getElementById('userType');
            if (!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = 'userType';
                hiddenInput.name = 'userType';
                document.querySelector('.custom-select').appendChild(hiddenInput);
            }
            hiddenInput.value = value;
            
            if (userIndicator) {
                if (value === 'faculty') {
                    userIndicator.className = 'user-indicator faculty';
                    userIndicator.textContent = 'F';
                } else if (value === 'student') {
                    userIndicator.className = 'user-indicator student';
                    userIndicator.textContent = 'S';
                } else {
                    userIndicator.className = 'user-indicator';
                    userIndicator.textContent = '?';
                }
            }
        });
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            selectItems.classList.add('select-hide');
        }
    });
}

// === PAGE INITIALIZATION ===
function initializePage() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        initLoginPage();
    } else if (registerForm) {
        initRegisterPage();
    }
}

document.addEventListener('DOMContentLoaded', initializePage);

// === ADDITIONAL UTILITY FUNCTIONS ===
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        
        form.querySelectorAll('input').forEach(input => {
            input.classList.remove('error', 'success');
        });
        
        form.querySelectorAll('.field-error').forEach(error => {
            error.remove();
        });
        
        const errorMsg = form.querySelector('.error-message');
        const successMsg = form.querySelector('.success-message');
        if (errorMsg) errorMsg.style.display = 'none';
        if (successMsg) successMsg.style.display = 'none';
    }
}

function togglePasswordVisibility(inputId, toggleButtonId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleButtonId);
    
    if (passwordInput && toggleButton) {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleButton.textContent = type === 'password' ? '👁️' : '🙈';
    }
}

function showStoredUsers() {
    console.log('Stored Users:', userData);
    if (Object.keys(userData).length === 0) {
        console.log('No users registered yet.');
    } else {
        const userList = Object.keys(userData).map(key => {
            const user = userData[key];
            return `${user.firstName} ${user.lastName} (${user.email}) - ${user.accountType}`;
        }).join('\n');
        console.log('Registered Users:\n' + userList);
    }
}
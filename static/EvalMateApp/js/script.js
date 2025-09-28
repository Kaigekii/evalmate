// Store user data in memory (since localStorage is not available)
let userData = {};

// Page switching functionality removed - navigation handled by HTML links

// Utility functions
function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        
        // Hide the message after 5 seconds
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
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Login page functionality
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const signUpLink = document.getElementById('signUpLink');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const userTypeSelect = document.getElementById('userType');
    const userIndicator = document.getElementById('userIndicator');

    // ADD THIS LINE
    initCustomSelect();

    // Removed event listener to allow natural link navigation

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showMessage('successMessage', 'Password reset link sent to your email!');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }
}

function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType') ? document.getElementById('userType').value : '';
    const loginBtn = document.querySelector('.login-btn');

    // Clear previous messages
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    // Validation
    if (!email || !password || !userType) {
        showMessage('errorMessage', 'Please fill in all fields.', true);
        return;
    }

    if (!validateEmail(email)) {
        showMessage('errorMessage', 'Please enter a valid email address.', true);
        return;
    }

    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Check if user exists in our mock data
        const userKey = `${email}_${userType}`;
        if (userData[userKey]) {
            if (userData[userKey].password === password) {
                showMessage('successMessage', `Welcome back! Logging in as ${userType}...`);
                
                // Simulate redirect after successful login
                setTimeout(() => {
                    // Redirect simulation - in real app, redirect to dashboard
                    console.log(`Login successful for ${email} (${userType})`);
                }, 1500);
            } else {
                showMessage('errorMessage', 'Invalid password. Please try again.', true);
            }
        } else {
            showMessage('errorMessage', 'Account not found. Please check your credentials or sign up.', true);
        }

        // Remove loading state
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }, 1500);
}

// Register page functionality
function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const logInLink = document.getElementById('logInLink');
    const typeButtons = document.querySelectorAll('.type-btn');
    const accountTypeInput = document.getElementById('accountType');

    // Removed event listener to allow natural link navigation

    // Account type selection
    if (typeButtons && accountTypeInput) {
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons
                typeButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Update hidden input
                const selectedType = btn.getAttribute('data-type');
                accountTypeInput.value = selectedType;
                
                // Update student ID label based on account type
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

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegister();
        });
    }

    // Real-time password validation
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        passwordInput.addEventListener('input', () => {
            validatePasswordStrength();
            if (confirmPasswordInput.value) {
                validatePasswordMatch();
            }
        });
    }
}

function validatePasswordStrength() {
    const password = document.getElementById('registerPassword').value;
    const passwordInput = document.getElementById('registerPassword');
    
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
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (confirmPassword.length === 0) {
        confirmPasswordInput.classList.remove('error', 'success');
        return;
    }
    
    if (password === confirmPassword) {
        confirmPasswordInput.classList.remove('error');
        confirmPasswordInput.classList.add('success');
    } else {
        confirmPasswordInput.classList.remove('success');
        confirmPasswordInput.classList.add('error');
    }
}

function handleRegister() {
    // Get form values
    const formData = {
        accountType: document.getElementById('accountType').value,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('registerEmail').value.trim(),
        password: document.getElementById('registerPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        studentId: document.getElementById('studentId').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        institution: document.getElementById('institution').value.trim(),
        department: document.getElementById('department').value.trim()
    };

    const registerBtn = document.querySelector('.register-btn');

    // Clear previous messages
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    // Validation
    const validationError = validateRegistrationForm(formData);
    if (validationError) {
        showMessage('errorMessage', validationError, true);
        return;
    }

    // Show loading state
    registerBtn.classList.add('loading');
    registerBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Check if user already exists
        const userKey = `${formData.email}_${formData.accountType}`;
        if (userData[userKey]) {
            showMessage('errorMessage', 'An account with this email and user type already exists.', true);
        } else {
            // Store user data
            userData[userKey] = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                accountType: formData.accountType,
                studentId: formData.studentId,
                phoneNumber: formData.phoneNumber,
                institution: formData.institution,
                department: formData.department,
                createdAt: new Date().toISOString()
            };

            showMessage('successMessage', 'Account created successfully! You can now log in.');
            
            // Clear form after successful registration
            document.getElementById('registerForm').reset();
            
            // Reset account type to default
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-type') === 'student') {
                    btn.classList.add('active');
                }
            });
            document.getElementById('accountType').value = 'student';
            
            // Remove validation classes
            document.querySelectorAll('input').forEach(input => {
                input.classList.remove('error', 'success');
            });

            // Registration successful - user can click "Log in here" link
             setTimeout(() => {
                 console.log('Registration successful');
             }, 2000);
        }

        // Remove loading state
        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
    }, 2000);
}

function validateRegistrationForm(formData) {
    // Required field validation
    const requiredFields = [
        { field: 'firstName', name: 'First Name' },
        { field: 'lastName', name: 'Last Name' },
        { field: 'email', name: 'Email Address' },
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

    // Email validation
    if (!validateEmail(formData.email)) {
        return 'Please enter a valid email address.';
    }

    // Password validation
    if (!validatePassword(formData.password)) {
        return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.';
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match.';
    }

    // Name validation (no numbers)
    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!nameRegex.test(formData.firstName)) {
        return 'First name should only contain letters, spaces, hyphens, and apostrophes.';
    }
    if (!nameRegex.test(formData.lastName)) {
        return 'Last name should only contain letters, spaces, hyphens, and apostrophes.';
    }

    // Phone number validation (if provided)
    if (formData.phoneNumber) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(formData.phoneNumber.replace(/[-\s\(\)]/g, ''))) {
            return 'Please enter a valid phone number.';
        }
    }

    return null; // No validation errors
}

// Initialize appropriate page functionality based on current page
function initializePage() {
    // Check which page we're on based on elements present
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        initLoginPage();
    } else if (registerForm) {
        initRegisterPage();
    }
}

// Custom Select Functionality
// Custom Select Functionality
function initCustomSelect() {
    const selectSelected = document.querySelector('.select-selected');
    const selectItems = document.querySelector('.select-items');
    const selectOptions = document.querySelectorAll('.select-items div');
    const userIndicator = document.getElementById('userIndicator');
    
    if (!selectSelected || !selectItems) return;
    
    // Toggle dropdown when clicking on the selected item
    selectSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        selectItems.classList.toggle('select-hide');
    });
    
    // Handle option selection
    selectOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.getAttribute('data-value');
            const text = this.innerHTML;
            
            // Update the displayed text
            selectSelected.innerHTML = text;
            
            // Hide the dropdown
            selectItems.classList.add('select-hide');
            
            // Create or update a hidden input for form submission
            let hiddenInput = document.getElementById('userType');
            if (!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = 'userType';
                hiddenInput.name = 'userType';
                document.querySelector('.custom-select').appendChild(hiddenInput);
            }
            hiddenInput.value = value;
            
            // Update user indicator
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
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            selectItems.classList.add('select-hide');
        }
    });
}

// Page load event
document.addEventListener('DOMContentLoaded', initializePage);

// Additional utility functions for enhanced functionality
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        
        // Remove all validation classes
        form.querySelectorAll('input').forEach(input => {
            input.classList.remove('error', 'success');
        });
        
        // Hide messages
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

// Demo function to show stored user data (for testing purposes)
function showStoredUsers() {
    console.log('Stored Users:', userData);
    if (Object.keys(userData).length === 0) {
        alert('No users registered yet.');
    } else {
        const userList = Object.keys(userData).map(key => {
            const user = userData[key];
            return `${user.firstName} ${user.lastName} (${user.email}) - ${user.accountType}`;
        }).join('\n');
        alert('Registered Users:\n' + userList);
    }
}
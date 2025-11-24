// === REGISTER PAGE FUNCTIONALITY ===

function initRegisterPage() {
    console.log('Initializing register page...');
    
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
    
    // Email - UPDATED WITH DUPLICATE CHECK
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('email', 'Email is required');
            } else if (!validateEmail(value)) {
                showFieldError('email', 'Please enter a valid email address');
            } else {
                // Check if email already exists
                const accountType = document.getElementById('accountType').value;
                const userKey = `${value}_${accountType}`;
                if (typeof userData !== 'undefined' && userData[userKey]) {
                    showFieldError('email', 'Email already exists');
                } else {
                    showFieldSuccess('email');
                }
            }
        });
        
        emailInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('email');
            }
        });
    }
    
    // Username - UPDATED WITH DUPLICATE CHECK
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('username', 'Username is required');
            } else if (value.length < 3) {
                showFieldError('username', 'Username must be at least 3 characters');
            } else {
                // Check if username already exists
                if (typeof userData !== 'undefined') {
                    const usernameExists = Object.values(userData).some(user => user.username === value);
                    if (usernameExists) {
                        showFieldError('username', 'Username already exists');
                    } else {
                        showFieldSuccess('username');
                    }
                } else {
                    showFieldSuccess('username');
                }
            }
        });
        
        usernameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError('username');
            }
        });
    }
    
    // Password (password1) - UPDATED WITH REAL-TIME REQUIREMENTS CHECKING
    const passwordInput = document.getElementById('password1');
    const requirementsBox = document.getElementById('passwordRequirements');
    const reqLength = document.getElementById('req-length');
    const reqCapital = document.getElementById('req-capital');
    const reqSymbol = document.getElementById('req-symbol');
    
    if (passwordInput && requirementsBox) {
        // Show requirements box ONLY when focused (pressed)
        passwordInput.addEventListener('focus', function() {
            requirementsBox.classList.add('show');
        });
        
        // Hide requirements box when unfocused (unpressed)
        passwordInput.addEventListener('blur', function() {
            requirementsBox.classList.remove('show');
            
            const value = this.value;
            if (!value) {
                showFieldError('password1', 'Password is required');
            } else {
                const errors = validatePassword(value);
                if (errors.length > 0) {
                    showFieldError('password1', `Password must contain: ${errors.join(', ')}`);
                } else {
                    showFieldSuccess('password1');
                }
            }
        });
        
        // Real-time validation as user types (but only update indicators, don't show/hide box)
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Clear any error messages while typing
            if (password.length > 0) {
                clearFieldError('password1');
            }
            
            // Check each requirement and update UI
            validateRequirement(reqLength, password.length >= 8);
            validateRequirement(reqCapital, /[A-Z]/.test(password));
            validateRequirement(reqSymbol, /[^a-zA-Z0-9]/.test(password));
            
            // Also validate confirm password if it has value
            const confirmInput = document.getElementById('password2');
            if (confirmInput && confirmInput.value) {
                validatePasswordMatch();
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
                const phoneRegex = /^09\d{9}$/;
                if (!phoneRegex.test(value.replace(/[-\s\(\)]/g, ''))) {
                    showFieldError('phoneNumber', 'Please enter a valid Philippine mobile number');
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
    
    // Institution (Dropdown)
    const institutionSelect = document.getElementById('institution');
    if (institutionSelect) {
        institutionSelect.addEventListener('blur', function() {
            const value = this.value;
            if (!value) {
                showFieldError('institution', 'Institution is required');
            } else {
                showFieldSuccess('institution');
            }
        });
        
        institutionSelect.addEventListener('change', function() {
            if (this.value) {
                clearFieldError('institution');
                showFieldSuccess('institution');
            }
        });
    }
    
    // Department (Dropdown)
    const departmentSelect = document.getElementById('department');
    if (departmentSelect) {
        departmentSelect.addEventListener('blur', function() {
            const value = this.value;
            if (!value) {
                showFieldError('department', 'Department is required');
            } else {
                showFieldSuccess('department');
            }
        });
        
        departmentSelect.addEventListener('change', function() {
            if (this.value) {
                clearFieldError('department');
                showFieldSuccess('department');
            }
        });
    }

    // Note: initInstitutionDepartment() is now called automatically in institutions-data.js
    console.log('Register page initialization complete');
}

// Helper function to update individual requirement UI
function validateRequirement(element, isValid) {
    if (!element) return;
    
    const icon = element.querySelector('i');
    
    if (isValid) {
        element.classList.remove('invalid');
        element.classList.add('valid');
        if (icon) {
            icon.className = 'fa-solid fa-check';
        }
    } else {
        element.classList.remove('valid');
        element.classList.add('invalid');
        if (icon) {
            icon.className = 'fa-solid fa-xmark';
        }
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

function validatePasswordStrength() {
    const password = document.getElementById('password1') ? document.getElementById('password1').value : '';
    const passwordInput = document.getElementById('password1');
    
    if (!passwordInput) return;
    
    if (password.length === 0) {
        passwordInput.classList.remove('error', 'success');
        return;
    }
    
    const errors = validatePassword(password);
    if (errors.length === 0) {
        passwordInput.classList.remove('error');
        passwordInput.classList.add('success');
    } else {
        passwordInput.classList.remove('success');
        passwordInput.classList.add('error');
    }
}

// Enhanced registration validation
function handleRegister(event) {
    event.preventDefault(); // Always prevent default to handle with AJAX
    
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
        institution: document.getElementById('institution').value,
        department: document.getElementById('department').value
    };

    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    // Client-side validation
    const validationError = validateRegistrationForm(formData);
    if (validationError) {
        showMessage('errorMessage', validationError, true);
        return false;
    }
    
    // Submit via AJAX
    const form = document.getElementById('registerForm');
    const formDataObj = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
    }
    
    fetch(form.action || window.location.href, {
        method: 'POST',
        body: formDataObj,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        // First, get the response as text
        return response.text().then(text => {
            // Check if it's JSON
            const contentType = response.headers.get('content-type');
            console.log('Response status:', response.status);
            console.log('Content-Type:', contentType);
            console.log('Response text preview:', text.substring(0, 200));
            
            if (!response.ok) {
                console.error('Server returned error:', text);
                throw new Error(`Server error: ${response.status}`);
            }
            
            // Check if response is HTML (error page)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Received HTML instead of JSON:', text.substring(0, 500));
                throw new Error('Server returned HTML instead of JSON. Check server console for errors.');
            }
            
            // Try to parse as JSON
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON:', text);
                throw new Error('Invalid JSON response from server');
            }
        });
    })
    .then(data => {
        console.log('Registration response data:', data);
        if (data.success) {
            console.log('Success! Redirecting to:', data.redirect);
            // Redirect directly to dashboard (no email verification needed)
            window.location.href = data.redirect || '/';
        } else {
            // Show error
            showMessage('errorMessage', data.message || 'Registration failed. Please try again.', true);
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showMessage('errorMessage', 'An error occurred. Please try again.', true);
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
    
    return false;
}

// Show verification modal
function showVerificationModal(email, userId) {
    console.log('showVerificationModal called with:', email, userId);
    const modal = document.getElementById('verificationModal');
    const userEmailEl = document.getElementById('userEmail');
    
    console.log('Modal element:', modal);
    console.log('userEmailEl element:', userEmailEl);
    
    if (modal && userEmailEl) {
        userEmailEl.textContent = email;
        modal.classList.add('show');
        
        // Store user ID in session for verification
        sessionStorage.setItem('pending_verification_user_id', userId);
        
        // Focus first input
        const firstInput = document.getElementById('code1');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
        
        // Initialize code inputs
        initCodeInputs();
        
        // Initialize resend timer
        startResendTimer();
    }
}

// Initialize code input behavior
function initCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');
    
    inputs.forEach((input, index) => {
        // Clear previous listeners
        input.replaceWith(input.cloneNode(true));
    });
    
    // Re-query after replacing
    const newInputs = document.querySelectorAll('.code-input');
    
    newInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            // Remove error state
            this.classList.remove('error');
            
            // Only allow numbers
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Move to next input if digit entered
            if (this.value.length === 1 && index < newInputs.length - 1) {
                newInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            // Move to previous on backspace
            if (e.key === 'Backspace' && !this.value && index > 0) {
                newInputs[index - 1].focus();
            }
            
            // Submit on Enter
            if (e.key === 'Enter') {
                document.getElementById('verifyCodeBtn').click();
            }
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            
            if (pasteData.length === 6) {
                newInputs.forEach((inp, i) => {
                    inp.value = pasteData[i] || '';
                });
                newInputs[5].focus();
            }
        });
    });
    
    // Verify button
    const verifyBtn = document.getElementById('verifyCodeBtn');
    if (verifyBtn) {
        verifyBtn.onclick = verifyCode;
    }
    
    // Resend button
    const resendBtn = document.getElementById('resendCodeBtn');
    if (resendBtn) {
        resendBtn.onclick = resendCode;
    }
}

// Verify code
function verifyCode() {
    const inputs = document.querySelectorAll('.code-input');
    const code = Array.from(inputs).map(input => input.value).join('');
    
    const errorEl = document.getElementById('verificationError');
    const successEl = document.getElementById('verificationSuccess');
    
    // Hide previous messages
    errorEl.classList.remove('show');
    successEl.classList.remove('show');
    
    // Validate code length
    if (code.length !== 6) {
        errorEl.textContent = 'Please enter all 6 digits';
        errorEl.classList.add('show');
        inputs.forEach(input => input.classList.add('error'));
        return;
    }
    
    // Disable button
    const verifyBtn = document.getElementById('verifyCodeBtn');
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';
    
    // Submit verification
    fetch('/verify-code/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: `code=${code}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success
            inputs.forEach(input => input.classList.add('success'));
            successEl.textContent = '✓ Email verified successfully! Redirecting to your dashboard...';
            successEl.classList.add('show');
            
            // Clear session
            sessionStorage.removeItem('pending_verification_user_id');
            
            // Redirect to appropriate dashboard
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1500);
        } else {
            // Show error
            inputs.forEach(input => input.classList.add('error'));
            errorEl.textContent = data.message || 'Invalid or expired code. Please try again.';
            errorEl.classList.add('show');
            
            // Re-enable button
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify Code';
            
            // Clear inputs
            inputs.forEach(input => {
                input.value = '';
                setTimeout(() => input.classList.remove('error'), 2000);
            });
            inputs[0].focus();
        }
    })
    .catch(error => {
        console.error('Verification error:', error);
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.add('show');
        
        // Re-enable button
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Code';
    });
}

// Resend code
function resendCode() {
    const resendBtn = document.getElementById('resendCodeBtn');
    const errorEl = document.getElementById('verificationError');
    const successEl = document.getElementById('verificationSuccess');
    
    // Hide previous messages
    errorEl.classList.remove('show');
    successEl.classList.remove('show');
    
    // Disable button
    resendBtn.disabled = true;
    
    fetch('/resend-code/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: ''
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            successEl.textContent = '✓ Verification code resent! Check your email.';
            successEl.classList.add('show');
            
            // Start timer
            startResendTimer();
        } else {
            errorEl.textContent = data.message || 'Failed to resend code. Please try again.';
            errorEl.classList.add('show');
            resendBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Resend error:', error);
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.add('show');
        resendBtn.disabled = false;
    });
}

// Resend timer
let resendTimerInterval = null;

function startResendTimer() {
    const resendBtn = document.getElementById('resendCodeBtn');
    const timerEl = document.getElementById('resendTimer');
    
    let seconds = 60;
    resendBtn.disabled = true;
    
    // Clear existing interval
    if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
    }
    
    resendTimerInterval = setInterval(() => {
        seconds--;
        timerEl.textContent = `Resend available in ${seconds}s`;
        
        if (seconds <= 0) {
            clearInterval(resendTimerInterval);
            resendTimerInterval = null;
            timerEl.textContent = '';
            resendBtn.disabled = false;
        }
    }, 1000);
}

// Initialize register page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        initRegisterPage();
        
        // Add form submit handler
        registerForm.addEventListener('submit', handleRegister);
    }
});


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        element.className = isError ? 'message-box error' : 'message-box success';
    }
}
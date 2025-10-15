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

    // Make sure userData exists (e.g., from localStorage)
    const storedData = JSON.parse(localStorage.getItem('userData')) || {};
    const userKey = `${email}_${userType}`;
    const user = storedData[userKey];

    setTimeout(() => {
        if (!user) {
            // Account not found
            showMessage('errorMessage', 'Sorry, account not found. Try to sign up first.', true);
        } else if (user.password !== password) {
            // Password mismatch
            showMessage('errorMessage', 'Invalid password. Please try again.', true);
        } else {
            // Success
            showMessage('successMessage', `Welcome back! Logging in as ${userType}...`);
            setTimeout(() => {
                console.log(`Login successful for ${email} (${userType})`);
                // Redirect or proceed
            }, 1500);
        }

        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }, 1500);
}

// Initialize login page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        initLoginPage();
    }
});
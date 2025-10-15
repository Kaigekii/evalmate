// === LOGIN PAGE FUNCTIONALITY ===

function initLoginPage() {
    
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
    const username = document.getElementById('username').value.trim(); 
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.login-btn');

    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    if (!username || !password) { 
        showMessage('errorMessage', 'Please fill in all fields.', true);
        return;
    }

    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    const storedData = JSON.parse(localStorage.getItem('userData')) || {};
    const user = Object.values(storedData).find(u => u.username === username);

    setTimeout(() => {
        if (!user) {
            showMessage('errorMessage', 'Sorry, account not found. Try to sign up first.', true);
        } else if (user.password !== password) {
            showMessage('errorMessage', 'Invalid password. Please try again.', true);
        } else {
            showMessage('successMessage', `Welcome back! Logging in as ${user.accountType}...`);
            setTimeout(() => {
                console.log(`Login successful for ${username} (${user.accountType})`);
            }, 1500);
        }

        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }, 1500);
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        initLoginPage();
    }
});
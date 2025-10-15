// === UTILITY FUNCTIONS ===

// Show inline field error messages
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

// Show general message (error or success)
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

// Reset form and clear all validation states
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

// Toggle password visibility
function togglePasswordVisibility(inputId, toggleButtonId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleButtonId);

    if (passwordInput && toggleButton) {
        const icon = toggleButton.querySelector("i");

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            if (icon) {
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            }
        } else {
            passwordInput.type = "password";
            if (icon) {
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        }
    }
}

// Custom select dropdown functionality
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
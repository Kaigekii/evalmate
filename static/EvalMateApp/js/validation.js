// === VALIDATION FUNCTIONS ===

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// More specific password validation
function validatePassword(password) {
    const errors = [];
    
    // Check minimum length (at least 8 characters)
    if (password.length < 8) {
        errors.push('at least 8 characters');
    }
    
    // Check for at least 1 capital letter
    if (!/[A-Z]/.test(password)) {
        errors.push('at least 1 capital letter');
    }
    
    // Check for at least 1 symbol/non-alphabetical character
    if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('at least 1 symbol character');
    }
    
    return errors;
}

function validateName(name) {
    const nameRegex = /^[A-Za-z\s'-]+$/;
    return nameRegex.test(name);
}

// Enhanced validation with specific password requirements
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

    // Check for specific password requirements
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
        return `Password must contain: ${passwordErrors.join(', ')}.`;
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
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(formData.phoneNumber.replace(/[-\s\(\)]/g, ''))) {
            return 'Please enter a valid Philippine mobile number.';
        }
    }

    return null;
}
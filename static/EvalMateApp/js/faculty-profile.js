// ==========================================
// Faculty Profile - EvalMate
// ==========================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initFacultyProfile();
});

function initFacultyProfile() {
    setupProfilePictureUpload();
    setupTabSwitching();
    setupPersonalInfoForm();
    setupProfessionalInfoForm();
}

// ==================== Profile Picture Upload ====================

function setupProfilePictureUpload() {
    const uploadBtn = document.getElementById('facultyUploadBtn');
    const fileInput = document.getElementById('facultyProfilePictureInput');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleProfilePictureChange);
    }
}

function handleProfilePictureChange(event) {
    const file = event.target.files[0];
    
    if (file) {
        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
            if (typeof notificationManager !== 'undefined') {
                notificationManager.show('File size must be less than 5MB', 'error');
            }
            return;
        }
        
        // Validate file type
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            if (typeof notificationManager !== 'undefined') {
                notificationManager.show('Only JPG and PNG files are allowed', 'error');
            }
            return;
        }
        
        // Show immediate preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatar = document.getElementById('facultyProfileAvatar');
            if (avatar) {
                avatar.style.backgroundImage = `url(${e.target.result})`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.textContent = '';
            }
        };
        reader.readAsDataURL(file);
        
        // Upload to server
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        // Get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        
        console.log('Uploading faculty profile picture:', file.name);
        
        fetch('/api/profile/upload-picture/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Upload successful:', data.image_url);
                
                // Update the top-right avatar in the navigation
                updateTopNavAvatar(data.image_url);
                
                // Show success message
                if (typeof notificationManager !== 'undefined') {
                    notificationManager.show('Profile picture updated successfully!', 'success');
                }
            } else {
                console.error('Upload failed:', data.error);
                if (typeof notificationManager !== 'undefined') {
                    notificationManager.show('Failed to upload profile picture: ' + (data.error || 'Unknown error'), 'error');
                }
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            if (typeof notificationManager !== 'undefined') {
                notificationManager.show('Failed to upload profile picture. Please try again.', 'error');
            }
        });
    }
}

function updateTopNavAvatar(imageUrl) {
    const topNavAvatar = document.querySelector('.user__avatar');
    if (topNavAvatar) {
        // If there's an image inside, update it; otherwise create one
        let img = topNavAvatar.querySelector('img');
        if (img) {
            img.src = imageUrl;
        } else {
            topNavAvatar.style.backgroundImage = `url(${imageUrl})`;
            topNavAvatar.style.backgroundSize = 'cover';
            topNavAvatar.style.backgroundPosition = 'center';
            topNavAvatar.textContent = '';
        }
    }
}

// ==================== Tab Switching ====================

function setupTabSwitching() {
    const tabs = document.querySelectorAll('.faculty-profile-page .profile-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.faculty-profile-page .profile-tab').forEach(t => {
                t.classList.remove('profile-tab--active');
            });
            document.querySelectorAll('.faculty-profile-page .tab-content').forEach(c => {
                c.classList.remove('tab-content--active');
            });
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('profile-tab--active');
            const content = document.getElementById(tabName + 'Tab');
            if (content) {
                content.classList.add('tab-content--active');
            }
        });
    });
}

// ==================== Personal Info Form ====================

function setupPersonalInfoForm() {
    const form = document.getElementById('facultyPersonalInfoForm');
    
    if (form) {
        form.addEventListener('submit', handlePersonalInfoSubmit);
    }
}

async function handlePersonalInfoSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    
    console.log('Saving faculty personal info (phone and date of birth only)');
    
    try {
        const res = await fetch('/api/profile/update-personal/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        });
        
        const json = await res.json();
        
        if (!res.ok || !json.success) {
            throw new Error(json.error || 'Failed to save');
        }
        
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Personal information saved successfully!', 'success');
        }
    } catch (error) {
        console.error('Error saving personal info:', error);
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Failed to save: ' + (error.message || 'Please try again'), 'error');
        }
    }
}

// ==================== Professional Info Form ====================

function setupProfessionalInfoForm() {
    const form = document.getElementById('facultyProfessionalInfoForm');
    
    if (form) {
        form.addEventListener('submit', handleProfessionalInfoSubmit);
    }
}

async function handleProfessionalInfoSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    
    console.log('Saving faculty professional info (academic year only)');
    
    try {
        const res = await fetch('/api/profile/update-academic/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        });
        
        const json = await res.json();
        
        if (!res.ok || !json.success) {
            throw new Error(json.error || 'Failed to save');
        }
        
        // Update the form field with saved value
        const academicYearSelect = document.getElementById('facultyAcademicYear');
        if (academicYearSelect && json.academic_year !== undefined) {
            academicYearSelect.value = json.academic_year || '';
        }
        
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Professional information saved successfully!', 'success');
        }
    } catch (error) {
        console.error('Error saving professional info:', error);
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Failed to save: ' + (error.message || 'Please try again'), 'error');
        }
    }
}

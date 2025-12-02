/**
 * Faculty Dashboard - EvalMate
 * Interactive functionality for the faculty dashboard
 */

// Ensure showNotification is available globally
window.showNotification = function(message, type = 'info') {
    if (typeof notificationManager !== 'undefined') {
        notificationManager.show(message, type);
    } else {
        console.error('NotificationManager not loaded!', message, type);
        alert(message); // Fallback
    }
};

function initFacultyDashboard() {
    // Initialize all components except quick actions
    initSidebar();
    initRecentActivities();
    initNavigation();
    initFormsTabs();
    initSignOut();
    initCrossTabSync();
}

// Auto-initialize on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFacultyDashboard);
} else {
    // DOM already loaded (SPA navigation), initialize now
    initFacultyDashboard();
}

/**
 * Initialize navigation functionality
 */
function initNavigation() {
    // Get all sidebar links with SPA navigation
    const spaLinks = document.querySelectorAll('.sidebar__link[data-spa-link]');
    
    spaLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            
            if (href === '/dashboard/faculty/profile/') {
                loadProfileSection();
            }
        });
    });
}

/**
 * Load Profile Section
 */
async function loadProfileSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    try {
        // Show loading state
        mainContent.innerHTML = '<div style="text-align: center; padding: 3rem;"><i class="fas fa-spinner fa-spin fa-3x" style="color: #37353E;"></i></div>';

        // Update browser URL
        history.pushState({ page: 'profile' }, 'My Profile - EvalMate', '/dashboard/faculty/profile/');

        // Fetch profile content
        const response = await fetch('/api/faculty/profile-content/');
        if (!response.ok) throw new Error('Failed to load profile');

        const html = await response.text();
        mainContent.innerHTML = html;

        // Update active link
        document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('sidebar__link--active'));
        const profileLink = document.querySelector('[href="/dashboard/faculty/profile/"]');
        if (profileLink) profileLink.classList.add('sidebar__link--active');

    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile section', 'error');
        mainContent.innerHTML = '<div style="text-align: center; padding: 3rem;"><p>Failed to load profile. Please try again.</p></div>';
    }
}

/**
 * Sidebar Toggle Functionality
 */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.main-content');

    if (!sidebar || !sidebarToggle) return;

    // Toggle sidebar on logo click
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        
        // Save state to localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });

    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
    }

    // Handle mobile sidebar
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('collapsed');
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Handle active nav links
    const navLinks = document.querySelectorAll('.sidebar__link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Only prevent default for hash links
            if (href.startsWith('#') && !link.classList.contains('sidebar__link--signout')) {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('sidebar__link--active'));
                
                // Add active class to clicked link
                link.classList.add('sidebar__link--active');
                
                // Handle navigation for hash links
                console.log('Navigate to:', href);
            }
            
            // Close mobile sidebar after navigation
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });
}




/**
 * Recent Activities Functionality
 */
function initRecentActivities() {
    // Load activities from backend
    loadActivities();
    
    // Setup activity card interactions
    setupActivityCardListeners();
}

/**
 * Load activities from backend
 */
async function loadActivities() {
    const activitiesList = document.getElementById('activitiesList');
    const emptyState = document.getElementById('emptyState');
    
    if (!activitiesList) return;
    
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/faculty/recent-activities/');
        // const activities = await response.json();
        
        // For now, use mock data (empty array means show empty state)
        const activities = [];
        
        if (activities.length === 0) {
            // Show empty state
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
        } else {
            // Hide empty state and render activities
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            renderActivities(activities);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        
        // Show empty state on error
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.querySelector('.empty-state__title').textContent = 'Error Loading Activities';
            emptyState.querySelector('.empty-state__text').textContent = 'There was an error loading recent activities. Please try again later.';
        }
    }
}

/**
 * Render activities to the DOM
 */
function renderActivities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;
    
    // Clear existing activities (except empty state)
    const existingCards = activitiesList.querySelectorAll('.activity-card');
    existingCards.forEach(card => card.remove());
    
    // Render each activity
    activities.forEach(activity => {
        const card = createActivityCard(activity);
        activitiesList.appendChild(card);
    });
    
    // Setup listeners for new cards
    setupActivityCardListeners();
}

/**
 * Create an activity card element
 */
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = 'activity-card';
    card.dataset.activityId = activity.id;
    
    // Generate initials for avatar
    const initials = activity.studentName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    card.innerHTML = `
        <div class="activity-card__avatar">
            <span>${initials}</span>
        </div>
        <div class="activity-card__content">
            <h3 class="activity-card__title">${activity.evaluationTitle}</h3>
            <div class="activity-card__meta">
                <span class="meta__item">
                    <strong>${activity.studentName} - Team ${activity.teamName}</strong>
                </span>
                <span class="meta__item">
                    <i class="fas fa-users"></i> ${activity.teammateCount} teammates
                </span>
                <span class="meta__item">
                    <i class="fas fa-star"></i> ${activity.averageRating}/5 avg
                </span>
            </div>
        </div>
        <div class="activity-card__actions">
            <span class="activity-card__time">${formatTimeAgo(activity.submittedAt)}</span>
            <button class="btn-link" data-activity-id="${activity.id}">View Details</button>
        </div>
    `;
    
    return card;
}

/**
 * Setup event listeners for activity cards
 */
function setupActivityCardListeners() {
    const viewDetailsButtons = document.querySelectorAll('.btn-link[data-activity-id]');
    
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            const activityId = button.dataset.activityId;
            viewActivityDetails(activityId);
        });
    });
    
    // Make entire card clickable
    const activityCards = document.querySelectorAll('.activity-card');
    activityCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const activityId = card.dataset.activityId;
            if (activityId) {
                viewActivityDetails(activityId);
            }
        });
    });
}

/**
 * View activity details
 */
function viewActivityDetails(activityId) {
    console.log('Viewing activity details for ID:', activityId);
    
    // TODO: Navigate to activity details page or open modal
    // window.location.href = `/activities/${activityId}`;
}

/**
 * Format timestamp to relative time (e.g., "2h ago", "1d ago")
 */
function formatTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        
        if (interval >= 1) {
            return `${interval}${unit[0]} ago`; // e.g., "2h ago", "1d ago"
        }
    }
    
    return 'Just now';
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handle window resize
 */
window.addEventListener('resize', debounce(() => {
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth > 768) {
        // Desktop: remove mobile-specific classes
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
}, 250));

/**
 * Sign Out Handler - Clear history and session data
 */
function initSignOut() {
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (signOutBtn) {
        // Remove any existing listeners by cloning the button
        const newSignOutBtn = signOutBtn.cloneNode(true);
        signOutBtn.parentNode.replaceChild(newSignOutBtn, signOutBtn);
        
        // Add fresh event listener
        newSignOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSignOutModal(newSignOutBtn.href);
        });
    }
}

/**
 * Show custom sign out confirmation modal
 */
function showSignOutModal(logoutUrl) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'logout-modal-overlay';
    modal.innerHTML = `
        <div class="logout-modal">
            <div class="logout-modal__icon">
                <i class="fas fa-sign-out-alt"></i>
            </div>
            <h3 class="logout-modal__title">Sign Out</h3>
            <p class="logout-modal__message">Are you sure you want to sign out?</p>
            <div class="logout-modal__actions">
                <button class="btn-modal btn-modal--cancel">Cancel</button>
                <button class="btn-modal btn-modal--confirm">Sign Out</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Get buttons
    const cancelBtn = modal.querySelector('.btn-modal--cancel');
    const confirmBtn = modal.querySelector('.btn-modal--confirm');
    
    // Cancel button - close modal
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Confirm button - proceed with logout
    confirmBtn.addEventListener('click', () => {
        // Clear session storage and local storage
        sessionStorage.clear();
        localStorage.removeItem('sidebarCollapsed');
        
        // Clear browser history and navigate to logout
        if (window.history && window.history.pushState) {
            window.history.pushState(null, null, window.location.href);
            window.location.replace(logoutUrl);
        } else {
            window.location.href = logoutUrl;
        }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });
}

/**
 * Forms Management - Tab Filtering
 */
function initFormsTabs() {
    console.log('=== FORMS TABS INITIALIZATION ===');
    
    const tabs = document.querySelectorAll('.forms-tab');
    const formCards = document.querySelectorAll('.form-card');
    
    console.log('Found tabs:', tabs.length);
    console.log('Found form cards:', formCards.length);
    
    if (!tabs.length) {
        console.log('No tabs found - skipping');
        return;
    }
    
    if (!formCards.length) {
        console.log('No form cards found - tabs still active');
    }
    
    // Show all cards by default
    formCards.forEach(card => {
        card.style.display = 'block';
        console.log('Card status:', card.dataset.status);
    });
    
    // Remove any existing click handlers by cloning and replacing nodes
    tabs.forEach((tab) => {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
    });
    
    // Get the new tabs after replacement
    const newTabs = document.querySelectorAll('.forms-tab');
    const newFormCards = document.querySelectorAll('.form-card');
    
    // Add click handlers to each tab
    newTabs.forEach((tab, index) => {
        console.log(`Setting up tab ${index}:`, tab.dataset.tab);
        
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const filter = this.dataset.tab;
            console.log(`\n=== TAB CLICKED: ${filter} ===`);
            
            // Remove active class from all tabs
            newTabs.forEach(t => {
                t.classList.remove('forms-tab--active');
            });
            
            // Add active class to clicked tab
            this.classList.add('forms-tab--active');
            console.log('Active tab updated');
            
            // Filter cards
            let visibleCount = 0;
            newFormCards.forEach(card => {
                const status = card.dataset.status;
                let shouldShow = false;
                
                if (filter === 'all') {
                    shouldShow = true;
                } else if (filter === 'published' && status === 'published') {
                    shouldShow = true;
                } else if (filter === 'unpublished' && status === 'unpublished') {
                    shouldShow = true;
                }
                
                if (shouldShow) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            console.log(`Visible forms: ${visibleCount}`);
            
            // Show/hide empty state based on visible count
            const tabEmptyState = document.getElementById('tabEmptyState');
            const tabEmptyStateText = document.getElementById('tabEmptyStateText');
            
            if (tabEmptyState && visibleCount === 0 && newFormCards.length > 0) {
                // Update empty state message based on filter
                if (filter === 'published') {
                    tabEmptyStateText.textContent = 'No published forms yet. Publish an unpublished form to see it here.';
                } else if (filter === 'unpublished') {
                    tabEmptyStateText.textContent = 'No unpublished forms. Unpublish a form or create a new one to see it here.';
                } else {
                    tabEmptyStateText.textContent = 'No forms match the selected filter.';
                }
                tabEmptyState.style.display = 'flex';
            } else if (tabEmptyState) {
                tabEmptyState.style.display = 'none';
            }
        });
    });
    
    console.log('Forms tabs setup complete!');
}

/**
 * Form Actions - Edit, Delete
 */
function editForm(formId) {
    // Navigate to form builder with edit mode
    window.location.href = `/dashboard/faculty/form-builder/?edit=${formId}`;
}

function deleteForm(formId, formTitle) {
    if (typeof notificationManager === 'undefined') {
        if (confirm(`Are you sure you want to delete "${formTitle}"? This action cannot be undone.`)) {
            executeDeleteForm(formId);
        }
        return;
    }
    
    notificationManager.confirm(
        `Are you sure you want to delete "${formTitle}"? This action cannot be undone.`,
        () => executeDeleteForm(formId)
    );
}

function executeDeleteForm(formId) {
            // Get CSRF token
            const csrftoken = getCookie('csrftoken');
            
            // Show loading indicator
            showNotification('Deleting form...', 'loading');
    
            // Make API call to delete form
            fetch(`/api/forms/${formId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Form deleted successfully!', 'success');
                    // Remove the form card from DOM with animation
                    removeFormFromList(formId);
                    updateFormStatistics();
                } else {
                    showNotification('Error deleting form: ' + (data.error || 'Unknown error'), 'error');
                }
            })
            .catch(error => {  
                console.error('Error:', error);
                showNotification('Error deleting form. Please try again.', 'error');
            });
}

function publishForm(formId, formTitle) {
    if (typeof notificationManager === 'undefined') {
        if (confirm(`Publish "${formTitle}"? Students will be able to search and access this form.`)) {
            executePublishForm(formId);
        }
        return;
    }
    
    notificationManager.confirm(
        `Publish "${formTitle}"? Students will be able to search and access this form.`,
        () => executePublishForm(formId)
    );
}

function executePublishForm(formId) {
            const csrftoken = getCookie('csrftoken');
            
            showNotification('Publishing form...', 'loading');
            
            fetch(`/api/forms/${formId}/publish/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification(data.message || 'Form published successfully!', 'success');
                    // Update the form card in place
                    updateFormStatus(formId, 'published');
                    updateFormStatistics();
                    // Broadcast change to other tabs/pages
                    broadcastFormStatusChange(formId, 'published');
                } else {
                    showNotification(data.message || 'Error publishing form', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error publishing form. Please try again.', 'error');
            });
}

function unpublishForm(formId, formTitle) {
    if (typeof notificationManager === 'undefined') {
        if (confirm(`Unpublish "${formTitle}"? Students will no longer be able to access this form.`)) {
            executeUnpublishForm(formId);
        }
        return;
    }
    
    notificationManager.confirm(
        `Unpublish "${formTitle}"? Students will no longer be able to access this form.`,
        () => executeUnpublishForm(formId)
    );
}

function executeUnpublishForm(formId) {
            const csrftoken = getCookie('csrftoken');
            
            showNotification('Unpublishing form...', 'loading');
    
            fetch(`/api/forms/${formId}/unpublish/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification(data.message || 'Form unpublished successfully!', 'success');
                    // Update the form card in place
                    updateFormStatus(formId, 'unpublished');
                    updateFormStatistics();
                    // Broadcast change to other tabs/pages
                    broadcastFormStatusChange(formId, 'unpublished');
                } else {
                    showNotification(data.message || 'Error unpublishing form', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error unpublishing form. Please try again.', 'error');
            });
}

// Notification function removed - now using global notificationManager from notifications.js

/**
 * Fetch form details from server
 */
async function fetchFormDetails(formId) {
    const csrftoken = getCookie('csrftoken');
    
    try {
        const response = await fetch(`/api/forms/${formId}/details/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrftoken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch form details');
        }
    } catch (error) {
        console.error('Error fetching form details:', error);
        return null;
    }
}

/**
 * Create HTML for a form card
 */
function createFormCardHTML(form) {
    const status = form.privacy === 'private' ? 'unpublished' : 'published';
    const badge = status === 'unpublished' ? 'UNPUBLISHED' : 'PUBLISHED';
    const badgeClass = status === 'unpublished' ? 'unpublished' : 'published';
    
    const actionButtons = status === 'unpublished' 
        ? `<button class="btn-icon btn-icon--publish" title="Publish Form" onclick="publishForm(${form.id}, '${escapeHtml(form.title)}')">
                <i class="fas fa-upload"></i>
           </button>
           <button class="btn-icon btn-icon--edit" title="Edit Form" onclick="editForm(${form.id})">
                <i class="fas fa-edit"></i>
           </button>`
        : `<button class="btn-icon btn-icon--unpublish" title="Unpublish Form" onclick="unpublishForm(${form.id}, '${escapeHtml(form.title)}')">
                <i class="fas fa-download"></i>
           </button>`;
    
    const sectionCount = form.structure && form.structure.sections ? form.structure.sections.length : 0;
    const questionsText = sectionCount > 0 
        ? `${sectionCount} section${sectionCount !== 1 ? 's' : ''}`
        : 'Not configured';
    
    const footer = status !== 'unpublished' 
        ? `<div class="form-card__footer">
                <div class="form-card__stats">
                    <span class="stat-item">
                        <i class="fas fa-paper-plane"></i>
                        ${form.response_count || 0} submission${form.response_count !== 1 ? 's' : ''}
                    </span>
                </div>
                <a href="/dashboard/faculty/reports/?form=${form.id}" class="btn-link">View Submissions</a>
           </div>`
        : '';
    
    return `
        <div class="form-card" data-status="${status}" data-form-id="${form.id}">
            <div class="form-card__header">
                <div class="form-card__title-section">
                    <h3 class="form-card__title">${escapeHtml(form.title)}</h3>
                    <span class="form-card__badge form-card__badge--${badgeClass}">
                        ${badge}
                    </span>
                </div>
                <div class="form-card__actions">
                    ${actionButton}
                    <button class="btn-icon btn-icon--delete" title="Delete Form" onclick="deleteForm(${form.id}, '${escapeHtml(form.title)}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <p class="form-card__description">${escapeHtml(form.description || 'No description provided')}</p>
            
            <div class="form-card__info">
                <div class="form-info-item">
                    <span class="form-info-label">Course:</span>
                    <span class="form-info-value">${escapeHtml(form.course_id || 'N/A')}</span>
                </div>
                <div class="form-info-item">
                    <span class="form-info-label">Due Date:</span>
                    <span class="form-info-value">${form.due_date ? formatDate(form.due_date) : 'Not set'}</span>
                </div>
                <div class="form-info-item">
                    <span class="form-info-label">Questions:</span>
                    <span class="form-info-value">${questionsText}</span>
                </div>
                <div class="form-info-item">
                    <span class="form-info-label">Created:</span>
                    <span class="form-info-value">${formatDate(form.created_at)}</span>
                </div>
            </div>
            ${footer}
        </div>
    `;
}

/**
 * Add a new form to the forms list
 */
function addFormToList(form) {
    const formsList = document.querySelector('.forms-list');
    if (!formsList) return;
    
    // Check if main empty state exists and remove it (not the tab filter empty state)
    const emptyState = formsList.querySelector('.empty-state:not(.empty-state--tab-filter)');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Hide tab filter empty state
    const tabEmptyState = document.getElementById('tabEmptyState');
    if (tabEmptyState) {
        tabEmptyState.style.display = 'none';
    }
    
    // Create new form card
    const formCardHTML = createFormCardHTML(form);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formCardHTML;
    const formCard = tempDiv.firstElementChild;
    
    // Add with animation (insert after tab empty state if it exists)
    formCard.style.opacity = '0';
    formCard.style.transform = 'translateY(-20px)';
    if (tabEmptyState) {
        // Insert after the tab empty state
        tabEmptyState.after(formCard);
    } else {
        formsList.insertBefore(formCard, formsList.firstChild);
    }
    
    // Trigger animation
    setTimeout(() => {
        formCard.style.transition = 'all 0.3s ease';
        formCard.style.opacity = '1';
        formCard.style.transform = 'translateY(0)';
    }, 10);
    
    // Re-initialize tabs to include new card
    initFormsTabs();
}

/**
 * Remove a form from the forms list
 */
function removeFormFromList(formId) {
    const formCard = document.querySelector(`.form-card[data-form-id="${formId}"]`);
    if (!formCard) return;
    
    // Animate out
    formCard.style.transition = 'all 0.3s ease';
    formCard.style.opacity = '0';
    formCard.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        formCard.remove();
        
        // Check if no forms left, show empty state
        const formsList = document.querySelector('.forms-list');
        const remainingForms = formsList.querySelectorAll('.form-card');
        
        if (remainingForms.length === 0) {
            // Remove tab empty state if it exists
            const tabEmptyState = document.getElementById('tabEmptyState');
            if (tabEmptyState) {
                tabEmptyState.remove();
            }
            
            formsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">
                        <i class="far fa-file-alt"></i>
                    </div>
                    <h3 class="empty-state__title">No Forms Yet</h3>
                    <p class="empty-state__text">
                        Create your first evaluation form to get started.
                    </p>
                    <a href="/dashboard/faculty/form-builder/" class="btn-primary">
                        <i class="fas fa-plus"></i>
                        Create New Form
                    </a>
                </div>
            `;
        } else {
            // Check current active tab and show/hide tab empty state
            const activeTab = document.querySelector('.forms-tab--active');
            if (activeTab) {
                const filter = activeTab.dataset.tab;
                const visibleForms = Array.from(remainingForms).filter(form => {
                    const status = form.dataset.status;
                    if (filter === 'all') return true;
                    if (filter === 'published' && status === 'published') return true;
                    if (filter === 'drafts' && status === 'draft') return true;
                    return false;
                });
                
                const tabEmptyState = document.getElementById('tabEmptyState');
                const tabEmptyStateText = document.getElementById('tabEmptyStateText');
                
                if (tabEmptyState && visibleForms.length === 0) {
                    if (filter === 'published') {
                        tabEmptyStateText.textContent = 'No published forms yet. Publish a draft to see it here.';
                    } else if (filter === 'drafts') {
                        tabEmptyStateText.textContent = 'No draft forms yet. Unpublish a form or create a new one to see drafts here.';
                    }
                    tabEmptyState.style.display = 'flex';
                } else if (tabEmptyState) {
                    tabEmptyState.style.display = 'none';
                }
            }
        }
    }, 300);
}

/**
 * Update form status (publish/unpublish)
 */
function updateFormStatus(formId, newStatus) {
    const formCard = document.querySelector(`.form-card[data-form-id="${formId}"]`);
    if (!formCard) {
        console.error('Form card not found:', formId);
        return;
    }
    
    console.log('Updating form status:', formId, 'to', newStatus);
    
    // Update data attribute
    formCard.dataset.status = newStatus;
    
    // Update badge
    const badge = formCard.querySelector('.form-card__badge');
    const badgeClass = newStatus === 'unpublished' ? 'unpublished' : 'published';
    const badgeText = newStatus === 'unpublished' ? 'UNPUBLISHED' : 'PUBLISHED';
    
    // Force remove old classes first
    badge.classList.remove('form-card__badge--unpublished', 'form-card__badge--published', 'form-card__badge--draft');
    
    // Add new class
    badge.classList.add('form-card__badge', `form-card__badge--${badgeClass}`);
    
    // Update text content
    badge.textContent = badgeText;
    
    // Force browser reflow to ensure immediate rendering
    void badge.offsetHeight;
    
    console.log('Badge updated to:', badgeText, 'with class:', badgeClass);
    
    // Update action buttons
    const actionsDiv = formCard.querySelector('.form-card__actions');
    const actionButtons = newStatus === 'unpublished'
        ? `<button class="btn-icon btn-icon--publish" title="Publish Form" onclick="publishForm(${formId}, '${escapeHtml(formCard.querySelector('.form-card__title').textContent)}')">
                <i class="fas fa-upload"></i>
           </button>
           <button class="btn-icon btn-icon--edit" title="Edit Form" onclick="editForm(${formId})">
                <i class="fas fa-edit"></i>
           </button>`
        : `<button class="btn-icon btn-icon--unpublish" title="Unpublish Form" onclick="unpublishForm(${formId}, '${escapeHtml(formCard.querySelector('.form-card__title').textContent)}')">
                <i class="fas fa-download"></i>
           </button>`;
    
    // Get delete button (safely)
    const deleteBtn = actionsDiv.querySelector('.btn-icon--delete');
    
    const deleteButton = deleteBtn ? deleteBtn.outerHTML : '';
    
    actionsDiv.innerHTML = actionButtons + deleteButton;
    
    // Update footer (add/remove based on status)
    const existingFooter = formCard.querySelector('.form-card__footer');
    if (newStatus === 'published' && !existingFooter) {
        // Add footer
        const infoDiv = formCard.querySelector('.form-card__info');
        const footer = document.createElement('div');
        footer.className = 'form-card__footer';
        footer.innerHTML = `
            <div class="form-card__stats">
                <span class="stat-item">
                    <i class="fas fa-paper-plane"></i>
                    0 submissions
                </span>
            </div>
            <a href="/dashboard/faculty/reports/?form=${formId}" class="btn-link">View Submissions</a>
        `;
        infoDiv.after(footer);
    } else if (newStatus === 'unpublished' && existingFooter) {
        // Remove footer
        existingFooter.remove();
    }
    
    // Add animation effect
    formCard.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        formCard.style.animation = '';
    }, 500);
    
    // CRITICAL: Update card visibility based on active tab filter
    const activeTab = document.querySelector('.forms-tab--active');
    if (activeTab) {
        const filter = activeTab.dataset.tab;
        console.log('Active tab filter:', filter);
        console.log('Card new status:', newStatus);
        
        // Determine if this card should be visible with current filter
        let shouldBeVisible = false;
        if (filter === 'all') {
            shouldBeVisible = true;
        } else if (filter === 'published' && newStatus === 'published') {
            shouldBeVisible = true;
        } else if (filter === 'unpublished' && newStatus === 'unpublished') {
            shouldBeVisible = true;
        }
        
        console.log('Should card be visible:', shouldBeVisible);
        
        // Update visibility immediately
        formCard.style.display = shouldBeVisible ? 'block' : 'none';
        
        // Count all visible forms after update
        const allFormCards = document.querySelectorAll('.form-card');
        const visibleForms = Array.from(allFormCards).filter(form => {
            const status = form.dataset.status;
            if (filter === 'all') return true;
            if (filter === 'published' && status === 'published') return true;
            if (filter === 'drafts' && status === 'draft') return true;
            return false;
        });
        
        console.log('Visible forms count:', visibleForms.length);
        
        // Update tab empty state
        const tabEmptyState = document.getElementById('tabEmptyState');
        const tabEmptyStateText = document.getElementById('tabEmptyStateText');
        
        if (tabEmptyState && visibleForms.length === 0 && allFormCards.length > 0) {
            if (filter === 'published') {
                tabEmptyStateText.textContent = 'No published forms yet. Publish a draft to see it here.';
            } else if (filter === 'drafts') {
                tabEmptyStateText.textContent = 'No draft forms yet. Unpublish a form or create a new one to see drafts here.';
            }
            tabEmptyState.style.display = 'flex';
            console.log('Showing tab empty state');
        } else if (tabEmptyState) {
            tabEmptyState.style.display = 'none';
            console.log('Hiding tab empty state');
        }
    }
}

/**
 * Update form statistics
 */
function updateFormStatistics() {
    const formCards = document.querySelectorAll('.form-card');
    const totalForms = formCards.length;
    const publishedForms = document.querySelectorAll('.form-card[data-status="published"]').length;
    const draftForms = document.querySelectorAll('.form-card[data-status="draft"]').length;
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 3) {
        statCards[0].querySelector('.stat-card__value').textContent = totalForms;
        statCards[1].querySelector('.stat-card__value').textContent = publishedForms;
        statCards[2].querySelector('.stat-card__value').textContent = draftForms;
    }
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Utility: Format date string
 */
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Get CSRF token from cookies
 */
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

/**
 * Initialize cross-tab synchronization
 * Listen for form status changes from other dashboard tabs
 */
function initCrossTabSync() {
    // Listen for storage events from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'formStatusChanged') {
            try {
                const data = JSON.parse(e.newValue);
                console.log('Received form status change from another tab:', data);
                // Update this tab's UI
                updateFormStatus(data.formId, data.newStatus);
                updateFormStatistics();
            } catch (error) {
                console.error('Error parsing form status change:', error);
            }
        }
    });
    
    console.log('Cross-tab synchronization initialized');
}

/**
 * Broadcast form status change to other tabs/pages via localStorage
 */
function broadcastFormStatusChange(formId, newStatus) {
    const changeData = {
        formId: formId,
        newStatus: newStatus,
        timestamp: Date.now()
    };
    
    console.log('📡 Broadcasting form status change:', changeData);
    console.log('📡 Setting to localStorage key: formStatusChanged');
    
    // Set to localStorage - this will trigger 'storage' event in other tabs
    localStorage.setItem('formStatusChanged', JSON.stringify(changeData));
    
    // Verify it was set
    const verification = localStorage.getItem('formStatusChanged');
    console.log('📡 Verification - localStorage now contains:', verification);
    
    // Clean up after 5 seconds
    setTimeout(() => {
        const current = localStorage.getItem('formStatusChanged');
        if (current) {
            try {
                const data = JSON.parse(current);
                if (data.formId === formId && data.timestamp === changeData.timestamp) {
                    localStorage.removeItem('formStatusChanged');
                    console.log('🧹 Cleaned up localStorage for formId:', formId);
                }
            } catch (e) {
                console.error('Error cleaning up localStorage:', e);
            }
        }
    }, 5000);
}

// ============================================
// STUDENT DASHBOARD JAVASCRIPT
// ============================================

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    console.log('Student Dashboard Initialized');
    
    // Initialize all components
    initSidebar();
    initNotifications();
    initSearch();
    initFilters();
    initEvaluations();
    initUserActions();
}

// ===== SIDEBAR FUNCTIONALITY =====
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    
    // Toggle sidebar collapse on desktop
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            if (window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            } else {
                // Mobile: toggle sidebar visibility
                sidebar.classList.toggle('mobile-open');
            }
        });
    }
    
    // Restore sidebar state from localStorage
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true' && window.innerWidth > 768) {
        sidebar.classList.add('collapsed');
    }
    
    // Handle sidebar link clicks
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('sidebar__link--active'));
            
            // Add active class to clicked link (unless it's sign out)
            if (!this.classList.contains('sidebar__link--signout')) {
                this.classList.add('sidebar__link--active');
            }
            
            // On mobile, close sidebar after clicking
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });
    
    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
}

// ===== NOTIFICATIONS =====
function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const closeNotifications = document.getElementById('closeNotifications');
    const notificationBadge = document.querySelector('.notification__badge');
    
    // Toggle notification dropdown
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = notificationDropdown.style.display === 'block';
            notificationDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    // Close notification dropdown
    if (closeNotifications) {
        closeNotifications.addEventListener('click', function() {
            notificationDropdown.style.display = 'none';
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
            notificationDropdown.style.display = 'none';
        }
    });
    
    // Mark notification as read when clicked
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.remove('notification-item--unread');
            updateNotificationBadge();
        });
    });
    
    // Update notification badge count
    function updateNotificationBadge() {
        const unreadCount = document.querySelectorAll('.notification-item--unread').length;
        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount;
                notificationBadge.style.display = 'block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    }
}

// ===== SEARCH FUNCTIONALITY =====
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            console.log('Searching for:', searchTerm);
            
            // TODO: Implement actual search functionality
            // This could filter evaluations, groups, etc.
            filterEvaluations(searchTerm);
        }, 300));
    }
}

// ===== FILTER TABS =====
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-tabs__button');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('filter-tabs__button--active'));
            
            // Add active class to clicked button
            this.classList.add('filter-tabs__button--active');
            
            // Get filter type
            const filterType = this.getAttribute('data-filter');
            console.log('Filter selected:', filterType);
            
            // Apply filter
            applyFilter(filterType);
        });
    });
}

function applyFilter(filterType) {
    // TODO: Implement actual filtering logic based on filterType
    // For now, just log the filter
    console.log('Applying filter:', filterType);
    
    // Example: You could show/hide evaluations based on filter
    // const evaluationCards = document.querySelectorAll('.evaluation-card');
    // evaluationCards.forEach(card => {
    //     // Apply your filtering logic here
    // });
}

// ===== EVALUATIONS =====
function initEvaluations() {
    const viewPendingBtn = document.getElementById('viewPendingBtn');
    
    if (viewPendingBtn) {
        viewPendingBtn.addEventListener('click', function() {
            console.log('Navigating to pending evaluations...');
            // TODO: Navigate to pending evaluations page
            window.location.href = '#pending';
        });
    }
    
    // Load evaluations from server
    loadEvaluations();
}

function loadEvaluations() {
    // TODO: Replace with actual API call to fetch evaluations
    // For now, we'll use mock data
    
    const mockEvaluations = [
        // Uncomment to test with data:
        // {
        //     id: 1,
        //     title: 'Software Engineering Project',
        //     date: 'Oct 10, 2025',
        //     group: 'Team Alpha',
        //     membersEvaluated: 4
        // },
        // {
        //     id: 2,
        //     title: 'Database Systems',
        //     date: 'Oct 8, 2025',
        //     group: 'Team Beta',
        //     membersEvaluated: 5
        // }
    ];
    
    if (mockEvaluations.length > 0) {
        displayEvaluations(mockEvaluations);
    } else {
        showEmptyState();
    }
}

function displayEvaluations(evaluations) {
    const emptyState = document.getElementById('emptyState');
    const evaluationList = document.getElementById('evaluationList');
    
    // Hide empty state
    emptyState.style.display = 'none';
    
    // Show evaluation list
    evaluationList.style.display = 'grid';
    
    // Clear existing cards
    evaluationList.innerHTML = '';
    
    // Create evaluation cards
    evaluations.forEach(evaluation => {
        const card = createEvaluationCard(evaluation);
        evaluationList.appendChild(card);
    });
}

function createEvaluationCard(evaluation) {
    const card = document.createElement('div');
    card.className = 'evaluation-card';
    card.setAttribute('data-evaluation-id', evaluation.id);
    
    card.innerHTML = `
        <div class="evaluation-card__header">
            <h3 class="evaluation-card__title">${evaluation.title}</h3>
            <span class="evaluation-card__date">Completed: ${evaluation.date}</span>
        </div>
        <div class="evaluation-card__body">
            <p class="evaluation-card__info">
                <strong>Group:</strong> ${evaluation.group}
            </p>
            <p class="evaluation-card__info">
                <strong>Members Evaluated:</strong> ${evaluation.membersEvaluated}
            </p>
        </div>
        <div class="evaluation-card__footer">
            <button class="btn btn--secondary btn--sm view-details-btn">View Details</button>
        </div>
    `;
    
    // Add event listener to view details button
    const viewDetailsBtn = card.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', function() {
        viewEvaluationDetails(evaluation.id);
    });
    
    return card;
}

function showEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const evaluationList = document.getElementById('evaluationList');
    
    emptyState.style.display = 'flex';
    evaluationList.style.display = 'none';
}

function viewEvaluationDetails(evaluationId) {
    console.log('Viewing details for evaluation:', evaluationId);
    // TODO: Navigate to evaluation details page or open modal
    // window.location.href = `/evaluations/${evaluationId}`;
}

function filterEvaluations(searchTerm) {
    const evaluationCards = document.querySelectorAll('.evaluation-card');
    
    if (!searchTerm) {
        // Show all cards if search is empty
        evaluationCards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    // Filter cards based on search term
    evaluationCards.forEach(card => {
        const title = card.querySelector('.evaluation-card__title').textContent.toLowerCase();
        const group = card.querySelector('.evaluation-card__info').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || group.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===== USER ACTIONS =====
function initUserActions() {
    const signOutBtn = document.getElementById('signOutBtn');
    const userProfile = document.querySelector('.topnav__user');
    
    // Sign out functionality - just use the href link directly
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function(e) {
            const confirmed = confirm('Are you sure you want to sign out?');
            if (!confirmed) {
                e.preventDefault();
            }
            // If confirmed, let the link navigate to logout URL
        });
    }
    
    // User profile click (could open dropdown menu)
    if (userProfile) {
        userProfile.addEventListener('click', function() {
            console.log('User profile clicked');
            // TODO: Implement user profile dropdown/menu
        });
    }
}

function handleSignOut() {
    // This function is no longer needed but kept for backward compatibility
    return true;
}

// ===== UTILITY FUNCTIONS =====

// Debounce function for search input
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

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Show loading state
function showLoading() {
    const evaluationContainer = document.querySelector('.evaluation-container');
    evaluationContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--color-text-secondary);">Loading evaluations...</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    const evaluationContainer = document.querySelector('.evaluation-container');
    evaluationContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--color-danger); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--color-text-primary); margin-bottom: 0.5rem;">Error</h3>
            <p style="color: var(--color-text-secondary);">${message}</p>
        </div>
    `;
}

// ===== API CALLS (TODO: Implement actual API integration) =====

async function fetchEvaluations() {
    try {
        showLoading();
        
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/evaluations/history/');
        // const data = await response.json();
        
        // For now, simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const data = []; // Empty for now
        
        if (data.length > 0) {
            displayEvaluations(data);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        showError('Failed to load evaluations. Please try again later.');
    }
}

async function fetchNotifications() {
    try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/notifications/');
        // const data = await response.json();
        // return data;
        
        return []; // Empty for now
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

// ===== EXPORT FOR USE IN OTHER FILES =====
window.DashboardAPI = {
    loadEvaluations,
    fetchEvaluations,
    fetchNotifications,
    formatDate
};

console.log('Student Dashboard JS Loaded Successfully');

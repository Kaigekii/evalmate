/**
 * Faculty Dashboard - EvalMate
 * Interactive functionality for the faculty dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initSidebar();
    initSearch();
    initQuickActions();
    initRecentActivities();
    initNavigation();
});

/**
 * Initialize navigation functionality
 */
function initNavigation() {
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    
    sidebarLinks.forEach(link => {
        // Skip if it's a regular URL (not hash)
        if (!link.getAttribute('href').startsWith('#')) {
            return; // Allow regular URLs to work normally
        }
        
        // For hash URLs, handle them specially
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                // Handle navigation for hash links
                console.log('Navigation to:', targetId);
            }
        });
    });
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
 * Search Bar Functionality
 */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;

    // Debounce search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            
            if (query.length > 0) {
                performSearch(query);
            } else {
                clearSearch();
            }
        }, 300); // Wait 300ms after user stops typing
    });

    // Handle search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
                performSearch(query);
            }
        }
    });
}

/**
 * Perform search operation
 */
function performSearch(query) {
    console.log('Searching for:', query);
    
    // TODO: Implement actual search functionality
    // This will search through evaluations, groups, students, etc.
    // For now, just log the query
    
    // Example: Filter activities based on search
    const activities = document.querySelectorAll('.activity-card');
    let visibleCount = 0;
    
    activities.forEach(activity => {
        const title = activity.querySelector('.activity-card__title')?.textContent.toLowerCase() || '';
        const meta = activity.querySelector('.activity-card__meta')?.textContent.toLowerCase() || '';
        
        if (title.includes(query.toLowerCase()) || meta.includes(query.toLowerCase())) {
            activity.style.display = 'flex';
            visibleCount++;
        } else {
            activity.style.display = 'none';
        }
    });
    
    // Show/hide empty state based on results
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        if (visibleCount === 0 && activities.length > 0) {
            emptyState.style.display = 'flex';
            emptyState.querySelector('.empty-state__title').textContent = 'No Results Found';
            emptyState.querySelector('.empty-state__text').textContent = `No activities match "${query}"`;
        } else {
            emptyState.style.display = 'none';
        }
    }
}

/**
 * Clear search results
 */
function clearSearch() {
    const activities = document.querySelectorAll('.activity-card');
    activities.forEach(activity => {
        activity.style.display = 'flex';
    });
    
    // Reset empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState && activities.length === 0) {
        emptyState.style.display = 'flex';
        emptyState.querySelector('.empty-state__title').textContent = 'No Recent Activities';
        emptyState.querySelector('.empty-state__text').textContent = 'When students submit evaluations, they\'ll appear here.';
    } else if (emptyState) {
        emptyState.style.display = 'none';
    }
}

/**
 * Quick Actions Functionality
 */
function initQuickActions() {
    const actionCards = document.querySelectorAll('.action-card');
    
    actionCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.action-card__title').textContent;
            handleQuickAction(title);
        });
    });
}

/**
 * Handle quick action clicks
 */
function handleQuickAction(actionTitle) {
    console.log('Quick action clicked:', actionTitle);
    
    // TODO: Implement navigation or modal opening based on action
    if (actionTitle.includes('Create New Evaluation')) {
        // Navigate to form builder or open creation modal
        console.log('Opening evaluation creation form...');
        // window.location.href = '/form-builder/create';
    } else if (actionTitle.includes('View Reports')) {
        // Navigate to reports page
        console.log('Opening reports page...');
        // window.location.href = '/reports';
    }
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
 * Sign Out Confirmation (optional enhancement)
 */
function initSignOut() {
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            // Optional: Add confirmation dialog
            // const confirmed = confirm('Are you sure you want to sign out?');
            // if (!confirmed) {
            //     e.preventDefault();
            // }
        });
    }
}

// Initialize sign out
initSignOut();

/**
 * Student Dashboard - Single Page Application
 * EvalMate
 */

document.addEventListener('DOMContentLoaded', () => {
    initSPA();
    initDashboard();
    loadStats();
    loadDeadlines();
});

// ==================== SPA Navigation ====================

function initSPA() {
    // Get all sidebar navigation links
    const navLinks = document.querySelectorAll('.sidebar__link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const section = link.dataset.section;
            navigateToSection(section);
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            showSection(e.state.section, false);
        }
    });
    
    // Initialize first section based on hash
    const hash = window.location.hash.substring(1);
    if (hash && ['overview', 'pending', 'history', 'profile'].includes(hash)) {
        showSection(hash, true);
    } else {
        showSection('overview', true);
    }
}

function navigateToSection(sectionName) {
    showSection(sectionName, true);
}

function showSection(sectionName, updateHistory = true) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('content-section--active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('content-section--active');
    }
    
    // Update active nav link
    document.querySelectorAll('.sidebar__link').forEach(link => {
        link.classList.remove('sidebar__link--active');
    });
    
    const activeLink = document.querySelector(`.sidebar__link[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('sidebar__link--active');
    }
    
    // Update browser history
    if (updateHistory) {
        const newUrl = `#${sectionName}`;
        history.pushState({ section: sectionName }, '', newUrl);
    }
    
    // Load section-specific content
    loadSectionContent(sectionName);
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function loadSectionContent(sectionName) {
    switch(sectionName) {
        case 'overview':
            loadStats();
            loadDeadlines();
            break;
        case 'pending':
            loadPendingEvaluations();
            break;
        case 'history':
            loadHistory();
            break;
        case 'profile':
            initProfile();
            break;
    }
}

// ==================== Overview Section ====================

function initDashboard() {
    // Update date
    updateCurrentDate();
    
    // Initialize search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Notification bell
    document.getElementById('notificationBtn')?.addEventListener('click', () => {
        alert('Notifications feature coming soon!');
    });
}

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString('en-US', options);
    }
}

async function loadStats() {
    try {
        // TODO: Replace with actual API call
        const stats = {
            pending: 0,
            completed: 0,
            completionRate: 0
        };
        
        // Update UI
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('completionRate').textContent = stats.completionRate + '%';
        
        // Update notification badge
        const badge = document.getElementById('notificationBadge');
        if (badge && stats.pending > 0) {
            badge.textContent = stats.pending;
            badge.style.display = 'block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadDeadlines() {
    try {
        // TODO: Replace with actual API call
        const deadlines = [];
        
        const emptyState = document.getElementById('emptyDeadlines');
        const deadlinesList = document.getElementById('deadlinesList');
        
        if (deadlines.length === 0) {
            emptyState.style.display = 'flex';
            deadlinesList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            deadlinesList.style.display = 'block';
            renderDeadlines(deadlines);
        }
    } catch (error) {
        console.error('Error loading deadlines:', error);
    }
}

function renderDeadlines(deadlines) {
    const deadlinesList = document.getElementById('deadlinesList');
    deadlinesList.innerHTML = '';
    
    deadlines.forEach(deadline => {
        const card = createDeadlineCard(deadline);
        deadlinesList.appendChild(card);
    });
}

function createDeadlineCard(deadline) {
    const card = document.createElement('div');
    card.className = 'deadline-card';
    card.innerHTML = `
        <div class="deadline-card__header">
            <h3 class="deadline-card__title">${deadline.title}</h3>
            <span class="deadline-card__badge">${deadline.status}</span>
        </div>
        <div class="deadline-card__body">
            <p class="deadline-card__course">${deadline.course}</p>
            <p class="deadline-card__due">Due: ${deadline.dueDate}</p>
        </div>
    `;
    return card;
}

// ==================== Pending Evaluations Section ====================

function loadPendingEvaluations(filter = 'all') {
    // Initialize filters
    const filterButtons = document.querySelectorAll('#pendingSection .filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Initialize sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    // Initialize refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadPendingEvaluations();
            updateLastUpdated();
        });
    }
    
    // Update last updated time
    updateLastUpdated();
    
    // Load evaluations
    fetchPendingEvaluations(filter);
}

function handleFilterClick(event) {
    document.querySelectorAll('#pendingSection .filter-btn').forEach(btn => {
        btn.classList.remove('filter-btn--active');
    });
    
    event.target.classList.add('filter-btn--active');
    const filter = event.target.dataset.filter;
    fetchPendingEvaluations(filter);
}

function handleSortChange(event) {
    const sortBy = event.target.value;
    console.log('Sort by:', sortBy);
    // TODO: Implement sorting
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = timeString;
    }
}

async function fetchPendingEvaluations(filter = 'all') {
    try {
        // TODO: Replace with actual API call
        const evaluations = [];
        
        // Update stats
        const totalPendingEl = document.getElementById('totalPending');
        const dueTodayEl = document.getElementById('dueToday');
        
        if (totalPendingEl) totalPendingEl.textContent = evaluations.length;
        if (dueTodayEl) dueTodayEl.textContent = evaluations.filter(e => e.dueToday).length || 0;
        
        // Update UI
        const emptyState = document.getElementById('emptyStatePending');
        const evaluationsList = document.getElementById('evaluationsList');
        
        if (evaluations.length === 0) {
            emptyState.style.display = 'flex';
            evaluationsList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            evaluationsList.style.display = 'block';
            renderEvaluations(evaluations);
        }
    } catch (error) {
        console.error('Error loading evaluations:', error);
    }
}

function renderEvaluations(evaluations) {
    const evaluationsList = document.getElementById('evaluationsList');
    evaluationsList.innerHTML = '';
    
    evaluations.forEach(evaluation => {
        const card = createEvaluationCard(evaluation);
        evaluationsList.appendChild(card);
    });
}

function createEvaluationCard(evaluation) {
    const card = document.createElement('div');
    card.className = 'evaluation-card';
    card.innerHTML = `
        <div class="evaluation-card__header">
            <h3>${evaluation.title}</h3>
            <span class="badge badge--${evaluation.status}">${evaluation.status}</span>
        </div>
        <div class="evaluation-card__body">
            <p><strong>Course:</strong> ${evaluation.course}</p>
            <p><strong>Due:</strong> ${evaluation.dueDate}</p>
        </div>
        <div class="evaluation-card__footer">
            <button class="btn btn--primary">Start Evaluation</button>
        </div>
    `;
    return card;
}

// ==================== History Section ====================

function loadHistory(filter = 'all') {
    // Initialize filter buttons
    const filterButtons = document.querySelectorAll('#historySection .filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleHistoryFilterClick);
    });
    
    // Fetch history
    fetchHistory(filter);
}

function handleHistoryFilterClick(event) {
    document.querySelectorAll('#historySection .filter-btn').forEach(btn => {
        btn.classList.remove('filter-btn--active');
    });
    
    event.target.classList.add('filter-btn--active');
    const filter = event.target.dataset.filter;
    fetchHistory(filter);
}

async function fetchHistory(filter = 'all') {
    try {
        // TODO: Replace with actual API call
        const history = [];
        
        // Update UI
        const emptyState = document.getElementById('emptyStateHistory');
        const historyList = document.getElementById('historyList');
        
        if (history.length === 0) {
            emptyState.style.display = 'flex';
            historyList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            historyList.style.display = 'block';
            renderHistory(history);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function renderHistory(history) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const card = createHistoryCard(item);
        historyList.appendChild(card);
    });
}

function createHistoryCard(item) {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
        <div class="history-card__header">
            <h3>${item.title}</h3>
            <span class="history-card__date">Completed: ${item.completedDate}</span>
        </div>
        <div class="history-card__body">
            <p><strong>Course:</strong> ${item.course}</p>
            <p><strong>Group:</strong> ${item.group}</p>
            <p><strong>Members Evaluated:</strong> ${item.membersCount}</p>
        </div>
        <div class="history-card__footer">
            <button class="btn btn--secondary">View Details</button>
        </div>
    `;
    return card;
}

// ==================== Profile Section ====================

function initProfile() {
    initProfileTabs();
    initProfileForms();
    initProfilePicture();
}

function initProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', handleProfileTabClick);
    });
}

function handleProfileTabClick(event) {
    const tabName = event.currentTarget.dataset.tab;
    
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('profile-tab--active');
    });
    
    event.currentTarget.classList.add('profile-tab--active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('tab-content--active');
    });
    
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.classList.add('tab-content--active');
    }
}

function initProfileForms() {
    const personalForm = document.getElementById('personalInfoForm');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalInfoSubmit);
    }
    
    const academicForm = document.getElementById('academicInfoForm');
    if (academicForm) {
        academicForm.addEventListener('submit', handleAcademicInfoSubmit);
    }
    
    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
        alert('Change Password feature coming soon!');
    });
    
    document.getElementById('enable2FABtn')?.addEventListener('click', () => {
        alert('Two-Factor Authentication setup coming soon!');
    });
    
    document.getElementById('viewSessionsBtn')?.addEventListener('click', () => {
        alert('Active Sessions viewer coming soon!');
    });
}

async function handlePersonalInfoSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    console.log('Saving personal info:', data);
    
    try {
        // TODO: Replace with actual API call
        alert('Personal information saved successfully!');
    } catch (error) {
        console.error('Error saving personal info:', error);
        alert('Failed to save personal information. Please try again.');
    }
}

async function handleAcademicInfoSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    console.log('Saving academic info:', data);
    
    try {
        // TODO: Replace with actual API call
        alert('Academic information saved successfully!');
    } catch (error) {
        console.error('Error saving academic info:', error);
        alert('Failed to save academic information. Please try again.');
    }
}

function initProfilePicture() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('profilePictureInput');
    
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
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }
        
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            alert('Only JPG and PNG files are allowed');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatar = document.getElementById('profileAvatar');
            if (avatar) {
                avatar.style.backgroundImage = `url(${e.target.result})`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.textContent = '';
            }
        };
        reader.readAsDataURL(file);
        
        console.log('Uploading profile picture:', file.name);
    }
}

// ==================== Search ====================

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    console.log('Searching for:', query);
    // TODO: Implement search functionality
}

// ==================== Global Helper ====================

// Make navigateToSection available globally
window.navigateToSection = navigateToSection;

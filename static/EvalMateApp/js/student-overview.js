/**
 * Student Dashboard - Single Page Application
 * EvalMate
 */

document.addEventListener('DOMContentLoaded', () => {
    initSPA();
    initDashboard();
    loadStats();
    
    // Check if we need to show passcode modal (from direct URL navigation)
    if (window.passcodeModalData && window.passcodeModalData.form_id) {
        openPasscodeModal(
            window.passcodeModalData.form_id,
            window.passcodeModalData.form_title,
            window.passcodeModalData.form_description
        );
    }
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
    initSearch();
    
    // Notification bell
    document.getElementById('notificationBtn')?.addEventListener('click', () => {
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Notifications feature coming soon!', 'info');
        }
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
        // Fetch both pending and history to calculate stats
        const [pendingResponse, historyResponse] = await Promise.all([
            fetch('/api/student/pending-evaluations/'),
            fetch('/api/student/evaluation-history/')
        ]);
        
        if (!pendingResponse.ok || !historyResponse.ok) {
            throw new Error('Failed to load stats');
        }
        
        const pendingData = await pendingResponse.json();
        const historyData = await historyResponse.json();
        
        const pendingCount = pendingData.pending_evaluations.length;
        const completedCount = historyData.history.length;
        const totalCount = pendingCount + completedCount;
        const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        // Update UI
        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('completedCount').textContent = completedCount;
        document.getElementById('completionRate').textContent = completionRate + '%';
        
        // Update notification badge
        const badge = document.getElementById('notificationBadge');
        if (badge && pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Removed loadDeadlines, renderDeadlines, and createDeadlineCard functions
// Deadlines are now shown in the Pending Evaluations section

// ==================== Pending Evaluations Section ====================

// Track if listeners are already attached to prevent duplicates
let pendingFiltersInitialized = false;

function loadPendingEvaluations(filter = 'all') {
    // Initialize filters only once
    if (!pendingFiltersInitialized) {
        const filterButtons = document.querySelectorAll('#pendingSection .filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', handleFilterClick);
        });
        
        // Initialize sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', handleSortChange);
        }
        
        pendingFiltersInitialized = true;
    }
    
    // Load evaluations
    fetchPendingEvaluations(filter);
}

function handleFilterClick(event) {
    const filterButton = event.target;
    
    // Prevent multiple clicks during loading
    if (filterButton.disabled) return;
    
    // Update UI immediately
    document.querySelectorAll('#pendingSection .filter-btn').forEach(btn => {
        btn.classList.remove('filter-btn--active');
    });
    
    filterButton.classList.add('filter-btn--active');
    const filter = filterButton.dataset.filter;
    
    // If data already loaded, filter instantly without re-fetching
    if (allEvaluations.length > 0) {
        const loadingOverlay = document.getElementById('pendingLoadingOverlay');
        
        // Show brief loading state for visual feedback
        showFilterLoadingState('#pendingSection');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        currentFilter = filter;
        
        // Use timeout to allow loading overlay to display smoothly
        setTimeout(() => {
            applyFilterAndSort();
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            hideFilterLoadingState('#pendingSection');
        }, 150);
    } else {
        // First load - fetch data
        fetchPendingEvaluations(filter);
    }
}

function handleSortChange(event) {
    currentSort = event.target.value;
    // Apply sort instantly - no delay
    applyFilterAndSort();
}

// Store evaluations globally for sorting
let allEvaluations = [];
let currentFilter = 'all';
let currentSort = 'due_date';

// Helper functions for filter loading states
function showFilterLoadingState(sectionSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;
    
    const filterButtons = section.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
    });
    
    const sortSelect = section.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.disabled = true;
        sortSelect.style.opacity = '0.6';
    }
}

function hideFilterLoadingState(sectionSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;
    
    const filterButtons = section.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
    
    const sortSelect = section.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.disabled = false;
        sortSelect.style.opacity = '1';
    }
}

async function fetchPendingEvaluations(filter = 'all') {
    const evaluationsList = document.getElementById('evaluationsList');
    const emptyState = document.getElementById('emptyStatePending');
    const loadingOverlay = document.getElementById('pendingLoadingOverlay');
    
    try {
        currentFilter = filter;
        
        // Show loading overlay and disable filters
        showFilterLoadingState('#pendingSection');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        const response = await fetch('/api/student/pending-evaluations/', {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load pending evaluations');
        }
        
        const data = await response.json();
        allEvaluations = data.pending_evaluations || [];
        
        // Apply filter and render
        requestAnimationFrame(() => {
            applyFilterAndSort();
            // Hide loading overlay after rendering
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            hideFilterLoadingState('#pendingSection');
        });
        
        // Update stats
        const totalPendingEl = document.getElementById('totalPending');
        const dueTodayEl = document.getElementById('dueToday');
        const pendingCountEl = document.getElementById('pendingCount');
        
        const dueToday = allEvaluations.filter(e => e.days_left !== null && e.days_left === 0).length;
        
        if (totalPendingEl) totalPendingEl.textContent = allEvaluations.length;
        if (dueTodayEl) dueTodayEl.textContent = dueToday;
        if (pendingCountEl) pendingCountEl.textContent = allEvaluations.length;
    } catch (error) {
        console.error('Error loading evaluations:', error);
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        hideFilterLoadingState('#pendingSection');
        
        // Show error in evaluations list
        if (evaluationsList) {
            evaluationsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i><p>Failed to load evaluations. Please refresh the page.</p></div>';
            evaluationsList.style.display = 'block';
        }
        if (emptyState) emptyState.style.display = 'none';
    }
}

function applyFilterAndSort() {
    // Apply filter immediately (no delay)
    let filtered = allEvaluations;
    
    if (currentFilter === 'urgent') {
        // Urgent: 3 days or less
        filtered = allEvaluations.filter(e => e.days_left !== null && e.days_left <= 3);
    } else if (currentFilter === 'in-progress') {
        // In Progress: has draft
        filtered = allEvaluations.filter(e => e.has_draft === true);
    } else if (currentFilter === 'not-started') {
        // Not Started: no draft
        filtered = allEvaluations.filter(e => e.has_draft !== true);
    }
    // 'all' shows everything
    
    // Apply sort immediately
    filtered = sortEvaluations(filtered, currentSort);
    
    // Update UI with optimized rendering
    const emptyState = document.getElementById('emptyStatePending');
    const evaluationsList = document.getElementById('evaluationsList');
    
    if (!evaluationsList) return;
    
    if (filtered.length === 0) {
        emptyState.style.display = 'flex';
        evaluationsList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        evaluationsList.style.display = 'block';
        renderEvaluationsFast(filtered);
    }
}

// Optimized rendering using DocumentFragment
function renderEvaluationsFast(evaluations) {
    const evaluationsList = document.getElementById('evaluationsList');
    if (!evaluationsList) return;
    
    // Use DocumentFragment for batch DOM update (much faster)
    const fragment = document.createDocumentFragment();
    
    evaluations.forEach(evaluation => {
        const card = createEvaluationCard(evaluation);
        fragment.appendChild(card);
    });
    
    // Single DOM update
    evaluationsList.innerHTML = '';
    evaluationsList.appendChild(fragment);
}

function sortEvaluations(evaluations, sortBy) {
    const sorted = [...evaluations];
    
    if (sortBy === 'due_date') {
        // Sort by due date (earliest first, null last)
        sorted.sort((a, b) => {
            if (a.due_date === null && b.due_date === null) return 0;
            if (a.due_date === null) return 1;
            if (b.due_date === null) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        });
    } else if (sortBy === 'title') {
        // Sort by title (A-Z)
        sorted.sort((a, b) => {
            return a.title.localeCompare(b.title);
        });
    }
    
    return sorted;
}

function renderEvaluations(evaluations) {
    const evaluationsList = document.getElementById('evaluationsList');
    if (!evaluationsList) return;
    
    evaluationsList.innerHTML = '';
    
    evaluations.forEach(evaluation => {
        const card = createEvaluationCard(evaluation);
        evaluationsList.appendChild(card);
    });
}

function createEvaluationCard(evaluation) {
    const card = document.createElement('div');
    card.className = 'evaluation-card';
    
    // Check if expired
    const isExpired = evaluation.is_expired || false;
    
    // Determine urgency badge
    let urgencyBadge = '';
    let urgencyClass = '';
    if (isExpired) {
        urgencyBadge = '<span class="badge badge--danger">EXPIRED</span>';
        urgencyClass = 'evaluation-card--expired';
    } else if (evaluation.days_left !== null) {
        if (evaluation.days_left === 0) {
            urgencyBadge = '<span class="badge badge--danger">Due Today</span>';
            urgencyClass = 'evaluation-card--urgent';
        } else if (evaluation.days_left <= 2) {
            urgencyBadge = `<span class="badge badge--warning">${evaluation.days_left} day${evaluation.days_left > 1 ? 's' : ''} left</span>`;
            urgencyClass = 'evaluation-card--soon';
        } else {
            urgencyBadge = `<span class="badge badge--info">${evaluation.days_left} days left</span>`;
        }
    }
    
    card.className = `evaluation-card ${urgencyClass}`;
    
    // Truncate description
    const description = evaluation.description || 'No description provided';
    const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
    
    // Team settings
    const teamSettings = evaluation.team_settings || {};
    const teamSizeText = `${teamSettings.min_team_size || 'N/A'} - ${teamSettings.max_team_size || 'N/A'} members`;
    const selfEvalText = teamSettings.allow_self_evaluation ? 'Self-eval enabled' : 'Self-eval disabled';
    
    // Button text based on draft status and expiration
    let buttonText, buttonIcon, buttonDisabled;
    if (isExpired) {
        buttonText = 'Form Closed';
        buttonIcon = 'fa-lock';
        buttonDisabled = true;
    } else {
        buttonText = evaluation.has_draft ? 'Continue Evaluation' : 'Answer Evaluation';
        buttonIcon = evaluation.has_draft ? 'fa-play-circle' : 'fa-play';
        buttonDisabled = false;
    }
    
    // Add status badge for in-progress
    let statusBadge = '';
    if (evaluation.has_draft && !isExpired) {
        statusBadge = '<span class="badge badge--success" style="margin-left: 10px;"><i class="fas fa-pencil-alt"></i> Draft Saved</span>';
    }
    
    card.innerHTML = `
        <div class="evaluation-card__header">
            <div class="evaluation-card__title-row">
                <h3 class="evaluation-card__title">${escapeHtml(evaluation.title)}</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${urgencyBadge}
                    ${statusBadge}
                </div>
            </div>
            <div class="evaluation-card__meta">
                <span class="meta-item"><i class="fas fa-book"></i> ${escapeHtml(evaluation.course)}</span>
                <span class="meta-item"><i class="fas fa-users"></i> ${teamSizeText}</span>
                <span class="meta-item"><i class="fas ${teamSettings.allow_self_evaluation ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${selfEvalText}</span>
            </div>
        </div>
        <div class="evaluation-card__body">
            <p class="evaluation-card__description">${escapeHtml(truncatedDesc)}</p>
        </div>
        <div class="evaluation-card__footer">
            <button class="btn btn--primary" onclick="startEvaluation(${evaluation.form_id})" ${buttonDisabled ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                <i class="fas ${buttonIcon}"></i> ${buttonText}
            </button>
            <button class="btn btn--secondary btn--icon" onclick="removePendingEvaluation(${evaluation.id}, '${escapeHtml(evaluation.title)}')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `;
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function startEvaluation(formId) {
    window.location.href = `/forms/${formId}/eval/team-setup/`;
}

async function removePendingEvaluation(pendingId, title) {
    if (typeof notificationManager !== 'undefined') {
        notificationManager.confirm(
            `Remove "${title}" from your pending evaluations?`,
            async () => {
                try {
                    const response = await fetch(`/api/student/pending-evaluations/${pendingId}/remove/`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken'),
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to remove evaluation');
                    }
                    
                    notificationManager.show('Evaluation removed successfully!', 'success');
                    
                    // Reload pending evaluations
                    fetchPendingEvaluations();
                    loadStats(); // Update overview stats
                } catch (error) {
                    console.error('Error removing evaluation:', error);
                    notificationManager.show('Failed to remove evaluation. Please try again.', 'error');
                }
            }
        );
    } else {
        // Fallback to confirm dialog
        if (confirm(`Remove "${title}" from your pending evaluations?`)) {
            try {
                const response = await fetch(`/api/student/pending-evaluations/${pendingId}/remove/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to remove evaluation');
                }
                
                if (typeof notificationManager !== 'undefined') {
                    notificationManager.show('Evaluation removed successfully!', 'success');
                }
                
                // Reload pending evaluations
                fetchPendingEvaluations();
                loadStats(); // Update overview stats
            } catch (error) {
                console.error('Error removing evaluation:', error);
                if (typeof notificationManager !== 'undefined') {
                    notificationManager.show('Failed to remove evaluation. Please try again.', 'error');
                }
            }
        }
    }
}

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

function showNotification(message, type = 'info') {
    // Use NotificationManager if available
    if (typeof notificationManager !== 'undefined') {
        notificationManager.show(message, type);
    }
}

// ==================== History Section ====================

// Track if listeners are already attached to prevent duplicates
let historyFiltersInitialized = false;

function loadHistory(filter = 'all') {
    // Initialize filter buttons only once
    if (!historyFiltersInitialized) {
        const filterButtons = document.querySelectorAll('#historySection .filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', handleHistoryFilterClick);
        });
        historyFiltersInitialized = true;
    }
    
    // Fetch history
    fetchHistory(filter);
}

function handleHistoryFilterClick(event) {
    const filterButton = event.target;
    
    // Prevent multiple clicks during loading
    if (filterButton.disabled) return;
    
    // Update UI immediately
    document.querySelectorAll('#historySection .filter-btn').forEach(btn => {
        btn.classList.remove('filter-btn--active');
    });
    
    filterButton.classList.add('filter-btn--active');
    const filter = filterButton.dataset.filter;
    
    // Show loading state and fetch
    fetchHistory(filter);
}

async function fetchHistory(filter = 'all') {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyStateHistory');
    const loadingOverlay = document.getElementById('historyLoadingOverlay');
    
    try {
        // Show loading overlay and disable filters
        showFilterLoadingState('#historySection');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        const response = await fetch('/api/student/evaluation-history/', {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load evaluation history');
        }
        
        const data = await response.json();
        const allHistory = data.history || [];
        let history = allHistory;
        
        // Apply filter
        if (filter === 'recent') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            history = allHistory.filter(item => new Date(item.submitted_at) >= sevenDaysAgo);
        } else if (filter === 'by-course') {
            // Group by course (already sorted by date in API)
            history = allHistory;
        }
        
        // Update completed count - always show total, not filtered
        const completedCountEl = document.getElementById('completedCount');
        if (completedCountEl) completedCountEl.textContent = allHistory.length;
        
        // Update UI
        if (history.length === 0) {
            emptyState.style.display = 'flex';
            historyList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            historyList.style.display = 'block';
            renderHistory(history);
        }
        
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        hideFilterLoadingState('#historySection');
    } catch (error) {
        console.error('Error loading history:', error);
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        hideFilterLoadingState('#historySection');
        
        // Show error in history list
        if (historyList) {
            historyList.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i><p>Failed to load history. Please refresh the page.</p></div>';
            historyList.style.display = 'block';
        }
        if (emptyState) emptyState.style.display = 'none';
    }
}

function renderHistory(history) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    // Use DocumentFragment for optimized batch DOM update
    const fragment = document.createDocumentFragment();
    
    history.forEach(item => {
        const card = createHistoryCard(item);
        fragment.appendChild(card);
    });
    
    // Single DOM update for better performance
    historyList.innerHTML = '';
    historyList.appendChild(fragment);
}

function createHistoryCard(item) {
    const card = document.createElement('div');
    card.className = 'history-card';
    
    // Format date
    const submittedDate = new Date(item.submitted_at);
    const formattedDate = submittedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Truncate description
    const description = item.description || 'No description';
    const truncatedDesc = description.length > 80 ? description.substring(0, 80) + '...' : description;
    
    // Teammates evaluated text
    const teammatesText = item.teammates_evaluated ? `${item.teammates_evaluated} teammate${item.teammates_evaluated !== 1 ? 's' : ''}` : 'N/A';
    
    card.innerHTML = `
        <div class="history-card__header">
            <div class="history-card__icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="history-card__title-section">
                <h3 class="history-card__title">${escapeHtml(item.title)}</h3>
                <span class="history-card__date"><i class="far fa-clock"></i> ${formattedDate}</span>
            </div>
        </div>
        <div class="history-card__body">
            <div class="history-card__info">
                <span class="info-item"><i class="fas fa-book"></i> <strong>Course:</strong> ${escapeHtml(item.course)}</span>
                <span class="info-item"><i class="fas fa-users"></i> <strong>Team:</strong> ${escapeHtml(item.team_identifier)}</span>
                <span class="info-item"><i class="fas fa-user-check"></i> <strong>Evaluated:</strong> ${teammatesText}</span>
            </div>
            <p class="history-card__description">${escapeHtml(truncatedDesc)}</p>
        </div>
        <div class="history-card__footer">
            <span class="history-card__badge">
                <i class="fas fa-calendar-check"></i> Completed
            </span>
            <button class="btn--view-details" data-response-id="${item.response_id}">
                <i class="fas fa-eye"></i> View Details
            </button>
        </div>
    `;
    
    // Add click handler for view details button
    const viewBtn = card.querySelector('.btn--view-details');
    viewBtn.addEventListener('click', () => openEvaluationModal(item.response_id));
    
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
        setupAcademicFormEnhancements(academicForm);
    }
    
}

async function handlePersonalInfoSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    console.log('Saving personal info (phone and date of birth only)');
    try {
        const res = await fetch('/api/profile/update-personal/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save');
        
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

async function handleAcademicInfoSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);

    // Validate department is selected
    const departmentSelect = document.getElementById('department');
    if (departmentSelect && !departmentSelect.value) {
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Please select a department.', 'warning');
        }
        departmentSelect?.focus();
        return;
    }

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    console.log('Saving academic info (department and academic year only)');
    try {
        const res = await fetch('/api/profile/update-academic/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save');

        // Reflect saved values exactly as persisted by server
        if (json.department !== undefined && departmentSelect) {
            departmentSelect.value = json.department || '';
        }

        if (json.academic_year !== undefined) {
            const ay = document.getElementById('academicYear');
            if (ay) ay.value = json.academic_year || '';
        }

        // Show success notification
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Academic information saved successfully!', 'success');
            
            // If department changed and forms were removed, show additional info notification
            if (json.department_changed && json.removed_pending_forms && json.removed_pending_forms.length > 0) {
                // Create detailed message
                let detailMessage = `<strong>Department Changed</strong><br>${json.removed_pending_forms.length} form(s) removed from pending evaluations:<br>`;
                json.removed_pending_forms.forEach(form => {
                    detailMessage += `<br>• ${form.title}<br><small style="color: rgba(255,255,255,0.8); margin-left: 1rem;">Required: ${form.course_id}</small>`;
                });
                
                // Show info notification that stays longer
                notificationManager.show(detailMessage, 'info', 8000);
            }
        }
        
        // Refresh pending evaluations if any were removed
        if (json.removed_pending_forms && json.removed_pending_forms.length > 0) {
            if (typeof loadPendingEvaluations === 'function') {
                loadPendingEvaluations();
            }
        }
    } catch (error) {
        console.error('Error saving academic info:', error);
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show('Failed to save: ' + (error.message || 'Please try again'), 'error');
        }
    }
}

function setupAcademicFormEnhancements(academicForm) {
    // Department: populate based on user's institution
    const departmentSelect = document.getElementById('department');
    if (departmentSelect) {
        const userInstitution = departmentSelect.getAttribute('data-user-institution') || '';
        const currentDepartment = departmentSelect.getAttribute('data-current-department') || '';
        
        // Check if institutions data is available
        if (typeof institutionsData !== 'undefined' && userInstitution && institutionsData[userInstitution]) {
            // Populate departments for the user's institution
            const departments = institutionsData[userInstitution];
            
            // Clear existing options except the first one
            departmentSelect.innerHTML = '<option value="">Select Department</option>';
            
            // Add all departments for this institution
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                if (dept === currentDepartment) {
                    option.selected = true;
                }
                departmentSelect.appendChild(option);
            });
            
            // If current department is set but not in the list, add it and select it
            if (currentDepartment && !departments.includes(currentDepartment)) {
                const option = document.createElement('option');
                option.value = currentDepartment;
                option.textContent = currentDepartment + ' (Legacy)';
                option.selected = true;
                departmentSelect.appendChild(option);
            }
        } else {
            console.warn('Institutions data not available or institution not found:', userInstitution);
            // If institution data not available, just show current department
            if (currentDepartment) {
                const option = document.createElement('option');
                option.value = currentDepartment;
                option.textContent = currentDepartment;
                option.selected = true;
                departmentSelect.appendChild(option);
            }
        }
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
            if (typeof notificationManager !== 'undefined') {
                notificationManager.show('File size must be less than 5MB', 'error');
            }
            return;
        }
        
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            if (typeof notificationManager !== 'undefined') {
                notificationManager.show('Only JPG and PNG files are allowed', 'error');
            }
            return;
        }
        
        // Show immediate preview on profile page avatar
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
        
        // Upload to server
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        // Get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        
        console.log('Uploading profile picture:', file.name);
        
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
    // Find the top-right avatar in the navigation
    const topNavAvatar = document.querySelector('.topnav__user .user__avatar');
    
    if (topNavAvatar) {
        // Clear existing content and add image
        topNavAvatar.innerHTML = `<img src="${imageUrl}" alt="Profile Picture" class="user__avatar-img">`;
    }
}

// ==================== Search ====================

let searchTimeout = null;
let currentSearchIndex = -1;

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput) return;

    // Input handler with debouncing
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Show/hide clear button
        if (query.length > 0) {
            searchClear.classList.add('search-bar__clear--visible');
        } else {
            searchClear.classList.remove('search-bar__clear--visible');
            hideSearchResults();
            return;
        }

        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Clear button handler
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('search-bar__clear--visible');
        hideSearchResults();
        searchInput.focus();
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', handleSearchKeydown);

    // Click handler for search results (using event delegation)
    searchResults.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent click outside handler from firing
        
        const resultItem = e.target.closest('.search-result-item');
        if (!resultItem) return;

        const type = resultItem.dataset.type;
        
        if (type === 'form') {
            const formId = resultItem.dataset.formId;
            if (!formId) return;
            
            // Get form data from the rendered search results
            const formData = window.searchFormData?.find(f => f.id == formId);
            if (!formData) return;
            
            // Check if form is expired
            if (formData.is_expired) {
                const dueDate = formData.due_date_str || 'its due date';
                showNotification(`This form has already passed ${dueDate} and is no longer accepting responses.`, 'error');
                return;
            }
            
            // Check if already in pending - just show message, don't add again
            if (formData.is_pending) {
                showNotification('This form is already in your pending evaluations', 'info');
                return;
            }
            
            const formTitle = resultItem.querySelector('.search-result-item__title').textContent;
            
            if (formData.requires_passcode) {
                // Show passcode modal
                openPasscodeModal(formId, formTitle);
            } else {
                // No passcode required, show confirmation before adding
                const confirmed = confirm(`Do you want to add "${formTitle}" to your pending evaluations?`);
                
                if (confirmed) {
                    try {
                        const response = await fetch('/api/student/pending-evaluations/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: JSON.stringify({ form_id: formId })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            showNotification(data.message, 'success');
                            // Reload pending evaluations
                            loadPendingEvaluations();
                            // Hide search results
                            hideSearchResults();
                            // Clear search input
                            searchInput.value = '';
                            searchClear.classList.remove('search-bar__clear--visible');
                        } else {
                            showNotification(data.message || 'Failed to add form', 'error');
                        }
                    } catch (error) {
                        console.error('Error adding form to pending:', error);
                        showNotification('An error occurred. Please try again.', 'error');
                    }
                }
            }
        } else if (type === 'history') {
            // Open history detail modal
            const index = parseInt(resultItem.dataset.index);
            // You can implement modal opening here if needed
            console.log('History item clicked:', index);
        }
    });

    // Click outside to close (but not when clicking inside results)
    document.addEventListener('click', (e) => {
        const searchBar = searchInput.closest('.search-bar');
        const resultsEl = document.getElementById('searchResults');
        const clickedInsideBar = searchBar && searchBar.contains(e.target);
        const clickedInsideResults = resultsEl && resultsEl.contains(e.target);
        if (!clickedInsideBar && !clickedInsideResults) {
            hideSearchResults();
        }
    });
}

function handleSearch(event) {
    // Keep for backward compatibility
    const query = event.target.value.trim();
    if (query.length > 0) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    }
}

async function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    
    // Show loading state
    searchResults.innerHTML = `
        <div class="search-results__loading">
            <i class="fas fa-spinner"></i>
            <span>Searching...</span>
        </div>
    `;
    searchResults.classList.add('search-results--visible');
    currentSearchIndex = -1;

    try {
        // Search both forms and history in parallel
        const [formsResponse, historyResponse] = await Promise.all([
            fetch(`/forms/search/?q=${encodeURIComponent(query)}`),
            fetch(`/api/student/evaluation-history/`)
        ]);

        const formsData = await formsResponse.json();
        const historyData = await historyResponse.json();

        // Store forms data globally for passcode checking
        window.searchFormData = formsData.results || [];

        // Filter history by query
        const filteredHistory = historyData.history.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.course.toLowerCase().includes(query.toLowerCase()) ||
            item.team_identifier.toLowerCase().includes(query.toLowerCase())
        );

        renderSearchResults(formsData.results || [], filteredHistory);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `
            <div class="search-results__empty">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading search results</p>
            </div>
        `;
    }
}

function renderSearchResults(forms, history) {
    const searchResults = document.getElementById('searchResults');
    
    if (forms.length === 0 && history.length === 0) {
        searchResults.innerHTML = `
            <div class="search-results__empty">
                <i class="fas fa-search"></i>
                <p>No results found</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Render forms section
    if (forms.length > 0) {
        html += '<div class="search-results__section">';
        html += '<div class="search-results__section-title">Available Forms</div>';
        forms.forEach((form, index) => {
            const isPending = form.is_pending;
            const isExpired = form.is_expired;
            const departmentMismatch = form.department_mismatch || false;
            const expiredClass = isExpired ? ' search-result-item--expired' : '';
            const pendingClass = isPending ? ' search-result-item--already-pending' : '';
            const mismatchClass = departmentMismatch ? ' search-result-item--department-mismatch' : '';
            
            let badgeHtml = '';
            if (isExpired) {
                badgeHtml = `<span class="search-result-item__badge search-result-item__badge--expired">
                               <i class="fas fa-times-circle"></i> Expired
                           </span>`;
            } else if (departmentMismatch) {
                badgeHtml = `<span class="search-result-item__badge search-result-item__badge--warning" title="This form requires students from the ${escapeHtml(form.required_department)} department">
                               <i class="fas fa-exclamation-triangle"></i> Different Department Required
                           </span>`;
            } else if (isPending) {
                badgeHtml = `<span class="search-result-item__badge search-result-item__badge--already-pending">
                               <i class="fas fa-check"></i> Already in Pending
                           </span>`;
            } else {
                badgeHtml = `<span class="search-result-item__badge search-result-item__badge--available">
                               <i class="fas fa-plus-circle"></i> Available
                           </span>`;
            }
            
            // Add department requirement notice if there's a mismatch
            let departmentNotice = '';
            if (departmentMismatch && form.required_department) {
                departmentNotice = `<div class="search-result-item__warning">
                    <i class="fas fa-info-circle"></i> This form requires students from "${escapeHtml(form.required_department)}" department
                </div>`;
            }
            
            html += `
                <div class="search-result-item search-result-item--form${pendingClass}${expiredClass}${mismatchClass}" data-index="${index}" data-type="form" data-form-id="${form.id}" data-is-expired="${isExpired}" data-department-mismatch="${departmentMismatch}">
                    <div class="search-result-item__icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="search-result-item__content">
                        <div class="search-result-item__title">${escapeHtml(form.title)}</div>
                        <div class="search-result-item__meta">
                            <span><i class="fas fa-book"></i> ${escapeHtml(form.course_id)}</span>
                            ${badgeHtml}
                        </div>
                        ${departmentNotice}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Render history section
    if (history.length > 0) {
        html += '<div class="search-results__section">';
        html += '<div class="search-results__section-title">Completed Evaluations</div>';
        history.forEach((item, index) => {
            const date = new Date(item.submitted_at);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            html += `
                <div class="search-result-item search-result-item--history" data-index="${forms.length + index}" data-type="history">
                    <div class="search-result-item__icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="search-result-item__content">
                        <div class="search-result-item__title">${escapeHtml(item.title)}</div>
                        <div class="search-result-item__meta">
                            <span><i class="fas fa-book"></i> ${escapeHtml(item.course)}</span>
                            <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                            <span class="search-result-item__badge search-result-item__badge--completed">
                                <i class="fas fa-check"></i> Completed
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    searchResults.innerHTML = html;
}

function handleSearchKeydown(event) {
    const searchResults = document.getElementById('searchResults');
    const items = searchResults.querySelectorAll('.search-result-item');
    
    if (items.length === 0) return;

    switch(event.key) {
        case 'ArrowDown':
            event.preventDefault();
            currentSearchIndex = Math.min(currentSearchIndex + 1, items.length - 1);
            updateSearchSelection(items);
            break;
        
        case 'ArrowUp':
            event.preventDefault();
            currentSearchIndex = Math.max(currentSearchIndex - 1, -1);
            updateSearchSelection(items);
            break;
        
        case 'Escape':
            event.preventDefault();
            hideSearchResults();
            document.getElementById('searchInput').blur();
            break;
        
        case 'Enter':
            event.preventDefault();
            if (currentSearchIndex >= 0 && items[currentSearchIndex]) {
                // Future: Navigate to selected item
                console.log('Selected item:', currentSearchIndex);
            }
            break;
    }
}

function updateSearchSelection(items) {
    items.forEach((item, index) => {
        if (index === currentSearchIndex) {
            item.classList.add('search-result-item--active');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('search-result-item--active');
        }
    });
}

function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    searchResults.classList.remove('search-results--visible');
    searchResults.innerHTML = '';
    currentSearchIndex = -1;
}

// ==================== PASSCODE MODAL FUNCTIONS ====================

let currentFormId = null;

function openPasscodeModal(formId, formTitle) {
    currentFormId = formId;
    const modal = document.getElementById('passcodeModal');
    const title = document.getElementById('passcodeModalTitle');
    const description = document.getElementById('passcodeModalDescription');
    const input = document.getElementById('passcodeInput');
    const error = document.getElementById('passcodeError');
    
    title.textContent = formTitle || 'Secure Access Required';
    description.textContent = 'This evaluation requires a passcode to access.';
    input.value = '';
    input.classList.remove('input-error');
    error.style.display = 'none';
    
    modal.classList.add('modal-overlay--active');
    
    // Auto-focus input after animation
    setTimeout(() => {
        input.focus();
    }, 150);
}

function closePasscodeModal() {
    const modal = document.getElementById('passcodeModal');
    const input = document.getElementById('passcodeInput');
    const error = document.getElementById('passcodeError');
    
    modal.classList.remove('modal-overlay--active');
    input.value = '';
    input.classList.remove('input-error');
    error.style.display = 'none';
    currentFormId = null;
}

function togglePasscodeVisibility() {
    const input = document.getElementById('passcodeInput');
    const icon = document.getElementById('passcodeToggleIcon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

async function submitPasscode(event) {
    event.preventDefault();
    
    const input = document.getElementById('passcodeInput');
    const error = document.getElementById('passcodeError');
    const errorText = document.getElementById('passcodeErrorText');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const passcode = input.value.trim();
    
    // Remove error state
    input.classList.remove('input-error');
    
    if (!passcode || passcode.length !== 6) {
        showPasscodeError('Please enter a 6-digit passcode.');
        input.classList.add('input-error');
        return;
    }
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Verifying...</span>';
    error.style.display = 'none';
    
    try {
        const formData = new FormData();
        formData.append('passcode', passcode);
        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
        
        const response = await fetch(`/forms/${currentFormId}/access/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Success - close modal and reload pending evaluations
            closePasscodeModal();
            showNotification(data.message || 'Form added to pending evaluations!', 'success');
            // Reload pending evaluations
            loadPendingEvaluations();
            // Hide search results and clear search
            hideSearchResults();
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');
            if (searchInput) {
                searchInput.value = '';
                searchClear?.classList.remove('search-bar__clear--visible');
            }
        } else {
            // Invalid passcode
            showPasscodeError(data.error || 'Invalid passcode. Please try again.');
            input.classList.add('input-error');
            input.value = '';
            input.focus();
        }
    } catch (error) {
        console.error('Error submitting passcode:', error);
        showPasscodeError('An error occurred. Please try again.');
        input.classList.add('input-error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>Verify & Continue</span>';
    }
}

function showPasscodeError(message) {
    const error = document.getElementById('passcodeError');
    const errorText = document.getElementById('passcodeErrorText');
    
    errorText.textContent = message;
    error.style.display = 'flex';
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const passcodeModal = document.getElementById('passcodeModal');
        if (passcodeModal.classList.contains('modal-overlay--active')) {
            closePasscodeModal();
        }
    }
});

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/\"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// ==================== Sign Out Modal ====================

/**
 * Initialize sign out button
 */
function initSignOut() {
    const signOutBtns = document.querySelectorAll('.sidebar__link--signout');
    
    signOutBtns.forEach(btn => {
        if (!btn.dataset.initialized) {
            btn.dataset.initialized = 'true';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showSignOutModal(btn.href);
            });
        }
    });
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
        localStorage.clear();
        
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

// ==================== Modal for Evaluation Details ====================

async function openEvaluationModal(responseId) {
    const modalOverlay = document.getElementById('evaluationModal');
    const modalBody = document.getElementById('evaluationModalBody');
    
    // Show modal with loading state
    modalOverlay.classList.add('modal-overlay--active');
    modalBody.innerHTML = '<div class="modal__loading"><i class="fas fa-spinner"></i><p>Loading evaluation details...</p></div>';
    
    try {
        const response = await fetch(`/api/student/evaluation-history/${responseId}/`);
        if (!response.ok) {
            throw new Error('Failed to load evaluation details');
        }
        
        const data = await response.json();
        renderEvaluationDetails(data);
    } catch (error) {
        console.error('Error loading evaluation details:', error);
        modalBody.innerHTML = '<div class="modal__loading"><p style="color: #e74c3c;">Failed to load evaluation details. Please try again.</p></div>';
    }
}

function renderEvaluationDetails(data) {
    const modalBody = document.getElementById('evaluationModalBody');
    const modalTitle = document.getElementById('evaluationModalTitle');
    
    // Set modal title
    modalTitle.textContent = data.form_title;
    
    // Helper function to render answer based on question type
    const renderAnswer = (answer) => {
        const type = answer.question_type;
        const answerValue = answer.answer || 'No answer provided';
        
        if (type === 'rating') {
            // Parse the answer value (should be a number 1-5)
            const rating = parseInt(answerValue) || 0;
            const labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
            let ratingHTML = '<div class="rating-display">';
            for (let i = 1; i <= 5; i++) {
                const selected = i === rating ? 'rating-box-selected' : '';
                ratingHTML += `
                    <div class="rating-box ${selected}">
                        <div class="rating-num">${i}</div>
                        <div class="rating-text">${labels[i-1]}</div>
                    </div>
                `;
            }
            ratingHTML += '</div>';
            return ratingHTML;
        } else if (type === 'multiple') {
            // Multiple choice - need to show all options with selected one
            const options = answer.options || [];
            let multipleHTML = '<div class="multiple-display">';
            options.forEach(option => {
                const selected = option === answerValue ? 'option-selected' : '';
                multipleHTML += `
                    <div class="option-box ${selected}">
                        <span class="radio-circle"></span>
                        <span>${escapeHtml(option)}</span>
                    </div>
                `;
            });
            multipleHTML += '</div>';
            return multipleHTML;
        } else if (type === 'checkbox') {
            // Checkbox - multiple selections
            const options = answer.options || [];
            const selectedValues = answerValue.split(',').map(v => v.trim());
            let checkboxHTML = '<div class="checkbox-display">';
            options.forEach(option => {
                const selected = selectedValues.includes(option) ? 'option-selected' : '';
                checkboxHTML += `
                    <div class="option-box ${selected}">
                        <span class="check-square"></span>
                        <span>${escapeHtml(option)}</span>
                    </div>
                `;
            });
            checkboxHTML += '</div>';
            return checkboxHTML;
        } else if (type === 'slider') {
            // Slider display
            const value = parseInt(answerValue) || 0;
            const max = answer.max || 100;
            const labels = answer.labels || ['Min', 'Max'];
            const percent = (value / max) * 100;
            return `
                <div class="slider-display">
                    <div class="slider-labels">
                        <span>${escapeHtml(labels[0])}</span>
                        <span>${escapeHtml(labels[1])}</span>
                    </div>
                    <div class="slider-bar">
                        <div class="slider-fill" style="width: ${percent}%;"></div>
                        <div class="slider-handle" style="left: ${percent}%;"></div>
                    </div>
                    <div class="slider-val">${value}</div>
                </div>
            `;
        } else {
            // Text, textarea, or other types
            return `<div class="text-answer">${escapeHtml(answerValue)}</div>`;
        }
    };
    
    // Build teammates sections HTML
    let teammatesHTML = '';
    data.teammates.forEach((teammate, index) => {
        let answersHTML = '';
        
        teammate.answers.forEach((answer, idx) => {
            answersHTML += `
                <div class="response-item">
                    <div class="response-number">${idx + 1}</div>
                    <div class="response-content">
                        <div class="response-question">
                            <strong>${escapeHtml(answer.question_text)}</strong>
                        </div>
                        <div class="response-answer">
                            ${renderAnswer(answer)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        teammatesHTML += `
            <div class="eval-teammate-section">
                <div class="eval-teammate-header">
                    <div class="eval-teammate-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3 class="eval-teammate-name">${escapeHtml(teammate.teammate_name)}</h3>
                </div>
                <div class="responses-container">
                    ${answersHTML}
                </div>
            </div>
        `;
    });
    
    // Render full modal content
    modalBody.innerHTML = `
        <div class="eval-meta-section">
            <div class="eval-meta-item">
                <i class="fas fa-book"></i>
                <span class="eval-meta-label">Course:</span>
                <span class="eval-meta-value">${escapeHtml(data.course)}</span>
            </div>
            <div class="eval-meta-item">
                <i class="fas fa-users"></i>
                <span class="eval-meta-label">Team:</span>
                <span class="eval-meta-value">${escapeHtml(data.team_identifier)}</span>
            </div>
            <div class="eval-meta-item">
                <i class="fas fa-user-check"></i>
                <span class="eval-meta-label">Teammates Evaluated:</span>
                <span class="eval-meta-value">${data.total_teammates}</span>
            </div>
        </div>
        
        ${data.description ? `<div class="eval-description">${escapeHtml(data.description)}</div>` : ''}
        
        ${teammatesHTML}
    `;
}

function closeEvaluationModal() {
    const modalOverlay = document.getElementById('evaluationModal');
    modalOverlay.classList.remove('modal-overlay--active');
}

// Initialize sign out when DOM is ready
initSignOut();

// ==================== Global Helper ====================

// Make navigateToSection available globally
window.navigateToSection = navigateToSection;

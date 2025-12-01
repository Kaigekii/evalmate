/**
 * Student Dashboard - Single Page Application
 * EvalMate
 */

document.addEventListener('DOMContentLoaded', () => {
    initSPA();
    initDashboard();
    loadStats();
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
    
    // Load evaluations
    fetchPendingEvaluations(filter);
}

function handleFilterClick(event) {
    // Update UI immediately
    document.querySelectorAll('#pendingSection .filter-btn').forEach(btn => {
        btn.classList.remove('filter-btn--active');
    });
    
    event.target.classList.add('filter-btn--active');
    const filter = event.target.dataset.filter;
    
    // If data already loaded, filter instantly without re-fetching
    if (allEvaluations.length > 0) {
        currentFilter = filter;
        applyFilterAndSort();
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

async function fetchPendingEvaluations(filter = 'all') {
    const evaluationsList = document.getElementById('evaluationsList');
    const emptyState = document.getElementById('emptyStatePending');
    
    try {
        currentFilter = filter;
        
        // Show loading state
        if (evaluationsList) {
            evaluationsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i><p>Loading evaluations...</p></div>';
            evaluationsList.style.display = 'block';
        }
        if (emptyState) emptyState.style.display = 'none';
        
        const response = await fetch('/api/student/pending-evaluations/', {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load pending evaluations');
        }
        
        const data = await response.json();
        allEvaluations = data.pending_evaluations || [];
        
        // Apply filter and render immediately
        requestAnimationFrame(() => {
            applyFilterAndSort();
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
        if (evaluationsList) {
            evaluationsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i><p>Failed to load evaluations. Please refresh the page.</p></div>';
        }
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
    
    // Determine urgency badge
    let urgencyBadge = '';
    let urgencyClass = '';
    if (evaluation.days_left !== null) {
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
    
    // Button text based on draft status
    const buttonText = evaluation.has_draft ? 'Continue Evaluation' : 'Answer Evaluation';
    const buttonIcon = evaluation.has_draft ? 'fa-play-circle' : 'fa-play';
    
    // Add status badge for in-progress
    let statusBadge = '';
    if (evaluation.has_draft) {
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
            <button class="btn btn--primary" onclick="startEvaluation(${evaluation.form_id})">
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
    if (!confirm(`Remove "${title}" from your pending evaluations?`)) {
        return;
    }
    
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
        
        // Reload pending evaluations
        fetchPendingEvaluations();
        loadStats(); // Update overview stats
    } catch (error) {
        console.error('Error removing evaluation:', error);
        alert('Failed to remove evaluation. Please try again.');
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
        const response = await fetch('/api/student/evaluation-history/');
        if (!response.ok) {
            throw new Error('Failed to load evaluation history');
        }
        
        const data = await response.json();
        let history = data.history || [];
        
        // Apply filter
        if (filter === 'recent') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            history = history.filter(item => new Date(item.submitted_at) >= sevenDaysAgo);
        } else if (filter === 'by-course') {
            // Group by course (already sorted by date in API)
            history = history;
        }
        
        // Update completed count
        const completedCountEl = document.getElementById('completedCount');
        if (completedCountEl) completedCountEl.textContent = history.length;
        
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
    const data = Object.fromEntries(formData);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    console.log('Saving personal info:', data);
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
        // Update top bar name immediately
        document.querySelectorAll('.user__name').forEach(el => el.textContent = `${data.first_name} ${data.last_name}`);
        alert('Personal information saved successfully!');
    } catch (error) {
        console.error('Error saving personal info:', error);
        alert('Failed to save personal information. ' + (error.message || 'Please try again.'));
    }
}

async function handleAcademicInfoSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);

    // Normalize Major: if 'Other' selected, use custom text
    const majorSelect = document.getElementById('major');
    const majorOther = document.getElementById('majorOther');
    if (majorSelect && majorSelect.value === 'Other') {
        const customMajor = (majorOther?.value || '').trim();
        if (customMajor.length === 0) {
            alert('Please specify your major.');
            majorOther?.focus();
            return;
        }
        formData.set('major', customMajor);
    }

    // Normalize GPA: clamp 0–4 and round to 2 decimals
    const gpaEl = document.getElementById('currentGPA');
    if (gpaEl && gpaEl.value !== '') {
        let g = Number(gpaEl.value);
        if (isNaN(g)) {
            alert('Invalid GPA value.');
            gpaEl.focus();
            return;
        }
        g = Math.max(0, Math.min(4, g));
        g = Math.round(g * 100) / 100;
        const gStr = g.toFixed(2);
        gpaEl.value = gStr;
        formData.set('current_gpa', gStr);
    }

    // Validate Expected Graduation (optional): ensure yyyy-mm-dd or empty
    const eg = document.getElementById('expectedGraduation');
    if (eg && eg.value) {
        const valid = /^\d{4}-\d{2}-\d{2}$/.test(eg.value);
        if (!valid) {
            alert('Expected Graduation must be a valid date (YYYY-MM-DD).');
            eg.focus();
            return;
        }
    }

    const data = Object.fromEntries(formData);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    console.log('Saving academic info:', data);
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
        if (json.major !== undefined) {
            const builtinOptions = Array.from(majorSelect.options).map(o => o.value);
            if (builtinOptions.includes(json.major)) {
                majorSelect.value = json.major || '';
                if (majorOther) {
                    majorOther.style.display = 'none';
                    majorOther.value = '';
                }
            } else if (json.major) {
                majorSelect.value = 'Other';
                if (majorOther) {
                    majorOther.style.display = 'block';
                    majorOther.value = json.major;
                }
            }
        }

        if (json.academic_year !== undefined) {
            const ay = document.getElementById('academicYear');
            if (ay) ay.value = json.academic_year || '';
        }

        if (json.expected_graduation !== undefined) {
            const egVal = (json.expected_graduation || '').slice(0, 10);
            const eg = document.getElementById('expectedGraduation');
            if (eg) eg.value = egVal;
        }

        if (json.current_gpa !== undefined) {
            const gpaEl2 = document.getElementById('currentGPA');
            if (gpaEl2) gpaEl2.value = json.current_gpa || '';
        }

        alert('Academic information saved successfully!');
    } catch (error) {
        console.error('Error saving academic info:', error);
        alert('Failed to save academic information. ' + (error.message || 'Please try again.'));
    }
}

function setupAcademicFormEnhancements(academicForm) {
    // Set min date for Expected Graduation to today
    const eg = document.getElementById('expectedGraduation');
    if (eg) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        eg.min = `${yyyy}-${mm}-${dd}`;
    }

    // Major: toggle Other input
    const majorSelect = document.getElementById('major');
    const majorOther = document.getElementById('majorOther');
    if (majorSelect) {
        const builtinValues = Array.from(majorSelect.options).map(o => o.value).filter(Boolean);
        const currentMajor = majorSelect.getAttribute('data-current-major') || '';
        // If current major is non-empty and not in builtin list, select Other and display custom
        if (currentMajor && !builtinValues.includes(currentMajor)) {
            majorSelect.value = 'Other';
            if (majorOther) {
                majorOther.style.display = 'block';
                majorOther.value = currentMajor;
            }
        }

        const toggleOther = () => {
            if (!majorOther) return;
            if (majorSelect.value === 'Other') {
                majorOther.style.display = 'block';
                majorOther.focus();
            } else {
                majorOther.style.display = 'none';
                majorOther.value = '';
            }
        };
        majorSelect.addEventListener('change', toggleOther);
        toggleOther();
    }

    // GPA formatting on blur
    const gpaEl = document.getElementById('currentGPA');
    if (gpaEl) {
        const format = () => {
            if (gpaEl.value === '') return;
            let g = Number(gpaEl.value);
            if (isNaN(g)) return;
            g = Math.max(0, Math.min(4, g));
            gpaEl.value = (Math.round(g * 100) / 100).toFixed(2);
        };
        gpaEl.addEventListener('blur', format);
        // Initial normalization of prefilled value
        format();
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
                alert('Profile picture updated successfully!');
            } else {
                console.error('Upload failed:', data.error);
                alert('Failed to upload profile picture: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            alert('Failed to upload profile picture. Please try again.');
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

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!searchInput.closest('.search-bar').contains(e.target)) {
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
            const pendingClass = isPending ? ' search-result-item--already-pending' : '';
            const badgeHtml = isPending 
                ? `<span class="search-result-item__badge search-result-item__badge--already-pending">
                       <i class="fas fa-check"></i> Already in Pending
                   </span>`
                : `<span class="search-result-item__badge search-result-item__badge--available">
                       <i class="fas fa-plus-circle"></i> Available
                   </span>`;
            
            html += `
                <div class="search-result-item search-result-item--form${pendingClass}" data-index="${index}" data-type="form" data-form-id="${form.id}">
                    <div class="search-result-item__icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="search-result-item__content">
                        <div class="search-result-item__title">${escapeHtml(form.title)}</div>
                        <div class="search-result-item__meta">
                            <span><i class="fas fa-book"></i> ${escapeHtml(form.course_id)}</span>
                            ${badgeHtml}
                        </div>
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
    
    // Build teammates sections HTML
    let teammatesHTML = '';
    data.teammates.forEach((teammate, index) => {
        const submittedDate = new Date(teammate.submitted_at);
        const formattedDate = submittedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let answersHTML = '';
        teammate.answers.forEach(answer => {
            answersHTML += `
                <div class="answer-item">
                    <div class="answer-question">${escapeHtml(answer.question)}</div>
                    <div class="answer-text">${escapeHtml(answer.answer || 'No answer provided')}</div>
                </div>
            `;
        });
        
        teammatesHTML += `
            <div class="teammate-section">
                <div class="teammate-header">
                    <i class="fas fa-user-circle"></i>
                    <h3 class="teammate-name">${escapeHtml(teammate.teammate_name)}</h3>
                    <span class="teammate-date">${formattedDate}</span>
                </div>
                ${answersHTML}
            </div>
        `;
    });
    
    // Render full modal content
    modalBody.innerHTML = `
        <div class="modal__meta">
            <div class="modal__meta-item">
                <div class="modal__meta-label">Course</div>
                <div class="modal__meta-value">${escapeHtml(data.course)}</div>
            </div>
            <div class="modal__meta-item">
                <div class="modal__meta-label">Team</div>
                <div class="modal__meta-value">${escapeHtml(data.team_identifier)}</div>
            </div>
            <div class="modal__meta-item">
                <div class="modal__meta-label">Teammates Evaluated</div>
                <div class="modal__meta-value">${data.total_teammates}</div>
            </div>
        </div>
        
        ${data.description ? `<div class="modal__description">${escapeHtml(data.description)}</div>` : ''}
        
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

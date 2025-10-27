/**
 * Faculty Dashboard - SPA Navigation
 * Uses history.replaceState to avoid stacking pages
 * Back button always returns to Overview
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initSPANavigation();
});

/**
 * Sidebar Toggle Functionality
 */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (!sidebar || !sidebarToggle) return;

    // Toggle sidebar on logo click
    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
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
}

/**
 * SPA Navigation - Intercepts clicks and loads content via AJAX
 * Uses replaceState to prevent history stacking
 */
function initSPANavigation() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Intercept all sidebar link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.sidebar__link');
        if (!link) return;

        // Don't intercept logout links
        const href = link.getAttribute('href');
        if (!href || href.includes('logout')) {
            return; // Let it navigate normally
        }

        // Prevent default navigation
        e.preventDefault();

        // Load the new page content
        loadPage(href, link);
    });

    // Handle browser back button - load the previous page from state
    window.addEventListener('popstate', (e) => {
        const state = e.state;
        if (state && state.url) {
            // Load the page from state
            const mainContent = document.querySelector('.main-content');
            fetch(state.url)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newContent = doc.querySelector('.main-content');
                    
                    if (newContent) {
                        mainContent.innerHTML = newContent.innerHTML;
                        updateActiveLink(null);
                        reinitializeScripts(state.url);
                    }
                });
        } else {
            // No state, go to overview
            window.location.href = '/dashboard/faculty/';
        }
    });
}

/**
 * Load page content via AJAX
 */
function loadPage(url, clickedLink) {
    const mainContent = document.querySelector('.main-content');
    const overviewUrl = '/dashboard/faculty/';
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            // Parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract the main content
            const newContent = doc.querySelector('.main-content');
            
            if (newContent) {
                // Replace the content
                mainContent.innerHTML = newContent.innerHTML;
                
                // If we're not on overview, push state with overview as the previous page
                if (url !== overviewUrl) {
                    // First ensure overview is in history
                    history.replaceState({ url: overviewUrl }, '', overviewUrl);
                    // Then push the new page
                    history.pushState({ url: url }, '', url);
                } else {
                    // If we're going to overview, just replace state
                    history.replaceState({ url: url }, '', url);
                }
                
                // Update active link in sidebar
                updateActiveLink(clickedLink);
                
                // Reinitialize page-specific scripts
                reinitializeScripts(url);
            } else {
                // If we can't find main-content, do a full page load
                window.location.href = url;
            }
        })
        .catch(error => {
            console.error('Error loading page:', error);
            // Fallback to normal navigation
            window.location.href = url;
        });
}

/**
 * Update active link styling
 */
function updateActiveLink(clickedLink) {
    // Remove active class from all links
    document.querySelectorAll('.sidebar__link').forEach(link => {
        link.classList.remove('sidebar__link--active');
    });
    
    // Add active class to clicked link
    if (clickedLink) {
        clickedLink.classList.add('sidebar__link--active');
    }
}

/**
 * Reinitialize page-specific JavaScript
 */
function reinitializeScripts(url) {
    // For form builder page
    if (url.includes('form-builder')) {
        // Look for the form-builder script and reinitialize
        const scripts = document.querySelectorAll('.main-content script');
        scripts.forEach(script => {
            if (script.src && script.src.includes('form-builder.js')) {
                // Reload the form builder script
                const newScript = document.createElement('script');
                newScript.src = script.src;
                document.body.appendChild(newScript);
            } else if (script.textContent) {
                // Execute inline scripts
                eval(script.textContent);
            }
        });
    }
    
    // Add other page-specific initializations here as needed
}

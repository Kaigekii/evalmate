/**
 * Faculty Dashboard - SPA Navigation
 * Uses history.replaceState to avoid stacking pages
 * Back button always returns to Overview
 */

// Preload common CSS and pages for instant navigation
function preloadCommonResources() {
    const staticBase = '/static/EvalMateApp/css/';
    const cssFiles = [
        'form-builder.css',
        'reports.css',
        'student-overview.css'
    ];
    
    cssFiles.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'style';
        link.href = staticBase + file;
        document.head.appendChild(link);
    });
    
    // Preload common pages in background for instant switching
    setTimeout(() => {
        preloadPage('/dashboard/faculty/form-builder/');
        preloadPage('/dashboard/faculty/reports/');
    }, 1000); // Wait 1 second after page load, then preload
}

/**
 * Preload a page in the background and cache it
 */
function preloadPage(url) {
    if (pageCache.has(url)) return; // Already cached
    
    fetch(url, {
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.main-content');
        
        if (content) {
            // Load CSS for this page
            loadPageSpecificCSS(doc).then(() => {
                // Cache the page
                pageCache.set(url, {
                    content: content.innerHTML,
                    timestamp: Date.now()
                });
                console.log('Preloaded:', url);
            });
        }
    })
    .catch(err => console.log('Preload failed:', url));
}

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initSPANavigation();
    preloadCommonResources(); // Preload CSS and pages for instant transitions
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

    // Preload on hover for instant switching
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('.sidebar__link');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (href && !href.includes('logout') && !pageCache.has(href)) {
            preloadPage(href);
        }
    });
    
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

        // Load the new page content (will be instant if cached)
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
                        // Load CSS first and wait
                        loadPageSpecificCSS(doc).then(() => {
                            mainContent.innerHTML = newContent.innerHTML;
                            updateActiveLink(null);
                            reinitializeScripts(state.url, doc);
                        });
                    }
                });
        } else {
            // No state, go to overview
            window.location.href = '/dashboard/faculty/';
        }
    });
}

/**
 * Cache for storing page content
 */
const pageCache = new Map();

/**
 * Load page content via AJAX with INSTANT switching
 */
function loadPage(url, clickedLink) {
    const mainContent = document.querySelector('.main-content');
    const loadingBar = document.getElementById('spaLoadingBar');
    const overviewUrl = '/dashboard/faculty/';
    
    // INSTANT: Check if page is in cache
    if (pageCache.has(url)) {
        // INSTANT RENDER from cache - NO DELAY
        const cachedData = pageCache.get(url);
        mainContent.innerHTML = cachedData.content;
        
        // Update history
        if (url !== overviewUrl) {
            history.replaceState({ url: overviewUrl }, '', overviewUrl);
            history.pushState({ url: url }, '', url);
        } else {
            history.replaceState({ url: url }, '', url);
        }
        
        updateActiveLink(clickedLink);
        callPageInitFunction(url);
        
        return; // Done instantly!
    }
    
    // NOT IN CACHE - Still switch INSTANTLY with loading placeholder
    // Show a minimal placeholder instantly
    const placeholder = `
        <div style="padding: 2rem; text-align: center; opacity: 0.7;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚡</div>
            <div>Loading...</div>
        </div>
    `;
    
    // INSTANT page switch to placeholder
    mainContent.innerHTML = placeholder;
    
    // Show progress bar
    if (loadingBar) loadingBar.style.width = '50%';
    
    // Update history immediately
    if (url !== overviewUrl) {
        history.replaceState({ url: overviewUrl }, '', overviewUrl);
        history.pushState({ url: url }, '', url);
    } else {
        history.replaceState({ url: url }, '', url);
    }
    
    updateActiveLink(clickedLink);
    
    // Now fetch the real content in background
    fetch(url, {
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
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
                // Load page-specific CSS files first and wait for them
                loadPageSpecificCSS(doc).then(() => {
                    // Cache the page content for instant future access
                    pageCache.set(url, {
                        content: newContent.innerHTML,
                        timestamp: Date.now()
                    });
                    
                    // Replace the content after CSS is loaded
                    mainContent.innerHTML = newContent.innerHTML;
                    
                    // Complete loading bar
                    if (loadingBar) {
                        loadingBar.style.width = '100%';
                        setTimeout(() => {
                            loadingBar.style.width = '0';
                        }, 200);
                    }
                    
                    // Remove loading state
                    mainContent.style.opacity = '1';
                    mainContent.style.pointerEvents = 'auto';
                    
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
                    reinitializeScripts(url, doc);
                });
            } else {
                // If we can't find main-content, do a full page load
                window.location.href = url;
            }
        })
        .catch(error => {
            console.error('Error loading page:', error);
            if (loadingBar) loadingBar.style.width = '0';
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
 * Track loaded CSS files globally
 */
const globalLoadedCSS = new Set();

/**
 * Load page-specific CSS files
 * Returns a promise that resolves when all CSS files are loaded
 * Optimized: Returns immediately if all CSS is already loaded
 */
function loadPageSpecificCSS(doc) {
    // Get all link elements from the new page
    const newLinks = doc.querySelectorAll('link[rel="stylesheet"]');
    const promises = [];
    
    // Add new CSS files that aren't already loaded
    newLinks.forEach(link => {
        const href = link.href;
        
        // Skip fonts and icons
        if (href.includes('font-awesome') || 
            href.includes('fonts.googleapis') ||
            href.includes('fonts.gstatic')) {
            return;
        }
        
        // Only load if not already in the global set
        if (!globalLoadedCSS.has(href)) {
            globalLoadedCSS.add(href);
            
            const promise = new Promise((resolve, reject) => {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = href;
                newLink.setAttribute('data-spa-css', 'true');
                
                newLink.onload = () => resolve();
                newLink.onerror = () => resolve(); // Don't block on error
                
                document.head.appendChild(newLink);
            });
            
            promises.push(promise);
        }
    });
    
    // If no new CSS to load, resolve immediately
    if (promises.length === 0) {
        return Promise.resolve();
    }
    
    // Return promise that resolves when all CSS is loaded
    return Promise.all(promises);
}

/**
 * Track which scripts have been loaded globally
 */
const globalLoadedScripts = new Set();

/**
 * Reinitialize page-specific JavaScript
 * Optimized to avoid reloading scripts that are already loaded
 */
function reinitializeScripts(url, doc) {
    // Get scripts from the new page document
    const newScripts = doc.querySelectorAll('script[src]');
    const scriptsToLoad = [];
    
    // Check which scripts need to be loaded
    newScripts.forEach(script => {
        const src = script.src;
        
        // Skip base scripts that should never be reloaded
        if (src.includes('spa-router.js') || 
            src.includes('jquery') ||
            src.includes('font-awesome')) {
            return;
        }
        
        // Only load page-specific scripts if not already loaded
        if ((src.includes('form-builder') || 
             src.includes('student-overview') || 
             src.includes('faculty-dashboard')) &&
            !globalLoadedScripts.has(src)) {
            
            scriptsToLoad.push(src);
            globalLoadedScripts.add(src);
        }
    });
    
    // If scripts need to be loaded, load them
    if (scriptsToLoad.length > 0) {
        const promises = scriptsToLoad.map(src => {
            return new Promise((resolve, reject) => {
                const newScript = document.createElement('script');
                newScript.src = src;
                newScript.setAttribute('data-spa-script', 'true');
                newScript.async = false;
                newScript.onload = () => resolve();
                newScript.onerror = () => resolve(); // Resolve even on error
                document.body.appendChild(newScript);
            });
        });
        
        // Wait for all scripts to load, then initialize
        Promise.all(promises).then(() => {
            callPageInitFunction(url);
        });
    } else {
        // Scripts already loaded, just call init function immediately
        callPageInitFunction(url);
    }
    
    // Execute inline scripts from the main content
    const inlineScripts = doc.querySelectorAll('.main-content script:not([src])');
    inlineScripts.forEach(script => {
        try {
            eval(script.textContent);
        } catch (e) {
            console.error('Error executing inline script:', e);
        }
    });
}

/**
 * Call the appropriate page initialization function
 */
function callPageInitFunction(url) {
    // Use requestAnimationFrame for optimal timing - runs before next paint
    requestAnimationFrame(() => {
        if (url.includes('form-builder') && typeof initFormBuilder === 'function') {
            initFormBuilder();
        } else if (url.includes('student-overview') && typeof initStudentOverview === 'function') {
            initStudentOverview();
        } else if (typeof initFacultyDashboard === 'function') {
            initFacultyDashboard();
        }
    });
}

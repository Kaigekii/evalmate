/**
 * Faculty Dashboard - True SPA with Instant Page Switching
 * Loads content via API and switches views instantly in the browser
 */

(function() {
    'use strict';
    
    // Page cache for instant switching
    const pageCache = new Map();
    
    // Loaded CSS and JS files tracking
    const loadedCSS = new Set();
    const loadedJS = new Set();
    
    // Route mapping
    const routes = {
        '/dashboard/faculty/': {
            api: '/api/faculty/overview-content/',
            name: 'overview'
        },
        '/dashboard/faculty/form-builder/': {
            api: '/api/faculty/form-builder-content/',
            name: 'form-builder'
        },
        '/dashboard/faculty/reports/': {
            api: '/api/faculty/reports-content/',
            name: 'reports'
        }
    };
    
    document.addEventListener('DOMContentLoaded', function() {
        initSidebar();
        initSPANavigation();
        preloadAllPages();
    });
    
    function initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                sidebar.classList.toggle('sidebar--collapsed');
                
                const isCollapsed = sidebar.classList.contains('sidebar--collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });
            
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('sidebar--collapsed');
            }
        }
    }
    
    function initSPANavigation() {
        // Intercept all sidebar link clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('.sidebar__link');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || href.includes('logout') || !routes[href]) {
                return; // Let it navigate normally
            }
            
            e.preventDefault();
            loadPage(href, link);
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.url && routes[e.state.url]) {
                loadPage(e.state.url, null, true);
            }
        });
    }
    
    function loadPage(url, clickedLink, skipHistory = false) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        // Check cache first - INSTANT RENDER
        if (pageCache.has(url)) {
            const cachedData = pageCache.get(url);
            mainContent.innerHTML = cachedData.html;
            
            if (!skipHistory) {
                history.replaceState({ url: url }, '', url);
            }
            
            updateActiveLink(url);
            document.title = cachedData.title || 'Faculty Dashboard';
            
            // Load any additional CSS/JS if needed
            loadPageResources(cachedData);
            reinitializeScripts(url);
            
            return; // INSTANT!
        }
        
        // Not in cache - fetch from API
        const route = routes[url];
        if (!route) return;
        
        // Show minimal loading indicator
        mainContent.style.opacity = '0.6';
        
        fetch(route.api, {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || 'Failed to load page');
            }
            
            // Cache the page
            pageCache.set(url, {
                html: data.html,
                title: data.title,
                css: data.css || [],
                js: data.js || []
            });
            
            // Render content
            mainContent.innerHTML = data.html;
            mainContent.style.opacity = '1';
            
            if (!skipHistory) {
                history.replaceState({ url: url }, '', url);
            }
            
            updateActiveLink(url);
            document.title = data.title || 'Faculty Dashboard';
            
            // Load resources
            loadPageResources(data);
            reinitializeScripts(url);
        })
        .catch(error => {
            console.error('Error loading page:', error);
            mainContent.style.opacity = '1';
            // Fallback to normal navigation
            window.location.href = url;
        });
    }
    
    function updateActiveLink(url) {
        document.querySelectorAll('.sidebar__link').forEach(link => {
            link.classList.remove('sidebar__link--active');
            if (link.getAttribute('href') === url) {
                link.classList.add('sidebar__link--active');
            }
        });
    }
    
    function loadPageResources(data) {
        // Load CSS files
        if (data.css) {
            data.css.forEach(cssPath => {
                if (!loadedCSS.has(cssPath)) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = cssPath;
                    document.head.appendChild(link);
                    loadedCSS.add(cssPath);
                }
            });
        }
        
        // Load JS files
        if (data.js) {
            data.js.forEach(jsPath => {
                if (!loadedJS.has(jsPath)) {
                    const script = document.createElement('script');
                    script.src = jsPath;
                    document.body.appendChild(script);
                    loadedJS.add(jsPath);
                }
            });
        }
    }
    
    function reinitializeScripts(url) {
        // Reinitialize page-specific scripts
        const route = routes[url];
        if (!route) return;
        
        setTimeout(() => {
            // Always reinitialize sign-out button after navigation
            if (typeof initSignOut === 'function') {
                initSignOut();
            }
            
            if (route.name === 'overview' && typeof initFacultyDashboard === 'function') {
                initFacultyDashboard();
            } else if (route.name === 'form-builder' && typeof initFormBuilder === 'function') {
                initFormBuilder();
            }
        }, 50);
    }
    
    function preloadAllPages() {
        // Preload all pages after 1 second for instant switching
        setTimeout(() => {
            Object.keys(routes).forEach(url => {
                if (!pageCache.has(url) && url !== window.location.pathname) {
                    fetch(routes[url].api, {
                        credentials: 'same-origin',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            pageCache.set(url, {
                                html: data.html,
                                title: data.title,
                                css: data.css || [],
                                js: data.js || []
                            });
                            console.log('✓ Preloaded:', url);
                        }
                    })
                    .catch(() => {}); // Silent fail
                }
            });
        }, 1000);
    }
    
})();

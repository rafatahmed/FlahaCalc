/**
 * Path Helper Script
 * Ensures all resource paths are correct regardless of deployment location
 */

document.addEventListener('DOMContentLoaded', function() {
    // Detect if we're in a development environment
    const isDev = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';
    
    // In development mode, we use relative paths
    // In production, we use absolute paths
    if (!isDev) {
        // Base path for the current section in production
        let basePath = '';
        
        // Determine which section we're in
        if (window.location.pathname.includes('/pa/evapotran')) {
            basePath = '/pa/evapotran';
        } else if (window.location.pathname.includes('/pa/')) {
            basePath = '/pa';
        }
        
        // Fix navigation links
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip external links, absolute paths, and hash links
            if (!href || href.startsWith('http') || href.startsWith('/') || href.startsWith('#')) {
                return;
            }
            
            // Fix relative links
            link.setAttribute('href', `${basePath}/${href}`);
        });
        
        // Fix image sources
        document.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            
            // Skip absolute paths
            if (!src || src.startsWith('http') || src.startsWith('/')) {
                return;
            }
            
            // Fix relative image paths
            img.setAttribute('src', `${basePath}/${src}`);
        });
    }
    
    // Log path information in development mode
    if (isDev) {
        console.log('Path Helper: Running in development mode with relative paths');
    } else {
        console.log('Path Helper: Running in production mode with absolute paths');
    }
});

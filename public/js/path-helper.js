// Path helper script to fix URLs and paths
(function() {
    // Determine environment
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
        
        // Fix navigation links - remove .html extension
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip external links, absolute paths, and hash links
            if (!href || href.startsWith('http') || href.startsWith('#')) {
                return;
            }
            
            // Fix relative links
            if (!href.startsWith('/')) {
                // Remove .html extension for clean URLs
                const cleanHref = href.replace('.html', '');
                link.setAttribute('href', `${basePath}/${cleanHref}`);
            } else {
                // For absolute paths, just remove .html
                const cleanHref = href.replace('.html', '');
                link.setAttribute('href', cleanHref);
            }
        });
        
        // Fix resource paths (CSS, JS, images)
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('/')) {
                link.setAttribute('href', `${basePath}/${href}`);
            }
        });
        
        document.querySelectorAll('script').forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('/')) {
                script.setAttribute('src', `${basePath}/${src}`);
            }
        });
        
        document.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('/')) {
                img.setAttribute('src', `${basePath}/${src}`);
            }
        });
    }
})();


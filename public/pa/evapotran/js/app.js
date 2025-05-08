// Update base paths to support the new URL structure
const BASE_PATH = window.location.pathname.includes('/pa/evapotran') ? '/pa/evapotran' : '';
const API_BASE = '/api';

// Update all resource paths
document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    if (link.getAttribute('href').startsWith('css/')) {
        link.setAttribute('href', `${BASE_PATH}/${link.getAttribute('href')}`);
    }
});

document.querySelectorAll('script').forEach(script => {
    const src = script.getAttribute('src');
    if (src && src.startsWith('js/') && !src.includes(BASE_PATH)) {
        script.setAttribute('src', `${BASE_PATH}/${src}`);
    }
});

// Update image paths
document.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('images/') && !src.includes(BASE_PATH)) {
        img.setAttribute('src', `${BASE_PATH}/${src}`);
    }
});

// Add a helper function for API calls
function getApiUrl(endpoint) {
    return `${API_BASE}/${endpoint}`;
}

// Update navigation links
document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
        // Hash links don't need to be changed
        return;
    }
    
    if (href && !href.startsWith('http') && !href.startsWith('/')) {
        link.setAttribute('href', `${BASE_PATH}/${href}`);
    }
});

// Add a link back to the PA division
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header') || document.body.firstElementChild;
    const backLinkContainer = document.createElement('div');
    backLinkContainer.className = 'back-link-container';
    backLinkContainer.innerHTML = '<a href="/pa/" class="back-link">← Back to Precision Agriculture</a>';
    header.parentNode.insertBefore(backLinkContainer, header);
});



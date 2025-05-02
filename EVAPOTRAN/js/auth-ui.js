/**
 * UI utilities for authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});

/**
 * Update the UI based on authentication status
 */
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!loginBtn || !logoutBtn) return;
    
    if (isLoggedIn()) {
        // User is logged in
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-flex';
        
        // Add profile link if it doesn't exist
        if (!document.getElementById('profileBtn')) {
            const profileBtn = document.createElement('a');
            profileBtn.href = 'profile.html';
            profileBtn.className = 'header-action-btn';
            profileBtn.id = 'profileBtn';
            profileBtn.innerHTML = '<i class="fas fa-user-circle"></i> Profile';
            
            // Insert before logout button
            logoutBtn.parentNode.insertBefore(profileBtn, logoutBtn);
        }
        
        // Get user info
        const user = getCurrentUser();
        if (user) {
            console.log('Logged in as:', user.name);
        }
    } else {
        // User is not logged in
        loginBtn.style.display = 'inline-flex';
        logoutBtn.style.display = 'none';
        
        // Remove profile button if it exists
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.remove();
        }
    }
}

/**
 * Set up logout button functionality
 */
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
        // The logoutUser function in auth.js will handle the redirect
    });
}

// Initialize logout button
document.addEventListener('DOMContentLoaded', function() {
    setupLogoutButton();
});

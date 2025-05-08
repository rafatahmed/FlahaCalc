/**
 * Precision Agriculture page scripts
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("PA section loaded");
    
    // Initialize tool filtering
    initToolFiltering();
});

/**
 * Initialize the tool category filtering functionality
 */
function initToolFiltering() {
    const categoryFilters = document.querySelectorAll('.category-filter');
    const toolCards = document.querySelectorAll('.tool');
    
    if (categoryFilters.length > 0) {
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                // Remove active class from all filters
                categoryFilters.forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked filter
                this.classList.add('active');
                
                const category = this.getAttribute('data-category');
                
                // Show/hide tools based on category with animation
                toolCards.forEach(card => {
                    if (category === 'all' || card.getAttribute('data-category') === category) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
}

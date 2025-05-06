// Google Analytics Tracking Code
(function() {
  // Load the analytics.js script
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-JC1KFBL60W';
  document.head.appendChild(script);
  
  // Initialize Google Analytics
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-JC1KFBL60W');
  
  // Make gtag available globally
  window.gtag = gtag;
})();

// Custom event tracking helper
function trackEvent(category, action, label, value) {
  if (window.gtag) {
    gtag('event', action, {
      'event_category': category,
      'event_label': label,
      'value': value
    });
  }
}

// Page view tracking (for SPA navigation)
function trackPageView(pagePath) {
  if (window.gtag) {
    gtag('config', 'G-JC1KFBL60W', {
      'page_path': pagePath
    });
  }
}
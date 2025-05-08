#!/bin/bash

# Exit on error
set -e

echo "Implementing site structure for flaha.org..."

# Create directory structure
mkdir -p /var/www/flahacalc/css
mkdir -p /var/www/flahacalc/js
mkdir -p /var/www/flahacalc/pa/css
mkdir -p /var/www/flahacalc/pa/js

# Create main CSS file
cat > /var/www/flahacalc/css/main.css << 'EOF'
/* Main site styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background-color: #2c3e50;
    color: white;
    padding: 1rem 0;
}

header h1 {
    margin-bottom: 1rem;
}

nav ul {
    display: flex;
    list-style: none;
}

nav ul li {
    margin-right: 20px;
}

nav ul li a {
    color: white;
    text-decoration: none;
}

nav ul li a:hover, nav ul li a.active {
    text-decoration: underline;
}

.hero {
    background-color: #f4f4f4;
    padding: 3rem 0;
    text-align: center;
}

.hero h2 {
    margin-bottom: 1rem;
    font-size: 2.5rem;
}

.btn {
    display: inline-block;
    background-color: #3498db;
    color: white;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 5px;
    margin-top: 20px;
}

.features, .tools {
    padding: 3rem 0;
}

.feature-grid, .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 2rem;
}

.feature, .tool {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.feature h3, .tool h3 {
    margin-bottom: 10px;
    color: #2c3e50;
}

footer {
    background-color: #2c3e50;
    color: white;
    text-align: center;
    padding: 1rem 0;
    margin-top: 2rem;
}

@media (max-width: 768px) {
    nav ul {
        flex-direction: column;
    }
    
    nav ul li {
        margin-bottom: 10px;
    }
}
EOF

# Create PA-specific CSS
cat > /var/www/flahacalc/pa/css/pa-styles.css << 'EOF'
/* PA-specific styles */
.pa-section header {
    background-color: #27ae60;
}

.pa-hero {
    background-color: #e8f5e9;
}

.tool {
    border-left: 4px solid #27ae60;
}
EOF

# Create main JavaScript file
cat > /var/www/flahacalc/js/main.js << 'EOF'
// Main site JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Flaha website loaded');
    
    // Add active class to current navigation item
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentLocation === linkPath || 
            (linkPath !== '/' && currentLocation.startsWith(linkPath))) {
            link.classList.add('active');
        }
    });
});
EOF

# Create PA-specific JavaScript
cat > /var/www/flahacalc/pa/js/pa-scripts.js << 'EOF'
// PA-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('PA section loaded');
});
EOF

# Create main index.html
cat > /var/www/flahacalc/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flaha - Agricultural Solutions</title>
    <link rel="stylesheet" href="/css/main.css">
    <meta name="description" content="Flaha provides innovative agricultural solutions and calculators for modern farming">
</head>
<body>
    <header>
        <div class="container">
            <h1>Flaha</h1>
            <nav>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/pa/">Precision Agriculture</a></li>
                    <li><a href="/about.html">About</a></li>
                    <li><a href="/contact.html">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h2>Agricultural Solutions for Modern Farming</h2>
                <p>Explore our suite of precision agriculture tools and calculators</p>
                <a href="/pa/" class="btn">Explore Tools</a>
            </div>
        </section>

        <section class="features">
            <div class="container">
                <h2>Our Solutions</h2>
                <div class="feature-grid">
                    <div class="feature">
                        <h3>Precision Agriculture</h3>
                        <p>Advanced tools for precision farming and resource optimization</p>
                        <a href="/pa/">Learn More</a>
                    </div>
                    <div class="feature">
                        <h3>Evapotranspiration Calculator</h3>
                        <p>Calculate crop water requirements with our advanced ET calculator</p>
                        <a href="/pa/evapotran/">Try Calculator</a>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2023 Flaha. All rights reserved.</p>
        </div>
    </footer>

    <script src="/js/main.js"></script>
</body>
</html>
EOF

# Create PA index.html
cat > /var/www/flahacalc/pa/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Precision Agriculture - Flaha</title>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/pa/css/pa-styles.css">
    <meta name="description" content="Precision Agriculture tools and calculators for optimizing farm operations">
</head>
<body class="pa-section">
    <header>
        <div class="container">
            <h1>Flaha - Precision Agriculture</h1>
            <nav>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/pa/" class="active">Precision Agriculture</a></li>
                    <li><a href="/about.html">About</a></li>
                    <li><a href="/contact.html">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main>
        <section class="hero pa-hero">
            <div class="container">
                <h2>Precision Agriculture Tools</h2>
                <p>Advanced calculators and tools for modern farming practices</p>
            </div>
        </section>

        <section class="tools">
            <div class="container">
                <h2>Available Tools</h2>
                <div class="tool-grid">
                    <div class="tool">
                        <h3>Evapotranspiration Calculator</h3>
                        <p>Calculate crop water requirements based on weather data and crop coefficients</p>
                        <a href="/pa/evapotran/" class="btn">Open Calculator</a>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2023 Flaha. All rights reserved.</p>
        </div>
    </footer>

    <script src="/js/main.js"></script>
    <script src="/pa/js/pa-scripts.js"></script>
</body>
</html>
EOF

# Update Nginx configuration
echo "Updating Nginx configuration..."
cat > /etc/nginx/sites-available/flahacalc << 'EOF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name flaha.org www.flaha.org;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/flaha.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flaha.org/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    # Root directory
    root /var/www/flahacalc;
    index index.html;
    
    # Main site
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # PA division
    location /pa/ {
        alias /var/www/flahacalc/pa/;
        try_files $uri $uri/ /pa/index.html;
    }
    
    # EVAPOTRAN application - serve from original directory
    location /pa/evapotran/ {
        alias /var/www/flahacalc/EVAPOTRAN/;
        try_files $uri $uri/ /EVAPOTRAN/index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Redirect old EVAPOTRAN URLs to new location
    location /EVAPOTRAN/ {
        return 301 https://$host/pa/evapotran/;
    }
    
    location /evapotran/ {
        return 301 https://$host/pa/evapotran/;
    }
}
EOF

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "Site structure implementation complete!"
echo "Main site: https://flaha.org/"
echo "PA division: https://flaha.org/pa/"
echo "EVAPOTRAN: https://flaha.org/pa/evapotran/"
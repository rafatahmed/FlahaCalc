#!/bin/bash

# Exit on error
set -e

echo "Fixing main site and PA division..."

# Create main site index.html
echo "Creating main site index.html..."
mkdir -p /var/www/flahacalc
cat > /var/www/flahacalc/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Flaha</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            width: 80%;
            margin: 0 auto;
            padding: 2rem;
        }
        header {
            background-color: #2c3e50;
            color: white;
            padding: 1rem 0;
            text-align: center;
        }
        nav {
            margin: 1rem 0;
        }
        nav a {
            display: inline-block;
            margin-right: 1rem;
            text-decoration: none;
            color: #3498db;
            font-weight: bold;
        }
        nav a:hover {
            text-decoration: underline;
        }
        .cta-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 0.5rem 1rem;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 1rem;
        }
        .cta-button:hover {
            background-color: #2980b9;
        }
        footer {
            background-color: #2c3e50;
            color: white;
            text-align: center;
            padding: 1rem 0;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>Welcome to Flaha</h1>
        </div>
    </header>
    
    <div class="container">
        <main>
            <h2>This is the main company website.</h2>
            <p>
                Flaha is a leading provider of agricultural technology solutions designed to improve farming efficiency and sustainability.
            </p>
            <a href="/pa/" class="cta-button">Visit Precision Agriculture Division</a>
        </main>
    </div>
    
    <footer>
        <div class="container">
            <p>&copy; 2023 Flaha. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
EOF

# Create PA division directory and index.html
echo "Creating PA division directory and index.html..."
mkdir -p /var/www/flahacalc/pa
cat > /var/www/flahacalc/pa/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Precision Agriculture Division - Flaha</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            width: 80%;
            margin: 0 auto;
            padding: 2rem;
        }
        header {
            background-color: #27ae60;
            color: white;
            padding: 1rem 0;
            text-align: center;
        }
        nav {
            margin: 1rem 0;
        }
        nav a {
            display: inline-block;
            margin-right: 1rem;
            text-decoration: none;
            color: #2980b9;
            font-weight: bold;
        }
        nav a:hover {
            text-decoration: underline;
        }
        .cta-button {
            display: inline-block;
            background-color: #27ae60;
            color: white;
            padding: 0.5rem 1rem;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 1rem;
        }
        .cta-button:hover {
            background-color: #219653;
        }
        footer {
            background-color: #27ae60;
            color: white;
            text-align: center;
            padding: 1rem 0;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>Precision Agriculture Division</h1>
        </div>
    </header>
    
    <div class="container">
        <nav>
            <a href="/">Back to Main Site</a>
        </nav>
        
        <main>
            <h2>Welcome to the Precision Agriculture Division of Flaha.</h2>
            <p>
                Our precision agriculture solutions help farmers optimize their operations through advanced technology and data-driven insights.
            </p>
            <a href="/pa/evapotran/" class="cta-button">Launch EVAPOTRAN Calculator</a>
        </main>
    </div>
    
    <footer>
        <div class="container">
            <p>&copy; 2023 Flaha Precision Agriculture Division. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
EOF

# Fix permissions
echo "Setting correct permissions..."
chown -R www-data:www-data /var/www/flahacalc
chmod -R 755 /var/www/flahacalc

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

echo "Main site and PA division have been fixed."
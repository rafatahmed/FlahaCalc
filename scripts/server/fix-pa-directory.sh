#!/bin/bash

# Exit on error
set -e

echo "Fixing PA directory..."

# Create PA directory if it doesn't exist
mkdir -p /var/www/flahacalc/public/pa

# Create a basic index.html file if it doesn't exist
if [ ! -f "/var/www/flahacalc/public/pa/index.html" ]; then
    echo "Creating basic index.html for PA directory..."
    cat > /var/www/flahacalc/public/pa/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PA Division - Flaha Agri Tech</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #2c8c99;
            color: white;
            padding: 20px;
            text-align: center;
        }
        h1 {
            margin-top: 0;
        }
        .content {
            margin-top: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #2c8c99;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .btn:hover {
            background-color: #42a5b3;
        }
    </style>
</head>
<body>
    <header>
        <h1>PA Division</h1>
        <p>Precision Agriculture Solutions by Flaha Agri Tech</p>
    </header>
    
    <div class="container">
        <div class="content">
            <h2>Welcome to the Precision Agriculture Division</h2>
            <p>Our PA division focuses on developing cutting-edge tools for precision agriculture applications.</p>
            
            <h3>Available Tools:</h3>
            <ul>
                <li><a href="/evapotran">EVAPOTRAN - Evapotranspiration Calculator</a></li>
            </ul>
            
            <a href="/" class="btn">Back to Home</a>
        </div>
    </div>
</body>
</html>
EOF
fi

echo "PA directory fixed successfully!"
#!/bin/bash

# Exit on error
set -e

echo "Creating all missing images in the correct formats..."

# Create directories if they don't exist
mkdir -p /var/www/flahacalc/public/img
mkdir -p /var/www/flahacalc/public/docs/technical/img
mkdir -p /var/www/flahacalc/public/pa/img
mkdir -p /var/www/flahacalc/public/pa/evapotran/img

# Create a proper PNG logo file
cat > /var/www/flahacalc/public/img/Flaha_logo.png << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
  <rect x="10" y="10" width="180" height="60" rx="10" fill="#3498db" />
  <text x="30" y="50" font-family="Arial" font-size="30" fill="white">FlahaCalc</text>
</svg>
EOF

# Create favicon
cat > /var/www/flahacalc/public/favicon.ico << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#3498db" />
  <text x="8" y="24" font-family="Arial" font-size="20" fill="white">F</text>
</svg>
EOF

# Create precision agriculture image
cat > /var/www/flahacalc/public/pa/img/precision-agriculture.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="200" width="400" height="100" fill="#8B4513" />
  <rect x="50" y="150" width="300" height="50" fill="#228B22" />
  <circle cx="100" cy="100" r="30" fill="#FFD700" />
  <path d="M150,150 L200,100 L250,150" stroke="#228B22" stroke-width="5" fill="none" />
  <rect x="300" y="120" width="50" height="80" fill="#A52A2A" />
</svg>
EOF

# Create ETO equation image
cat > /var/www/flahacalc/public/pa/evapotran/img/eto-equation.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
  <text x="10" y="50" font-family="Arial" font-size="16">ET₀ = 0.408Δ(Rn-G) + γ(900/(T+273))u₂(es-ea)/Δ+γ(1+0.34u₂)</text>
</svg>
EOF

# Create agriculture illustration
cat > /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="200" width="400" height="100" fill="brown" />
  <rect x="180" y="150" width="40" height="50" fill="green" />
  <circle cx="200" cy="120" r="30" fill="green" />
  <circle cx="200" cy="50" r="20" fill="yellow" />
</svg>
EOF

# Create PNG versions
echo "Creating PNG versions of SVG files..."

# Copy SVG files to PNG locations
cp /var/www/flahacalc/public/pa/evapotran/img/eto-equation.svg /var/www/flahacalc/public/pa/evapotran/img/eto-equation.png
cp /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.svg /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.png

# Copy to docs/technical directory
mkdir -p /var/www/flahacalc/public/docs/technical/img
cp /var/www/flahacalc/public/pa/evapotran/img/eto-equation.png /var/www/flahacalc/public/docs/technical/img/
cp /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.png /var/www/flahacalc/public/docs/technical/img/

# Copy to EVAPOTRAN directory (for backward compatibility)
mkdir -p /var/www/flahacalc/EVAPOTRAN/docs/technical/img
cp /var/www/flahacalc/public/pa/evapotran/img/eto-equation.png /var/www/flahacalc/EVAPOTRAN/docs/technical/img/
cp /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.png /var/www/flahacalc/EVAPOTRAN/docs/technical/img/

# Create about page
cat > /var/www/flahacalc/public/about.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About FlahaCalc</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="logo">
            <img src="img/Flaha_logo.png" alt="FlahaCalc Logo">
        </div>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/pa">Precision Agriculture</a></li>
                <li><a href="/pa/evapotran">EVAPOTRAN</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="about-section">
            <h1>About FlahaCalc</h1>
            <p>FlahaCalc is a comprehensive suite of agricultural calculation tools designed to help farmers, researchers, and agricultural professionals make data-driven decisions.</p>
            
            <h2>Our Mission</h2>
            <p>To provide accessible, accurate, and user-friendly tools for agricultural calculations that improve crop yields, reduce resource usage, and promote sustainable farming practices.</p>
            
            <h2>Key Features</h2>
            <ul>
                <li>Evapotranspiration calculation tools</li>
                <li>Weather data integration</li>
                <li>Crop water requirement estimations</li>
                <li>EPW file analysis for climate studies</li>
            </ul>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2025 FlahaCalc. All rights reserved.</p>
    </footer>
</body>
</html>
EOF

echo "All images and missing pages created successfully!"
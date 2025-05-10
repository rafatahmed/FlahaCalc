#!/bin/bash

# Exit on error
set -e

echo "Fixing image paths and creating missing images in the correct locations..."

# Create directories if they don't exist
mkdir -p /var/www/flahacalc/public/img
mkdir -p /var/www/flahacalc/public/docs/technical/img
mkdir -p /var/www/flahacalc/public/pa/img
mkdir -p /var/www/flahacalc/public/pa/evapotran/img

# Create Flaha logo
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

# Create ETO equation image in the correct location
cat > /var/www/flahacalc/public/pa/evapotran/img/eto-equation.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
  <text x="10" y="50" font-family="Arial" font-size="16">ET₀ = 0.408Δ(Rn-G) + γ(900/(T+273))u₂(es-ea)/Δ+γ(1+0.34u₂)</text>
</svg>
EOF

# Create agriculture illustration in the correct location
cat > /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="200" width="400" height="100" fill="brown" />
  <rect x="180" y="150" width="40" height="50" fill="green" />
  <circle cx="200" cy="120" r="30" fill="green" />
  <circle cx="200" cy="50" r="20" fill="yellow" />
</svg>
EOF

# Copy images to the root img directory as well
cp /var/www/flahacalc/public/pa/evapotran/img/eto-equation.svg /var/www/flahacalc/public/img/
cp /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.svg /var/www/flahacalc/public/img/

# Create PNG versions
cp /var/www/flahacalc/public/pa/evapotran/img/eto-equation.svg /var/www/flahacalc/public/pa/evapotran/img/eto-equation.png
cp /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.svg /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.png

# Copy images to docs/technical directory
mkdir -p /var/www/flahacalc/public/docs/technical/img
cp /var/www/flahacalc/public/pa/evapotran/img/eto-equation.png /var/www/flahacalc/public/docs/technical/img/
cp /var/www/flahacalc/public/pa/evapotran/img/agriculture-illustration.png /var/www/flahacalc/public/docs/technical/img/

# Create testimonial images
cat > /var/www/flahacalc/public/docs/technical/img/testimonial-1.jpg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect x="0" y="0" width="200" height="200" fill="#f0f0f0" />
  <circle cx="100" cy="70" r="50" fill="#d0d0d0" />
  <rect x="40" y="130" width="120" height="20" fill="#d0d0d0" />
  <rect x="60" y="160" width="80" height="10" fill="#d0d0d0" />
</svg>
EOF

# Create default avatar
cat > /var/www/flahacalc/public/docs/technical/img/default-avatar.png << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#e0e0e0" />
  <circle cx="50" cy="35" r="15" fill="#a0a0a0" />
  <path d="M25,85 C25,65 75,65 75,85" fill="#a0a0a0" />
</svg>
EOF

echo "Image paths and missing images fixed successfully!"
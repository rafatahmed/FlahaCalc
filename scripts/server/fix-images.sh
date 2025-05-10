#!/bin/bash

# Exit on error
set -e

echo "Fixing image paths and creating missing images..."

# Create directories if they don't exist
mkdir -p /var/www/flahacalc/public/img
mkdir -p /var/www/flahacalc/public/docs/technical/img

# Create placeholder SVG images
cat > /var/www/flahacalc/public/img/eto-equation.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
  <text x="10" y="50" font-family="Arial" font-size="16">ET₀ = 0.408Δ(Rn-G) + γ(900/(T+273))u₂(es-ea)/Δ+γ(1+0.34u₂)</text>
</svg>
EOF

cat > /var/www/flahacalc/public/img/agriculture-illustration.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="200" width="400" height="100" fill="brown" />
  <rect x="180" y="150" width="40" height="50" fill="green" />
  <circle cx="200" cy="120" r="30" fill="green" />
  <circle cx="200" cy="50" r="20" fill="yellow" />
</svg>
EOF

# Copy SVG images to PNG versions
cp /var/www/flahacalc/public/img/eto-equation.svg /var/www/flahacalc/public/img/eto-equation.png
cp /var/www/flahacalc/public/img/agriculture-illustration.svg /var/www/flahacalc/public/img/agriculture-illustration.png

# Copy images to docs/technical directory
cp /var/www/flahacalc/public/img/eto-equation.png /var/www/flahacalc/public/docs/technical/img/
cp /var/www/flahacalc/public/img/agriculture-illustration.png /var/www/flahacalc/public/docs/technical/img/

# Create placeholder testimonial images
cat > /var/www/flahacalc/public/img/testimonial-1.jpg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect x="0" y="0" width="200" height="200" fill="#f0f0f0" />
  <circle cx="100" cy="70" r="50" fill="#d0d0d0" />
  <rect x="40" y="130" width="120" height="20" fill="#d0d0d0" />
  <rect x="60" y="160" width="80" height="10" fill="#d0d0d0" />
</svg>
EOF

# Create default avatar
cat > /var/www/flahacalc/public/img/default-avatar.png << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#e0e0e0" />
  <circle cx="50" cy="35" r="15" fill="#a0a0a0" />
  <path d="M25,85 C25,65 75,65 75,85" fill="#a0a0a0" />
</svg>
EOF

# Copy images to docs/technical directory
cp /var/www/flahacalc/public/img/testimonial-1.jpg /var/www/flahacalc/public/docs/technical/img/
cp /var/www/flahacalc/public/img/default-avatar.png /var/www/flahacalc/public/docs/technical/img/

echo "Image paths and missing images fixed successfully!"
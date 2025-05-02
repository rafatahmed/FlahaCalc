# FlahaCalc - Professional Evapotranspiration Calculator

## Deployment

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/flahacalc.git
   cd flahacalc
   ```

2. Install dependencies:
   ```bash
   npm install
   cd EVAPOTRAN/server
   npm install
   ```

3. Create a `.env` file in the `EVAPOTRAN/server` directory:
   ```
   WEATHER_API_KEY=your_openweathermap_api_key_here
   PORT=3000
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. Open `EVAPOTRAN/index.html` in your browser

### Production Deployment

For production deployment, we use GitHub Actions for continuous deployment to a DigitalOcean Droplet.

1. Set up GitHub Secrets (see `docs/deployment/github-secrets.md`)
2. Push changes to the main branch
3. GitHub Actions will automatically deploy to your server

For detailed deployment instructions, see the [Deployment Quick Start Guide](docs/deployment/quick-start.md).

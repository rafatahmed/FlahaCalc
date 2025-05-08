# EVAPOTRAN Troubleshooting Guide

## Server Connection Issues

### 500 Internal Server Error

If you're seeing a 500 Internal Server Error when calculating ET0, try these steps:

1. **Check server logs**: Look at the console where your server is running for error messages
2. **Verify input data**: Make sure all required fields have valid numeric values
3. **Restart the server**: Sometimes simply restarting the server can fix issues
4. **Check for edge cases**: Certain combinations of latitude and day of year can cause mathematical errors

### Failed to Fetch Error

If you see "Failed to fetch" or "Server connection failed" errors:

1. **Verify server is running**: Make sure the Node.js server is running at http://localhost:3000
2. **Check port conflicts**: Make sure no other application is using port 3000
3. **Check firewall settings**: Ensure your firewall allows connections to localhost:3000

## Calculation Issues

### Invalid Results

If calculations are producing unexpected results:

1. **Validate input ranges**:
   - Temperature: Typically -20°C to 50°C
   - Wind speed: 0.5 to 15 m/s
   - Relative humidity: 0% to 100%
   - Latitude: -90° to 90°
   - Day of year: 1 to 366

2. **Check for extreme values**: The FAO Penman-Monteith equation may produce unreliable results with extreme input values

### NaN or Infinity Results

These typically occur due to:
- Division by zero
- Invalid mathematical operations (like taking square root of negative number)
- Missing input values

## Browser Issues

### CSS Transform Errors

If you see "Error in parsing value for 'transform'" in the console:

1. **Update your browser**: Make sure you're using the latest version
2. **Clear browser cache**: Sometimes cached CSS can cause issues
3. **Use vendor prefixes**: The application should include vendor prefixes for better compatibility

## Server Setup

### Installing Dependencies

Make sure to install all required dependencies:

```bash
cd EVAPOTRAN/server
npm install express cors body-parser dotenv
```

### Starting the Server

To start the server:

```bash
cd EVAPOTRAN/server
node weather-proxy.js
```

For development with auto-restart:

```bash
npm install -g nodemon
nodemon weather-proxy.js
```
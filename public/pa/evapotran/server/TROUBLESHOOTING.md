# Troubleshooting Server Connection Issues

If you're experiencing issues connecting to the weather proxy server, follow these steps:

## 1. Check if the server is running

Make sure the server is running by:
- Opening a terminal/command prompt
- Navigating to the server directory: `cd EVAPOTRAN/server`
- Running: `npm start`
- Verifying you see: "Weather proxy server running on port 3000"

## 2. Test the server directly

Open your browser and navigate to:
```
http://localhost:3000/api/test
```

You should see a JSON response: `{"status":"success","message":"Server is running correctly"}`

## 3. Check for CORS issues

If you're getting CORS errors in the browser console:
- Make sure the server's CORS configuration is correct
- Try using a browser extension to disable CORS temporarily for testing

## 4. Check your API key

Ensure your OpenWeatherMap API key is:
- Valid and active
- Correctly set in the `.env` file
- Not expired or rate-limited

## 5. Network issues

- Check if your firewall is blocking connections
- Make sure localhost isn't being blocked by any security software
- Try a different port if 3000 is already in use (change in weather-proxy.js)

## 6. Browser issues

- Try a different browser
- Clear your browser cache
- Disable any extensions that might interfere with network requests

## 7. Check for errors in the server console

Look for error messages in the terminal where the server is running.

## 8. CORS Issues

If you're experiencing CORS (Cross-Origin Resource Sharing) errors:

### For Local Development

1. Make sure your server is running with proper CORS configuration:
   ```
   npm start
   ```

2. Check that your browser is not blocking CORS requests:
   - For Chrome, you can install the "CORS Unblock" extension for testing
   - For Firefox, you can install the "CORS Everywhere" extension

3. Verify that the API_BASE_URL in live-weather.js is correctly set to:
   ```javascript
   const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
       ? "http://localhost:3000/api" 
       : `https://${window.location.hostname}/api`;
   ```

### For Production

1. Ensure the server's CORS configuration allows requests from your domain:
   - Check the CORS_ORIGIN environment variable in your .env file
   - It should include your domain, e.g., `CORS_ORIGIN=https://flaha.org,https://www.flaha.org`

2. Make sure your API requests are using HTTPS in production:
   - The API_BASE_URL should automatically use HTTPS when not on localhost

3. Check your server logs for any CORS-related errors:
   ```
   pm2 logs flahacalc-server
   ```

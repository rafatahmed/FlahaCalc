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
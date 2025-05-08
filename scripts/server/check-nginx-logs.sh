#!/bin/bash

echo "Checking Nginx error logs..."
echo "Last 20 lines of error log:"
tail -n 20 /var/log/nginx/error.log

echo ""
echo "Checking Nginx access logs..."
echo "Last 20 lines of access log:"
tail -n 20 /var/log/nginx/access.log

echo ""
echo "Checking for 404 errors in the last 100 requests:"
grep "\" 404 " /var/log/nginx/access.log | tail -n 10

echo ""
echo "Checking for 500 errors in the last 100 requests:"
grep "\" 500 " /var/log/nginx/access.log | tail -n 10
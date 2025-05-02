# Security Deployment Checklist

## Before Deployment

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Remove development dependencies from production build
- [ ] Ensure all secrets are stored in environment variables
- [ ] Generate new JWT secret for production
- [ ] Configure proper CORS settings for production domains
- [ ] Set up rate limiting for API endpoints
- [ ] Enable HTTPS only (no HTTP)
- [ ] Configure Content Security Policy

## Server Setup

- [ ] Update and upgrade all packages
- [ ] Install and configure firewall (UFW)
- [ ] Install and configure Fail2Ban
- [ ] Set up automatic security updates
- [ ] Secure shared memory
- [ ] Create a non-root user for application management
- [ ] Disable root SSH login (after setting up non-root user)
- [ ] Configure SSH to use key authentication only

## Nginx Configuration

- [ ] Enable HTTPS with strong SSL settings
- [ ] Configure HTTP to HTTPS redirection
- [ ] Add security headers
- [ ] Set up rate limiting
- [ ] Block access to sensitive files and directories
- [ ] Configure proper proxy settings

## Application Security

- [ ] Implement proper authentication and authorization
- [ ] Sanitize all user inputs
- [ ] Implement XSS protection
- [ ] Set secure cookie options
- [ ]
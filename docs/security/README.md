# EVAPOTRAN Security Guide

This document outlines the security measures implemented in the EVAPOTRAN application.

## Server Security

### Firewall Configuration

The server uses UFW (Uncomplicated Firewall) to restrict incoming traffic:
- Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are open
- All other incoming traffic is blocked

### Fail2Ban

Fail2Ban is configured to protect against brute force attacks:
- Monitors SSH login attempts
- Bans IPs after 5 failed attempts for 1 hour

### Automatic Updates

The server is configured for automatic security updates:
- Daily package list updates
- Automatic installation of security updates
- Weekly system cleanup

## Application Security

### Authentication

- JWT-based authentication with secure token generation
- Password hashing using bcrypt with salt rounds of 10
- Token expiration (1 day default, 30 days with "Remember Me")
- HTTP-only secure cookies for token storage

### API Security

- Rate limiting to prevent abuse (100 requests per 15 minutes per IP)
- Input validation and sanitization
- Protection against NoSQL injection
- XSS protection
- Parameter pollution prevention
- CORS restrictions to allowed origins only

### HTTPS Configuration

- TLS 1.2 and 1.3 only (older protocols disabled)
- Strong cipher suite configuration
- OCSP stapling enabled
- HTTP Strict Transport Security (HSTS)
- Secure cookie settings

## Frontend Security

- Content Security Policy (CSP) to prevent XSS
- Subresource Integrity (SRI) for external resources
- X-Content-Type-Options to prevent MIME sniffing
- X-Frame-Options to prevent clickjacking
- Referrer Policy to control information in HTTP headers

## Security Monitoring

- Regular security audits using npm audit
- SSL configuration testing with SSL Labs
- Monitoring of unauthorized access attempts
- Disk usage monitoring

## Security Incident Response

In case of a security incident:

1. Isolate the affected system
2. Assess the damage
3. Identify the vulnerability
4. Apply necessary patches
5. Restore from clean backups if necessary
6. Document the incident and response
7. Implement measures to prevent similar incidents

## Reporting Security Issues

If you discover a security vulnerability, please email [security@flaha.org](mailto:security@flaha.org) rather than using the public issue tracker.
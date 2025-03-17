# Fincapy Security Penetration Tests

This directory contains security penetration tests for the Fincapy application, focusing on the authentication system.

## Overview

These tests are designed to identify common security vulnerabilities in the signin process, including:

1. SQL Injection attempts
2. Cross-Site Scripting (XSS) vulnerabilities
3. Cross-Site Request Forgery (CSRF) protection
4. Rate limiting and brute force protection
5. Information leakage in error messages
6. Session security (fixation, cookie security)
7. Input validation

## Requirements

- Node.js v14+
- Docker and Docker Compose
- Playwright

## Running the Tests

To run the security tests:

```bash
# Install dependencies if not already installed
npm install

# Run the tests
npm run test:security
```

This will:

1. Start the application using Docker Compose
2. Run the penetration tests using Playwright
3. Generate a report of the test results

## Test Report

After running the tests, you can view the HTML report by opening the generated report in your browser:

```bash
npx playwright show-report
```

## Test Customization

You can customize the tests by modifying the following files:

- `tests/system/testPenetration.js` - The main test file
- `playwright.config.js` - Playwright configuration

## Additional Security Considerations

These tests cover common vulnerabilities but are not exhaustive. Consider additional security measures:

1. Regular dependency audits: `npm audit`
2. Static code analysis
3. Professional penetration testing
4. Security headers configuration review
5. Content Security Policy (CSP) implementation

## Troubleshooting

If the tests fail due to Docker issues:

1. Check if Docker is running: `docker ps`
2. Try manually starting the containers: `docker-compose up -d`
3. Check Docker logs: `docker-compose logs`

If the tests fail due to timing issues:

1. Increase timeouts in the test configuration
2. Check if the application is correctly exposed on port 3000

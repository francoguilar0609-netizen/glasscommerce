# Security Policy
Security fixes apply to the latest release. Report vulnerabilities using GitHub private security advisories; never open a public issue containing credentials, payment data or personal information.

## Trust boundaries
Portable accounts use password-derived hashes and server-side sessions. Proxy identity headers require both `TRUST_PROXY_AUTH_HEADERS=true` and `TRUST_PROXY_AUTH_SECRET`. The deployment edge must remove client-supplied identity and proxy-secret headers, then inject the verified email and shared secret. A flag without the secret grants no access. Administrative role assignment for local accounts must be performed through a controlled database operation.

Mercado Pago credentials and webhook secrets are server-only. Signed notifications are verified against the Payments API, and inventory transitions are idempotent in D1.

## Operational requirements
Use HTTPS, rotate secrets, apply migrations before deployment, invoke reservation cleanup on a schedule, monitor failed webhooks and maintain tested D1 backups.
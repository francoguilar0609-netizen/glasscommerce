# Security Policy
Security fixes apply to the latest release. Report vulnerabilities using GitHub private security advisories; never open a public issue containing credentials, payment data or personal information.

## Trust boundaries
Portable accounts use password-derived hashes and server-side sessions. Proxy identity headers are disabled unless `TRUST_PROXY_AUTH_HEADERS=true`; enable that option only when the deployment edge removes client-supplied identity headers and injects verified values. Administrative role assignment for local accounts must be performed through a controlled database operation.

Mercado Pago credentials and webhook secrets are server-only. Signed notifications are verified against the Payments API, and inventory transitions are idempotent in D1.

## Operational requirements
Use HTTPS, rotate secrets, apply migrations before deployment, invoke reservation cleanup on a schedule, monitor failed webhooks and maintain tested D1 backups.
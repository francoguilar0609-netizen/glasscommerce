# Security Policy
Security fixes apply to the latest release. Report vulnerabilities using GitHub private security advisories; never open a public issue containing credentials, payment data or personal information.

## Trust boundaries
Portable accounts use password-derived hashes and server-side sessions. Proxy identity is disabled by default and requires both `TRUST_PROXY_AUTH_HEADERS=true` and a random 32-byte HMAC secret encoded as 64 hexadecimal characters. The deployment edge must remove client-supplied identity, timestamp and signature headers, then sign the normalized email, timestamp, HTTP method and exact path/query for each request. Signatures expire after 60 seconds; a flag without a correctly formatted strong secret and valid signature grants no access. Administrative role assignment for local accounts must be performed through a controlled database operation.

Mercado Pago credentials and webhook secrets are server-only. Signed notifications are verified against the Payments API, and inventory transitions are idempotent in D1.

## Operational requirements
Use HTTPS, rotate secrets, apply migrations before deployment, invoke reservation cleanup on a schedule, monitor failed webhooks and maintain tested D1 backups.


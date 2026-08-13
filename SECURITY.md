# Security Policy

## Supported versions

GlassCommerce is pre-1.0. Security fixes are applied to the latest release.

## Reporting a vulnerability

Do not open a public issue for an unpatched vulnerability. Use GitHub's private
security advisory feature for this repository. Include affected files, impact,
reproduction steps and a suggested mitigation when available.

The maintainer will acknowledge actionable reports, validate impact and
coordinate a fix before public disclosure. Never include real credentials,
payment data or personal information in a report.

## Current MVP boundary

Version 0.1.0 has no server-side authentication, payment processing, webhooks
or external API calls. Its cart and demo order state stay in the browser.
These boundaries will be revised when server-side components are introduced.

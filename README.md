# GlassCommerce
GlassCommerce is a Cloudflare Workers/D1 commerce application with a React storefront, portable local accounts, transactional inventory reservations and Mercado Pago Checkout Pro preparation.

## Production status
The architecture now prevents overselling through database-backed reservations and supports password sessions without relying on proxy identity headers. Production payments still require a configured D1 database, applied migrations, Mercado Pago sandbox certification and operational monitoring.

## Required runtime configuration
- `DB`: Cloudflare D1 binding. Apply every migration in `drizzle/` before serving traffic.
- `MERCADO_PAGO_ACCESS_TOKEN`: server-only Checkout Pro access token.
- `MERCADO_PAGO_WEBHOOK_SECRET`: secret configured for signed Mercado Pago notifications.
- `CRON_SECRET`: bearer secret for `POST /api/internal/release-reservations`.
- `USD_PEN_RATE`: informational PEN per USD rate; charges remain in PEN.
- `ALLOW_LOCAL_REGISTRATION=true`: enables unverified self-registration and is intended only for controlled environments until email verification is integrated. Leave unset in production.
- `TRUST_PROXY_AUTH_HEADERS=true`: enables the optional proxy identity bridge.
- `TRUST_PROXY_AUTH_SECRET`: required with the bridge. The trusted edge must strip client values and inject the same secret in `x-glasscommerce-proxy-secret` plus the verified email in `oai-authenticated-user-email`. Leave both settings unset elsewhere.
- `ADMIN_EMAILS`: administrators accepted only through that verified proxy bridge. Portable accounts obtain admin access by setting `users.role='admin'` through a controlled operational process, never merely by registering a matching email.

## Authentication
Local passwords are hashed with PBKDF2-SHA256 (310,000 iterations). Session tokens are random, stored in cookies with HttpOnly/SameSite and persisted only as SHA-256 hashes. State-changing browser endpoints enforce same-origin requests. Deploy only over HTTPS.

## Inventory and payments
Checkout uses a client idempotency key and a D1 transaction to create the order and reserve every line. SQLite triggers abort the complete batch if any line lacks stock. Approval consumes the reservation and decrements physical stock once; rejection, cancellation, setup failure or expiry releases it. Payment events are unique and replay-safe. Mercado Pago notifications require a valid signature and are verified again through the Payments API.

Mercado Pago charges in PEN. USD is display-only.

## Development
Requires Node.js 22.13+.
```bash
npm ci
npm run lint
npm run typecheck
npm test
```

## Migration and rollback
Before deploying, back up D1 and check that existing non-null `payment_id` values are unique. Apply `0001_secure_auth_inventory` before the new Worker; the Worker now refuses to run against a partial schema. The migration is forward-only because SQLite/D1 cannot safely remove these columns in place. Rollback means restoring the pre-migration D1 backup together with the previous Worker, or deploying a forward corrective migration. Do not roll back only the application while active reservations exist.

## Security
Report vulnerabilities through GitHub private security advisories. Never commit credentials or customer data.

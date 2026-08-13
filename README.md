# GlassCommerce

GlassCommerce is an open-source, full-stack e-commerce platform with a premium glassmorphism interface. It includes a persistent catalog, customer accounts, orders, inventory administration, and a server-side Mercado Pago Checkout Pro integration.

> **Current status:** the complete commerce workflow is implemented. Real charges remain disabled until the owner configures a private `MERCADO_PAGO_ACCESS_TOKEN` in the hosting environment.

## Features

- Persistent catalog, inventory, and orders backed by Cloudflare D1
- Customer identity and individual order history
- Protected administration dashboard with inventory editing
- PEN checkout and informational USD price display
- Server-calculated totals and stock validation
- Mercado Pago preference creation and verified payment notifications
- Automated lint, build, rendered HTML, and artifact checks

## Quick start

Requirements: Node.js 22.13 or newer and npm.

```bash
npm ci
npm run dev
```

Open the local address printed by the development server.

## Quality checks

```bash
npm run lint
npm test
```

## Architecture and payment security

- React, TypeScript, Vinext, Vite, Cloudflare Workers, D1, and Drizzle migrations
- Server-only payment credentials; secrets are never committed to Git
- Prices and totals are recalculated on the server
- Mercado Pago notifications are verified by retrieving the payment directly
- Orders update only when reference, currency, and amount match

Mercado Pago Peru settles checkout in PEN. USD values are displayed using a configurable reference exchange rate. Real payment testing requires the owner's Mercado Pago test credentials.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and
[SECURITY.md](SECURITY.md) for responsible vulnerability reporting.

## License

MIT © 2026 Franco Aguilar.

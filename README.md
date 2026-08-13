# GlassCommerce

GlassCommerce is an open-source e-commerce MVP built with React, TypeScript,
Vinext and a responsive glassmorphism interface. It demonstrates product
discovery, category filters, a browser-persistent cart, a simulated checkout,
and a read-only administration dashboard.

> **MVP safety boundary:** this release does not collect credentials, process
> payments, call external APIs, or persist server-side customer data. Checkout
> creates a local demonstration order only.

## Features

- Searchable six-product catalog with category filters
- Add, remove and update cart items
- Cart persistence with `localStorage`
- Explicitly simulated checkout with generated demo order IDs
- Read-only inventory and catalog-value dashboard
- Responsive layout, keyboard-accessible controls and reduced-motion support
- Production build validation and rendered HTML test

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

## Architecture and trust boundaries

The MVP is a client-side demonstration. Static product data is defined in
`app/page.tsx`; cart state is stored on the current device. There is no account
system, database-backed order flow, payment provider, webhook receiver, or
privileged admin mutation surface yet.

Future server-side work must include authorization checks, secure session and
secret handling, idempotent payment webhooks, server-calculated prices,
inventory transaction safety, request validation and dependency review.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and
[SECURITY.md](SECURITY.md) for responsible vulnerability reporting.

## License

MIT © 2026 Franco Aguilar.

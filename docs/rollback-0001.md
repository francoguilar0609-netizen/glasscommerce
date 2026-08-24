# Migration 0001 deployment and rollback

Migration `0001_secure_auth_inventory` is forward-only. A down migration is not
safe because SQLite cannot remove the added columns in place, and rebuilding the
tables would discard or ambiguously transform users, sessions, reservations and
payment events created after deployment.

## Before deployment

1. Stop checkout writes or enter a maintenance window.
2. Record the currently deployed Worker version and D1 database name.
3. Run the read-only duplicate report:

   ```bash
   npx wrangler d1 execute <DATABASE> --remote --file scripts/preflight-0001.sql
   ```

   Continue only when it returns no rows. If it reports duplicates, investigate
   every listed order and payment in Mercado Pago. Resolve them manually through
   an audited operational process; the migration intentionally changes nothing.
4. Record a D1 Time Travel bookmark and export an independent SQL backup:

   ```bash
   npx wrangler d1 time-travel info <DATABASE>
   npx wrangler d1 export <DATABASE> --remote --output backup-before-0001.sql
   ```
5. Verify that the export is non-empty and store the bookmark, export checksum,
   previous Worker version and deployment timestamp outside the repository.
6. Apply the migration, verify the schema, then deploy the new Worker. Do not
   enable checkout until both steps succeed.

## Rollback

1. Disable checkout and reservation-cleanup traffic.
2. Redeploy the previous Worker first so it cannot write the new schema while
   D1 is being restored.
3. Restore D1 to the recorded pre-migration bookmark:

   ```bash
   npx wrangler d1 time-travel restore <DATABASE> --bookmark=<BOOKMARK>
   ```

   This overwrites D1 and cancels in-flight queries. If Time Travel is not
   available, create a replacement D1 database from the verified SQL export and
   bind the previous Worker to it; do not import over a live database.
4. Verify that `users`, `sessions`, `inventory_reservations`,
   `reservation_items`, and `payment_events` are absent; that legacy orders and
   products match the pre-deployment counts; and that the previous Worker can
   read products and create its expected legacy checkout flow.
5. Re-enable traffic only after reconciliation. Payments accepted by Mercado
   Pago after the bookmark must be reconciled manually before reopening sales.

Never deploy only the old Worker against the migrated schema while active
reservations exist, and never drop the new tables as an ad-hoc rollback.


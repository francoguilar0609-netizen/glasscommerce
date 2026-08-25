import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("staging serves static assets before the application worker", async () => {
  const config = JSON.parse(await readFile("wrangler.staging.jsonc", "utf8"));

  assert.equal(config.name, "glasscommerce-staging");
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.assets, {
    directory: "dist/client",
    binding: "ASSETS",
  });
  assert.equal(config.images.binding, "IMAGES");
  assert.equal(config.d1_databases.length, 1);
  assert.equal(config.d1_databases[0].binding, "DB");
  assert.equal(config.d1_databases[0].database_name, "glasscommerce-staging");
  assert.equal(config.vars.TRUST_PROXY_AUTH_HEADERS, "false");
  assert.equal(config.vars.ALLOW_LOCAL_REGISTRATION, "false");
  assert.equal("MERCADO_PAGO_ACCESS_TOKEN" in config.vars, false);
});


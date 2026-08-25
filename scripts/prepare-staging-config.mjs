import { readFile, writeFile } from "node:fs/promises";

const generatedPath = new URL("../dist/server/wrangler.json", import.meta.url);
const stagingPath = new URL("../wrangler.staging.jsonc", import.meta.url);
const outputPath = new URL("../dist/server/wrangler.staging.json", import.meta.url);

const generated = JSON.parse(await readFile(generatedPath, "utf8"));
const staging = JSON.parse(await readFile(stagingPath, "utf8"));

const output = {
  name: staging.name,
  main: generated.main,
  compatibility_date: generated.compatibility_date,
  compatibility_flags: generated.compatibility_flags,
  no_bundle: true,
  rules: generated.rules,
  workers_dev: staging.workers_dev,
  preview_urls: staging.preview_urls,
  d1_databases: staging.d1_databases.map((database) => ({
    ...database,
    migrations_dir: "../../drizzle",
  })),
  vars: staging.vars,
  triggers: staging.triggers,
  images: staging.images,
  assets: {
    directory: generated.assets.directory,
    binding: staging.assets.binding,
    run_worker_first: staging.assets.run_worker_first,
  },
  observability: staging.observability,
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log("Prepared dist/server/wrangler.staging.json");


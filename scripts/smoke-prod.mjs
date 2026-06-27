#!/usr/bin/env node

const baseUrl = process.env.SMOKE_BASE_URL;

if (!baseUrl) {
  console.error("Missing SMOKE_BASE_URL. Example: SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:prod");
  process.exit(1);
}

const routes = [
  "/health",
  "/login",
  "/dashboard?preview=1",
  "/assets?preview=1",
  "/consumables?preview=1",
  "/deployments?preview=1",
  "/locations?preview=1",
  "/maintenance?preview=1",
  "/audit?preview=1",
  "/reports?preview=1&reportId=asset-register",
  "/scan?preview=1",
];

async function checkRoute(route) {
  const response = await fetch(new URL(route, baseUrl), {
    redirect: "manual",
    headers: {
      accept: "text/html,application/json",
    },
  });

  const ok = response.status >= 200 && response.status < 400;
  return {
    route,
    status: response.status,
    ok,
  };
}

async function main() {
  const results = await Promise.all(routes.map((route) => checkRoute(route)));
  const failed = results.filter((result) => !result.ok);

  for (const result of results) {
    console.log(`${result.ok ? "OK " : "ERR"} ${result.status} ${result.route}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

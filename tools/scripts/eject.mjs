import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

const [app = "auth", destination = "ejected/auth"] = process.argv.slice(2);
const appPackage = JSON.parse(readFileSync(`apps/${app}/package.json`, "utf8"));
const queue = Object.keys(appPackage.dependencies ?? {}).filter((name) => name.startsWith("@swiss/"));
const libs = new Set();

while (queue.length > 0) {
  const name = queue.pop();
  const folder = name.replace("@swiss/", "");
  if (libs.has(folder)) continue;
  libs.add(folder);
  const manifest = JSON.parse(readFileSync(`libs/${folder}/package.json`, "utf8"));
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    if (dependency.startsWith("@swiss/")) queue.push(dependency);
  }
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(`apps/${app}`, join(destination, "apps", app), { recursive: true });
for (const lib of libs) {
  cpSync(`libs/${lib}`, join(destination, "libs", lib), { recursive: true });
}
cpSync("tsconfig.base.json", join(destination, "tsconfig.base.json"));
cpSync("pnpm-workspace.yaml", join(destination, "pnpm-workspace.yaml"));
writeFileSync(join(destination, "package.json"), JSON.stringify({
  name: `${app}-standalone`,
  private: true,
  packageManager: "pnpm@10.23.0",
}, null, 2));
writeFileSync(join(destination, "compose.yaml"), `services:
  mongo:
    image: mongo:7
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all"]
    ports: ["27017:27017"]
`);
mkdirSync(dirname(join(destination, "README.md")), { recursive: true });
writeFileSync(join(destination, "README.md"), `# ${app} fora do monorepo\n\n\`pnpm install\` e \`docker compose up -d\` sobem o Mongo. O app fica em \`apps/${app}\`.\n`);
console.log(`ejected ${app} to ${destination} with ${[...libs].join(", ")}`);

// Fails if the built client bundle contains anything that looks like an Azure
// endpoint, key, connection string or token (docs/07 definition of done #2/#4).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../app/dist');
const patterns = [
  /openai\.azure\.com/i,
  /cognitiveservices\.azure\.com/i,
  /services\.ai\.azure\.com/i,
  /InstrumentationKey=/i,
  /APPLICATIONINSIGHTS_CONNECTION_STRING/,
  /AZURE_OPENAI_(ENDPOINT|DEPLOYMENT|API_KEY)/,
  /api[-_]?key\s*[:=]/i,
  /\bsk-[A-Za-z0-9]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, // JWT
];

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

let failed = false;
for (const f of files(dist)) {
  const src = readFileSync(f, 'utf8');
  for (const re of patterns) {
    if (re.test(src)) {
      console.error(`✗ ${path.relative(dist, f)} matches ${re}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log(`✓ bundle scan clean (${files(dist).length} files)`);

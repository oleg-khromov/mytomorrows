import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, '../src/environments/environment.generated.ts');
const apiBaseUrl = process.env.API_BASE_URL ?? '/api/v1';

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `export const generatedEnvironment = {\n  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},\n} as const;\n`,
);

console.log(`Using API_BASE_URL=${apiBaseUrl}`);


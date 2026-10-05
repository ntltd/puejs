// Prints the minified + gzipped size of what each import adds to a bundle. Run after `yarn build`.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ENTRY = "\0size-entry";

async function bundledSize(source: string): Promise<number> {
  const bundle = await rolldown({
    input: ENTRY,
    logLevel: "silent",
    plugins: [
      {
        name: "size-entry",
        resolveId: (id) => (id === ENTRY ? id : null),
        load: (id) => (id === ENTRY ? source : null),
      },
    ],
  });
  const { output } = await bundle.generate({ format: "esm", minify: true });
  await bundle.close();
  const code = output.map((chunk) => (chunk.type === "chunk" ? chunk.code : "")).join("");
  return gzipSync(code).length;
}

const kilobytes = (bytes: number): string => `${(bytes / 1000).toFixed(1)} kB`;
const importOf = (names: string, path: string): string =>
  `import { ${names} } from ${JSON.stringify(join(dist, path))};\nconsole.log(${names});\n`;

const total = await bundledSize(importOf("createEmitter", "index.js"));
const staccato = await bundledSize(importOf("staccato", "odors/index.js"));
const sustained = await bundledSize(importOf("sustained", "odors/index.js"));

console.log(`total (core + odors): ${kilobytes(total)} gzip`);
console.log(`staccato: ${kilobytes(staccato)} gzip`);
console.log(`sustained: ${kilobytes(sustained)} gzip`);
console.log(`core without odors: ${kilobytes(total - staccato - sustained)} gzip`);

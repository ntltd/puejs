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
const sizes: Record<string, number> = {};
for (const name of ["staccato", "sustained", "soprano", "pesante", "fortissimo"]) {
  sizes[name] = await bundledSize(importOf(name, "odors/index.js"));
}

// createEmitter bundles the preset odors (staccato, sustained); the others are opt-in.
console.log(`createEmitter (core + preset odors): ${kilobytes(total)} gzip`);
for (const [name, size] of Object.entries(sizes)) console.log(`${name}: ${kilobytes(size)} gzip`);
console.log(`core without odors: ${kilobytes(total - sizes.staccato - sizes.sustained)} gzip`);

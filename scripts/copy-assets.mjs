import { cp, mkdir } from "fs/promises";
import { resolve } from "path";

const from = resolve("src/assets");
const to = resolve("dist/assets");

await mkdir(resolve("dist"), { recursive: true });
await cp(from, to, { recursive: true });

console.log(`[postbuild] Copiado ${from} -> ${to}`);

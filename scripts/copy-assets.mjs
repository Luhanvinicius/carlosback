import { cp, mkdir, access } from "fs/promises";
import { resolve } from "path";

const from = resolve("src/assets");
const to = resolve("dist/assets");

try {
  // Cria diretório dist se não existir
  await mkdir(resolve("dist"), { recursive: true });
  
  // Verifica se src/assets existe antes de copiar
  try {
    await access(from);
    // Se existe, copia
    await cp(from, to, { recursive: true });
    console.log(`[postbuild] Copiado ${from} -> ${to}`);
  } catch (error) {
    // Se não existe, apenas loga e continua (não é um erro crítico)
    console.log(`[postbuild] Diretório ${from} não existe, pulando cópia de assets`);
  }
} catch (error) {
  console.error(`[postbuild] Erro ao processar assets:`, error.message);
  // Não falha o build se houver erro ao copiar assets
  process.exit(0);
}

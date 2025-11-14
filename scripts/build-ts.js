// scripts/build-ts.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  // Verifica se o diretório dist existe, senão cria
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
    console.log('Created dist directory');
  }
  
  // Executa o TypeScript via node diretamente
  const tscPath = path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc');
  const configPath = path.join(__dirname, '..', 'tsconfig.build.json');
  
  console.log('Compiling TypeScript...');
  console.log(`Using TypeScript at: ${tscPath}`);
  console.log(`Using config: ${configPath}`);
  
  execSync(`node "${tscPath}" -p "${configPath}" --skipLibCheck`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  console.log('TypeScript compiled successfully!');
  
  // Verifica se pelo menos o app.js foi gerado
  const appJsPath = path.join(distPath, 'app.js');
  if (!fs.existsSync(appJsPath)) {
    throw new Error('dist/app.js was not generated after compilation');
  }
  
  console.log('Build verification: dist/app.js exists');
} catch (error) {
  console.error('Error compiling TypeScript:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1); // Sai com erro para que o Vercel saiba que o build falhou
}


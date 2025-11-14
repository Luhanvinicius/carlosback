// scripts/build-ts.js
const { execSync } = require('child_process');
const path = require('path');

try {
  // Executa o TypeScript via node diretamente
  const tscPath = path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc');
  const configPath = path.join(__dirname, '..', 'tsconfig.build.json');
  
  console.log('Compiling TypeScript...');
  execSync(`node "${tscPath}" -p "${configPath}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('TypeScript compiled successfully!');
} catch (error) {
  console.error('Error compiling TypeScript:', error.message);
  process.exit(1);
}


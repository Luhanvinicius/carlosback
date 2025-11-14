// scripts/generate-prisma.js
const { execSync } = require('child_process');
const path = require('path');

try {
  // Tenta executar o Prisma via node diretamente
  const prismaPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  
  console.log('Generating Prisma Client...');
  execSync(`node "${prismaPath}" generate --schema="${schemaPath}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('Prisma Client generated successfully!');
} catch (error) {
  console.error('Error generating Prisma Client:', error.message);
  process.exit(1);
}


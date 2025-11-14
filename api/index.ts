import serverless from "serverless-http";
// Importar do código compilado - o Vercel compila api/ separadamente
// @ts-ignore - O app.js está em dist/app.js após o build
const app = require("../dist/app");

const handler = serverless(app.default || app);

export default async function (req: any, res: any) {
  try {
    return await handler(req, res);
  } catch (error) {
    console.error("Error in handler:", error);
    throw error;
  }
}
import serverless from "serverless-http";
// Importar direto do TypeScript - Vercel compila automaticamente
import app from "../src/app";

const handler = serverless(app as any);

export default async function (req: any, res: any) {
  return handler(req, res);
}
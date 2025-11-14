import serverless from "serverless-http";
// Importar do código compilado (JavaScript)
const app = require("../dist/app");

const handler = serverless(app.default || app);

export default async function (req: any, res: any) {
  return handler(req, res);
}
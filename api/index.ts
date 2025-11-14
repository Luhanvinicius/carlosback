import serverless from "serverless-http";
// @ts-ignore - Importar do código compilado (JavaScript)
const app = require("../dist/app");

export default serverless(app.default || app);
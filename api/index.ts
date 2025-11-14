import serverless from "serverless-http";
// @ts-ignore - Importar do código compilado
const app = require("../dist/app");

module.exports = serverless(app.default || app);
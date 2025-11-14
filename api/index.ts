import serverless from "serverless-http";
import app from "../dist/app";

const handler = serverless(app as any);

export default async function (req: any, res: any) {
  return handler(req, res);
}
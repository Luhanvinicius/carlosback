import serverless from "serverless-http";
// @ts-ignore - arquivo compilado não tem tipos
import app from "../dist/app";

const handler = serverless(app as any);

export default async function (req: any, res: any) {
  return handler(req, res);
}
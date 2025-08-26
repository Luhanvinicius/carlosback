import serverless from "serverless-http";
import app from "../src/app";

const handler = serverless(app as any);
export default async (req: any, res: any) => handler(req, res);
export function cors(req: Request) {
  const origin = req.headers.get("Origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-wa-signature, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}


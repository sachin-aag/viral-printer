import { NextResponse } from "next/server";
export async function GET() {
  const secret = process.env.AWS_SECRET_ACCESS_KEY ?? "";
  const id = process.env.AWS_ACCESS_KEY_ID ?? "";
  return NextResponse.json({
    keyId: id,
    secretLen: secret.length,
    secretPrefix: secret.slice(0, 6),
    secretSuffix: secret.slice(-6),
  });
}

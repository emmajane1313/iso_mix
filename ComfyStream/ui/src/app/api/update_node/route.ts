import { NextRequest, NextResponse } from "next/server";

export const POST = async function POST(req: NextRequest) {
  const { endpoint, prompt } = await req.json();
  const res = await fetch(endpoint + "/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prompt),
  });

  return NextResponse.json(await res.json(), { status: res.status });
};

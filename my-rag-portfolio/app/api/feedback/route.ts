import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendResponse = await fetch('http://127.0.0.1:8000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) throw new Error("FastAPI Feedback failed");

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Feedback Bridge Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
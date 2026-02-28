import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const backendResponse = await fetch('http://127.0.0.1:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: body.message,
        modelId: body.modelId || 'gpt-4o'
      }),
    });

    if (!backendResponse.ok) throw new Error('Python Backend unreachable');

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Chat Bridge Failure:", error.message);
    return NextResponse.json({ reply: "Connection Error: Is Python running?" }, { status: 500 });
  }
}
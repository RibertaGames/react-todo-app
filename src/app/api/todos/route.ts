// src/app/api/todos/route.ts

import { NextRequest, NextResponse } from 'next/server';

const todos: { id: number; text: string }[] = [];
let nextId = 1;

// GETリクエスト
export async function GET() {
  return NextResponse.json({ todos });
}

// POSTリクエスト
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text } = body;

  const newTodo = { id: nextId++, text };
  todos.push(newTodo);

  return NextResponse.json(newTodo, { status: 201 });
}

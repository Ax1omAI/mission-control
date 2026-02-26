import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    demo: process.env.DEMO_MODE === 'true',
    message: process.env.DEMO_MODE === 'true'
      ? 'This is a live demo of Mission Control. All actions are simulated.'
      : undefined,
    github: 'https://github.com/Ax1omAI/mission-control',
  });
}

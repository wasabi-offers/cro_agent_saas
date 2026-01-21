import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the tracking script from public folder
    const scriptPath = join(process.cwd(), 'public', 'cro-tracker.js');
    const scriptContent = readFileSync(scriptPath, 'utf8');

    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new NextResponse('console.error("Tracking script not found");', {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

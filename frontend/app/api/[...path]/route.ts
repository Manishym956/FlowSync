import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const API_KEY = process.env.API_KEY ?? 'dev-api-key-change-in-production';

async function handleProxy(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // Extract path after /api
    const path = url.pathname.replace(/^\/api/, '');
    const search = url.search;

    const targetUrl = `${BACKEND_API_URL}/api${path}${search}`;

    // Get body if request has one
    let body: any = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await req.text();
      } catch (e) {
        // Body reading failed or empty
      }
    }

    const headers = new Headers();
    // Copy select client-side headers
    req.headers.forEach((value, key) => {
      if (
        key.toLowerCase() !== 'host' &&
        key.toLowerCase() !== 'authorization' &&
        key.toLowerCase() !== 'connection'
      ) {
        headers.set(key, value);
      }
    });

    // Attach server-only static API key
    headers.set('Authorization', `Bearer ${API_KEY}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      return NextResponse.json(responseData, { status: response.status });
    } else {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': contentType ?? 'text/plain',
        },
      });
    }
  } catch (err: any) {
    console.error('BFF proxy error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'BFF_PROXY_ERROR', message: err.message },
      },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleProxy(req);
}

export async function POST(req: NextRequest) {
  return handleProxy(req);
}

export async function PUT(req: NextRequest) {
  return handleProxy(req);
}

export async function PATCH(req: NextRequest) {
  return handleProxy(req);
}

export async function DELETE(req: NextRequest) {
  return handleProxy(req);
}

// app/api/connection-handlers/http/route.ts


import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { url, method, headers, body, timeout } = await req.json();

    if (!url || !method) {
      return NextResponse.json({ error: 'URL and method are required' }, { status: 400 });
    }

    // we wot allow any other methods than the ones listed here
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!allowedMethods.includes(method.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid HTTP method' }, { status: 400 });
    }

    const defaultHeaders = { 'Content-Type': 'application/json', ...headers };

    const response = await axios({
      url,
      method,
      headers: defaultHeaders,
      data: body,
      timeout: timeout || 5000, // timeout = 5 seconds
      validateStatus: () => true, // we use this to stop axios from throwing an error for non-2xx status codes
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        responseTime: Date.now() - startTime,
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

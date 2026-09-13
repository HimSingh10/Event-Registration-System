import type { IncomingMessage, ServerResponse } from 'http';
import { processAiChat, ChatRequestPayload } from '../../server/geminiHandler';

/**
 * Helper to safely extract payload across various serverless environments:
 * Handles pre-parsed JSON objects, raw JSON strings, or unparsed request streams.
 */
async function parseBody(req: any): Promise<ChatRequestPayload> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return { message: '' };
      }
    }
    return req.body;
  }

  // Fallback: Read from readable stream if body was not pre-parsed by runtime
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({ message: '' });
      }
    });
    req.on('error', () => {
      resolve({ message: '' });
    });
  });
}

/**
 * Universal JSON response sender supporting both Vercel helpers and standard Node HTTP responses
 */
function sendResponse(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(data));
}

/**
 * Vercel Serverless Function Handler for /api/gemini/chat
 */
export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method Not Allowed. Expected POST.' });
  }

  try {
    const payload = await parseBody(req);
    if (!payload || !payload.message || typeof payload.message !== 'string' || !payload.message.trim()) {
      return sendResponse(res, 400, { error: 'Invalid request: "message" field is required and cannot be empty.' });
    }
    const result = await processAiChat(payload);
    return sendResponse(res, 200, result);
  } catch (error: any) {
    console.error('Vercel Gemini Chat API Error:', error?.message || error);
    const statusCode = error?.message?.includes('Invalid request') ? 400 : 500;
    return sendResponse(res, statusCode, {
      error: error?.message || 'Server error occurred while processing AI request.',
    });
  }
}

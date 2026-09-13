import { GoogleGenAI } from '@google/genai';

export interface CompactEventContext {
  id: string;
  title: string;
  description?: string;
  category: string;
  eventType?: string;
  date: string;
  time?: string;
  venue?: string;
  address?: string;
  city?: string;
  locationType?: string;
  price: number;
  ticketType?: string;
  currency?: string;
  capacity?: number;
  availableSeats?: number;
  registrationDeadline?: string;
  status: string;
  organizer?: string;
  speakers?: string;
  tags?: string[];
}

export interface ChatRequestPayload {
  message: string;
  chatHistory?: Array<{ sender: 'user' | 'assistant'; content: string }>;
  eventsContext?: CompactEventContext[];
  focusedEvent?: CompactEventContext & {
    agenda?: Array<{ time: string; title: string; speaker?: string; description?: string }>;
    faqs?: Array<{ question: string; answer: string }>;
    terms?: string[];
  };
  userContext?: {
    interests?: string[];
    city?: string;
    wishlistCount?: number;
  };
  currentDate?: string;
}

export interface ChatResponseResult {
  content: string;
  events?: Array<{ eventId: string; reason?: string }>;
  recommendedEventIds: string[];
  suggestions: string[];
}

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
    });
  }
  return geminiClient;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function processAiChat(payload: ChatRequestPayload): Promise<ChatResponseResult> {
  if (!payload || typeof payload.message !== 'string' || !payload.message.trim()) {
    throw new Error('Invalid request: message cannot be empty');
  }

  const {
    message,
    chatHistory = [],
    eventsContext = [],
    focusedEvent,
    userContext,
    currentDate = new Date().toISOString().split('T')[0],
  } = payload;

  const client = getGeminiClient();

  if (!client) {
    return {
      content: `⚠️ **Gemini API Key Required**: No \`GEMINI_API_KEY\` was found in server environment variables.\n\nTo enable conversational AI assistance and personalized recommendations, please configure your \`GEMINI_API_KEY\` in your Vercel or server environment variables.\n\nYou can still explore events and register directly from the event catalog.`,
      recommendedEventIds: eventsContext.slice(0, 3).map((e) => e.id),
      events: eventsContext.slice(0, 3).map((e) => ({
        eventId: e.id,
        reason: 'Featured upcoming event in EventEase catalog',
      })),
      suggestions: [
        'How do I configure GEMINI_API_KEY?',
        'Browse all upcoming events',
        'Show me free workshops',
      ],
    };
  }

  // Format compact events catalog to pass to Gemini
  const compactCatalog = eventsContext.slice(0, 25).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    eventType: e.eventType || 'Event',
    date: e.date,
    time: e.time || 'TBD',
    venue: e.venue || 'TBD',
    city: e.city || (e.locationType === 'Virtual' ? 'Virtual' : 'In-Person'),
    format: e.locationType || 'In-Person',
    price: e.price === 0 ? 'Free' : `${e.currency || '$'}${e.price}`,
    ticketType: e.ticketType || (e.price === 0 ? 'Free' : 'Paid'),
    availableSeats: e.availableSeats ?? (e.capacity ? e.capacity : 'Available'),
    registrationDeadline: e.registrationDeadline || e.date,
    status: e.status,
    organizer: e.organizer || 'EventEase Host',
    speakers: e.speakers || 'Industry Speakers',
    summary: e.description ? e.description.slice(0, 140) : '',
  }));

  // Build prompt incorporating recent conversation history
  const historyText =
    chatHistory && chatHistory.length > 0
      ? `Recent Conversation Context (Last ${Math.min(chatHistory.length, 6)} messages):\n${chatHistory
          .slice(-6)
          .map((h) => `${h.sender === 'user' ? 'Attendee' : 'Assistant'}: ${h.content}`)
          .join('\n')}\n\n`
      : '';

  const focusedEventText = focusedEvent
    ? `Currently Viewed Event Context:\n${JSON.stringify(focusedEvent, null, 2)}\n\n`
    : '';

  const promptContext = `
Current System Date: ${currentDate}

Events Catalog (${compactCatalog.length} available events):
${JSON.stringify(compactCatalog, null, 2)}

${focusedEventText}${userContext ? `Attendee Profile Context:\n${JSON.stringify(userContext)}\n\n` : ''}${historyText}Attendee Query: "${message}"

CRITICAL INSTRUCTIONS:
1. You are the intelligent, helpful EventEase AI Assistant.
2. CRITICAL: Never hallucinate or invent events. Only recommend or discuss events that actually exist in the Events Catalog or Currently Viewed Event.
3. If no matching event exists in the catalog, state clearly: "I could not find any events matching your request in the current catalog."
4. For date-related queries (e.g. "this week", "upcoming", "this month"), compare event dates against Current System Date (${currentDate}).
5. For price-related queries (e.g. "free", "lowest price"), reference the price and ticketType fields accurately.
6. For seat queries, reference availableSeats and status fields accurately.
7. If the attendee asks about a currently viewed event, answer with precision regarding its schedule, speakers, venue, and registration rules.
8. To register for an event, explain that the attendee can click the [Register] button directly on the event card.
9. Return your response in STRICT JSON format conforming to this schema:
{
  "message": "Friendly, informative markdown response directly answering the user's question.",
  "events": [
    {
      "eventId": "evt-101",
      "reason": "Clear, concise reason why this specific event matches their question (e.g. 'Free entry, happening this Saturday in New Delhi')"
    }
  ],
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}
`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: promptContext,
      config: {
        responseMimeType: 'application/json',
        systemInstruction:
          'You are the official EventEase AI Assistant. Your job is to help attendees discover real events, compare schedules, check venue policies, and register. Never make up fake events. Always reference real event IDs from the provided catalog.',
      },
    });

    if (response.text) {
      let rawText = response.text.trim();
      // Remove markdown code fence if present
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      try {
        const parsed = JSON.parse(rawText);
        const rawEvents: Array<{ eventId: string; reason?: string }> = Array.isArray(parsed.events)
          ? parsed.events.filter((e: any) => e && typeof e.eventId === 'string')
          : [];

        const recIds = rawEvents.length > 0
          ? rawEvents.map((e) => e.eventId)
          : Array.isArray(parsed.recommendedEventIds)
          ? parsed.recommendedEventIds
          : [];

        return {
          content: parsed.message || parsed.content || 'Here are the matching events based on your request.',
          events: rawEvents,
          recommendedEventIds: recIds,
          suggestions: Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
            ? parsed.suggestions
            : [
                'Show me free technology events',
                'Which events are happening this week?',
                'Recommend events based on my interests',
              ],
        };
      } catch {
        return {
          content: response.text,
          recommendedEventIds: [],
          events: [],
          suggestions: ['Show me all events', 'Filter by category'],
        };
      }
    }

    throw new Error('Empty response received from Gemini API');
  } catch (err: any) {
    console.error(`Gemini API execution error with model ${GEMINI_MODEL}:`, err?.message || err);
    return {
      content: `⚠️ **Gemini API Error**: ${err?.message || 'Unable to complete request with Gemini API'}\n\nPlease check your \`GEMINI_API_KEY\` and server connectivity.`,
      recommendedEventIds: [],
      events: [],
      suggestions: [
        'Check GEMINI_API_KEY configuration',
        'Show me all events',
        'Filter by category',
      ],
    };
  }
}

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

/**
 * Server-Side Gemini API Handlers
 * Uses @google/genai with gemini-3.6-flash and secure server-only API keys.
 */
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

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

export interface OrganizerRequestPayload {
  task: 'generate_description' | 'generate_agenda' | 'generate_faqs' | 'suggest_titles';
  title?: string;
  category?: string;
  eventType?: string;
  format?: string;
  city?: string;
  venue?: string;
  currentDescription?: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

export interface ChatResponseResult {
  content: string;
  events?: Array<{ eventId: string; reason?: string }>;
  recommendedEventIds: string[];
  suggestions: string[];
}

/**
 * Handle conversational AI Event Assistant
 */
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
      content: `⚠️ **Gemini API Key Required**: No \`GEMINI_API_KEY\` was found in server environment variables.\n\nTo enable conversational AI assistance and personalized recommendations, please configure your \`GEMINI_API_KEY\` in your environment variables.\n\nYou can still explore events and register directly from the event catalog.`,
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
 * Handle Organizer AI tools (agenda generation, description expansion, FAQ generation)
 */
export async function processAiOrganizer(payload: OrganizerRequestPayload): Promise<any> {
  const { task, title = '', category = 'Technology', eventType = 'Conference', city = 'San Francisco' } = payload;
  const client = getGeminiClient();

  if (client) {
    try {
      let prompt = '';
      if (task === 'generate_description') {
        prompt = `Write a compelling, professional, and clear event description for an event titled "${title}", category "${category}", type "${eventType}" in "${city}". Include overview, who should attend, and what attendees will take away. Return JSON: { "description": "..." }`;
      } else if (task === 'generate_agenda') {
        prompt = `Generate a realistic 5-item schedule for an event titled "${title}", category "${category}", type "${eventType}". Return JSON: { "agenda": [ { "time": "09:00 - 10:00", "title": "Registration & Keynote", "description": "..." }, ... ] }`;
      } else if (task === 'generate_faqs') {
        prompt = `Generate 4 realistic FAQs for an event titled "${title}", category "${category}". Questions should cover parking/transit, prerequisites, refund policy, and recording availability. Return JSON: { "faqs": [ { "question": "...", "answer": "..." }, ... ] }`;
      } else {
        prompt = `Suggest 4 catchy, modern event titles and 3 marketing highlights for a ${category} ${eventType} in ${city}. Return JSON: { "titles": ["...", "..."], "highlights": ["...", "..."] }`;
      }

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an expert event producer and copywriter for top global conferences, hackathons, and masterclasses.',
        },
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (err) {
      console.warn('Gemini organizer call failed, falling back to heuristic engine:', err);
    }
  }

  // Resilient heuristic organizer output
  return generateHeuristicOrganizerResponse(payload);
}

// Heuristic Fallback Helpers
function generateHeuristicChatResponse(
  message: string,
  events: Array<any>,
  userContext?: any
): { content: string; recommendedEventIds: string[]; suggestions: string[] } {
  const q = message.toLowerCase();
  let matched = events.filter((e) => {
    const titleMatch = e.title.toLowerCase().includes(q);
    const catMatch = e.category.toLowerCase().includes(q);
    const cityMatch = e.city && e.city.toLowerCase().includes(q);
    const descMatch = e.description.toLowerCase().includes(q);
    return titleMatch || catMatch || cityMatch || descMatch;
  });

  // Check category keywords
  if (matched.length === 0) {
    if (q.includes('tech') || q.includes('ai') || q.includes('code') || q.includes('software')) {
      matched = events.filter((e) => e.category === 'Technology' || e.category === 'Hackathon');
    } else if (q.includes('business') || q.includes('saas') || q.includes('startup') || q.includes('growth')) {
      matched = events.filter((e) => e.category === 'Business');
    } else if (q.includes('workshop') || q.includes('learn') || q.includes('training')) {
      matched = events.filter((e) => e.category === 'Workshop');
    } else if (q.includes('music') || q.includes('concert') || q.includes('fest')) {
      matched = events.filter((e) => e.category === 'Music' || e.category === 'Cultural');
    } else if (q.includes('free')) {
      matched = events.filter((e) => e.ticketType === 'Free' || e.price === 0);
    } else if (q.includes('near') || q.includes('local') || q.includes('city')) {
      const city = userContext?.city || 'San Francisco';
      matched = events.filter((e) => e.city?.toLowerCase() === city.toLowerCase());
    } else {
      matched = events.slice(0, 3);
    }
  }

  const recIds = matched.slice(0, 3).map((e) => e.id);
  const recTitles = matched.slice(0, 3).map((e) => `**${e.title}** (${e.category}, ${e.city || 'Virtual'} - ${e.price === 0 ? 'Free' : '$' + e.price})`);

  let content = `I discovered **${matched.length}** event${matched.length === 1 ? '' : 's'} matching your inquiry.\n\n`;
  if (recTitles.length > 0) {
    content += `Top recommendations for you:\n` + recTitles.map((t) => `• ${t}`).join('\n') + `\n\nClick any of the cards below to view complete agendas, speaker lineups, or claim your pass!`;
  } else {
    content += `Explore our featured upcoming summits or let me know your preferred city or date range!`;
  }

  return {
    content,
    recommendedEventIds: recIds,
    suggestions: [
      'Show me free technology events',
      'What events are happening in San Francisco?',
      'Tell me about CodeCraft 48-Hour Hackathon',
      'Recommend workshops for beginners',
    ],
  };
}

function generateHeuristicOrganizerResponse(payload: OrganizerRequestPayload): any {
  const { task, title = 'Community Summit', category = 'Technology', eventType = 'Conference', city = 'San Francisco' } = payload;

  if (task === 'generate_description') {
    return {
      description: `Join us for **${title}**, an immersive ${eventType.toLowerCase()} bringing together passionate innovators, industry leaders, and creators from across ${city} and beyond.\n\n### Why Attend?\n• **World-Class Insights**: Learn actionable frameworks directly from experienced pioneers in ${category}.\n• **Interactive Deep Dives**: Gain hands-on practical skills and preview cutting-edge breakthroughs.\n• **High-Impact Networking**: Connect with founders, peers, and collaborators during curated mixer sessions.\n\nWhether you're looking to elevate your career, explore fresh perspectives, or expand your network, **${title}** offers unmatched value and inspiration. Early registration is encouraged as seats are strictly limited.`,
    };
  }

  if (task === 'generate_agenda') {
    return {
      agenda: [
        { time: '09:00 - 10:00', title: 'Check-in, Breakfast & Welcome', description: 'Collect your attendee badge and connect with fellow participants over artisan coffee.' },
        { time: '10:00 - 11:30', title: `Opening Keynote: The Future of ${category}`, description: 'Inspiring keynote address unveiling key trends, challenges, and roadmaps.' },
        { time: '11:45 - 13:00', title: 'Interactive Panel & Live Q&A', description: 'Expert discussion with audience questions and candid perspectives.' },
        { time: '13:00 - 14:15', title: 'Catered Networking Lunch', description: 'Enjoy healthy, delicious lunch options while networking in the expo area.' },
        { time: '14:30 - 16:30', title: 'Breakout Sessions & Practical Workshops', description: 'Hands-on collaborative tracks focused on execution and practical mastery.' },
        { time: '16:45 - 17:30', title: 'Closing Remarks & Networking Reception', description: 'Wrap-up insights, raffle awards, and refreshments.' },
      ],
    };
  }

  if (task === 'generate_faqs') {
    return {
      faqs: [
        { question: 'What is the refund and cancellation policy?', answer: 'Cancellations requested up to 7 days before the event are eligible for a 100% refund. Within 7 days, tickets may be transferred to another colleague.' },
        { question: 'Is parking available at the venue?', answer: `Yes, validated parking is available at the venue parking garage in ${city}. Public transit options are also within a 5-minute walk.` },
        { question: 'Will virtual attendees receive session recordings?', answer: 'Yes! All registered participants receive high-definition session recordings and presenter slides within 24 hours of the event.' },
        { question: 'What should I bring to the event?', answer: 'Please bring a photo ID and your digital EventEase QR ticket. If attending technical workshops, bringing your laptop is strongly recommended.' },
      ],
    };
  }

  return {
    titles: [
      `${title}: Breakthrough Edition 2026`,
      `NextGen ${category} Summit: Horizons & Practice`,
      `${city} ${category} Forum & Masterclass`,
    ],
    highlights: [
      'Direct access to top industry practitioners and mentors',
      'Actionable frameworks and verified case studies',
      'Exclusive networking with high-caliber attendees',
    ],
  };
}

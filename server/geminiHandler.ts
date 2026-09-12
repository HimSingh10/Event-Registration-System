/**
 * Server-Side Gemini API Handlers
 * Uses @google/genai with gemini-2.5-flash and secure server-only API keys.
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

export interface ChatRequestPayload {
  message: string;
  chatHistory?: Array<{ sender: 'user' | 'assistant'; content: string }>;
  eventsContext?: Array<{
    id: string;
    title: string;
    category: string;
    date: string;
    venue?: string;
    city?: string;
    price: number;
    ticketType?: string;
    description?: string;
    status: string;
    summary?: string;
  }>;
  userContext?: {
    interests?: string[];
    city?: string;
    wishlistCount?: number;
  };
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

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
].filter(Boolean) as string[];

/**
 * Handle conversational AI Event Assistant
 */
export async function processAiChat(payload: ChatRequestPayload): Promise<{
  content: string;
  recommendedEventIds: string[];
  suggestions: string[];
}> {
  const { message, chatHistory = [], eventsContext = [], userContext } = payload;
  const client = getGeminiClient();

  if (!client) {
    return {
      content: `⚠️ **Gemini API Key Required**: No \`GEMINI_API_KEY\` was found in server environment variables.\n\nTo enable conversational AI assistance and personalized recommendations, please add your \`GEMINI_API_KEY\` to your \`.env\` file.\n\nYou can still explore events and register directly from the event catalog.`,
      recommendedEventIds: eventsContext.slice(0, 3).map((e) => e.id),
      suggestions: [
        'How do I configure GEMINI_API_KEY?',
        'Browse all upcoming events',
        'Show me free workshops',
      ],
    };
  }

  // Format compact events catalog to minimize token bloat
  const compactCatalog = eventsContext.slice(0, 8).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    date: e.date,
    city: e.city || 'Virtual/Online',
    price: e.price === 0 ? 'Free' : `$${e.price}`,
    status: e.status,
    summary: e.summary || (e.description ? e.description.slice(0, 90) : ''),
  }));

  // Build prompt incorporating recent conversation history
  const historyText =
    chatHistory && chatHistory.length > 0
      ? `Recent Conversation Context:\n${chatHistory
          .slice(-6)
          .map((h) => `${h.sender === 'user' ? 'Attendee' : 'Assistant'}: ${h.content}`)
          .join('\n')}\n\n`
      : '';

  const promptContext = `
Events Catalog:
${JSON.stringify(compactCatalog)}

${userContext ? `Attendee Profile Context:\n${JSON.stringify(userContext)}\n` : ''}
${historyText}Attendee Query: "${message}"

Respond as the intelligent, helpful EventEase AI Assistant.
Return your response in STRICT JSON matching this schema:
{
  "content": "Friendly, informative markdown response directly answering the user's question and highlighting relevant events.",
  "recommendedEventIds": ["evt-101"], // IDs of any specific events discussed or recommended from the catalog above
  "suggestions": ["Follow-up question 1", "Follow-up question 2"]
}
`;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: promptContext,
        config: {
          responseMimeType: 'application/json',
          systemInstruction:
            'You are the intelligent EventEase AI Assistant. Help attendees discover events, check agendas, and understand venue policies. Refer to recent conversation history when answering follow-up queries. Always recommend real event IDs from the provided catalog when relevant.',
        },
      });

      if (response.text) {
        try {
          const parsed = JSON.parse(response.text);
          return {
            content: parsed.content || 'Here are the matching events based on your request.',
            recommendedEventIds: Array.isArray(parsed.recommendedEventIds) ? parsed.recommendedEventIds : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [
              'Show me free technology events',
              'What events are happening in San Francisco?',
              'Recommend workshops for this month',
            ],
          };
        } catch {
          return {
            content: response.text,
            recommendedEventIds: [],
            suggestions: ['Show me all events', 'Filter by category'],
          };
        }
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} execution error:`, err?.message || err);
    }
  }

  // Clear, non-silent error reporting when API calls fail
  const errorDetails = lastError?.message || 'Unable to complete request with Gemini API';
  return {
    content: `⚠️ **Gemini API Error**: ${errorDetails}\n\nPlease check your \`GEMINI_API_KEY\` and server connectivity.`,
    recommendedEventIds: [],
    suggestions: [
      'Check GEMINI_API_KEY configuration',
      'Show me all events',
      'Filter by category',
    ],
  };
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
        model: 'gemini-2.5-flash',
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

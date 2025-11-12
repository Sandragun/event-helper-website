const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function buildPrompt({ userInfo, availableEvents, conversationSummary, latestUserMessage }) {
  const missingFields = [];
  if (!userInfo?.name) missingFields.push('full name');
  if (!userInfo?.registration_number) missingFields.push('registration number');
  if (!userInfo?.email) missingFields.push('email');
  if (!userInfo?.phone) missingFields.push('phone number');

  const eventsSummary = availableEvents.map(evt => `- ${evt.title} (id: ${evt.id})`).join('\n') || 'No events currently available.';
  const baseInstructions = `You are Event Helper Bot, assisting students with event registrations.
  Use a friendly, concise tone. If the user greets you, greet them back.
  If required profile details are missing (${missingFields.join(', ') || 'none'}), politely ask for the missing items one by one.
  Only attempt to register when you are confident about the event selection.
  When you decide registration should proceed, set "registerEvent" to true and include the matched "eventId" and "eventName".
  If multiple events are mentioned ambiguously, ask the user to clarify.

  Respond strictly as a JSON object with the following shape:
  {
    "message": "string", (main reply rendered to the user)
    "followUps": ["optional", "follow up questions"],
    "missingFields": ["list", "of", "missing", "items"],
    "registerEvent": boolean,
    "eventId": "optional event uuid",
    "eventName": "optional title",
    "needsWebhook": boolean,
    "webhookPayload": {"any": "additional data to log"}
  }

  Avoid extra text outside JSON.`;

  return `${baseInstructions}

Known events:\n${eventsSummary}\n\nConversation context:\n${conversationSummary}\n\nLatest user message:\n${latestUserMessage}`;
}

export async function generateGeminiResponse({ messages, context }) {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key is missing. Set VITE_GEMINI_API_KEY to enable AI chatbot responses.');
    return null;
  }

  const conversationSummary = messages
    .map(msg => `${msg.type === 'user' ? 'User' : 'Bot'}: ${msg.text}`)
    .join('\n');

  const prompt = buildPrompt({
    userInfo: context.userInfo,
    availableEvents: context.availableEvents,
    conversationSummary,
    latestUserMessage: context.userMessage
  });

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        safetySettings: [
          { category: 'HARM_CATEGORY_SELF_HARM', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);
      return {
        id: makeId(),
        message: parsed.message || 'I am here to help you with events!',
        followUps: parsed.followUps || [],
        missingFields: parsed.missingFields || [],
        registerEvent: Boolean(parsed.registerEvent),
        eventId: parsed.eventId || null,
        eventName: parsed.eventName || null,
        needsWebhook: Boolean(parsed.needsWebhook),
        webhookPayload: parsed.webhookPayload || null
      };
    } catch (err) {
      console.error('Failed to parse Gemini response JSON:', err, text);
      return {
        id: makeId(),
        message: text,
        followUps: [],
        missingFields: [],
        registerEvent: false
      };
    }
  } catch (error) {
    console.error('Gemini request failed:', error);
    return null;
  }
}

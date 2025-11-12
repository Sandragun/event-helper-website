# Chatbot Integration Guide

## Overview

The application now supports **dual registration methods**:
1. **Traditional Form Registration** – Users fill out a form to register
2. **Gemini-Powered Chatbot** – Users can chat with an AI assistant that collects missing details, talks to your webhook, and finalises registration

Both methods generate a **QR code** for event attendance and store the QR image with the registration so it can be downloaded later.

## How It Works

### Chatbot Component

The chatbot is accessible from the User Dashboard via a "💬 Chatbot" button. When opened, it:

1. **Calls Google Gemini** using `VITE_GEMINI_API_KEY` to craft the next response and decide if enough data exists to register.
2. **Sends GET requests** to your webhook: `https://supasanjay.app.n8n.cloud/webhook/chatbot`
3. **Passes context** including:
   - User profile information (id, name, email, registration number, phone, role)
   - Available events list (id, title, description, contact)
   - Full conversation history
   - Gemini's structured response (for logging or downstream automations)

### Webhook Request Format

```
GET https://supasanjay.app.n8n.cloud/webhook/chatbot?message=<user_message>&context=<json_context>&profileId=<uuid>&userId=<uuid>
```

**Query Parameters:**
- `message`: The user's latest chat message
- `context`: JSON string containing:
  ```json
  {
    "userInfo": {
      "id": "user-uuid",
      "profile_id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "registration_number": "REG123",
      "phone": "1234567890",
      "role": "user"
    },
    "availableEvents": [
      {
        "id": "event-uuid",
        "title": "Event Title",
        "description": "Event Description",
        "support_contact": "support@example.com"
      }
    ],
    "userMessage": "I want to register for an event",
    "geminiResult": {
      "message": "JSON response produced by Gemini",
      "registerEvent": false,
      "eventId": null,
      "eventName": null,
      "missingFields": ["phone number"]
    }
  }
  ```
- `profileId` / `userId`: direct access to the Supabase `auth.users` id

### Gemini Response Format

Gemini is instructed to respond with JSON only:
```json
{
  "message": "Hi! I can help you register for events.",
  "followUps": ["Which event would you like?"],
  "missingFields": ["phone number"],
  "registerEvent": false,
  "eventId": null,
  "eventName": null,
  "needsWebhook": true,
  "webhookPayload": {"tags": ["greeting"]}
}
```
The chatbot renders `message` (and follow-ups) to the user, politely asks for missing fields, and only triggers registration when `registerEvent` is `true`.

### Registration Flow

1. User sends a message via chatbot.
2. Gemini analyses the conversation, determines missing data, and may ask clarifying questions.
3. Context + Gemini output are forwarded to your webhook (optional for automations/logging).
4. When Gemini marks `registerEvent: true` and identifies an event:
   - Chatbot matches the event by id or name.
   - Verifies the user is logged in and profile details are complete.
   - Creates a registration record in Supabase.
   - Generates a QR code **and stores the image (Data URL)** inside `event_registrations.additional_details.qr_code_image`.
   - Displays the QR code in a modal so the user can download it immediately.

### QR Code Generation & Storage

Each registration stores:
```json
{
  "event_id": "event-uuid",
  "user_id": "user-uuid",
  "timestamp": 1731352200000
}
```
- `qr_code` field keeps the raw payload (used for scanning)
- `additional_details.qr_code_image` stores the PNG Data URL for future downloads

Users can revisit **My Registrations** to re-download the QR at any time.

## Integration Points

### User Dashboard
- **Chatbot Button**: Opens/closes the AI assistant.
- **My Registrations**: Shows event posters, notes, attendance status, and QR download buttons.

### Chatbot Features
- Gemini-driven natural language understanding
- Missing detail detection (name, registration number, email, phone)
- Webhook logging with profile identifiers
- Inline QR code download after registration
- Stored QR images for later retrieval

## Webhook Response Handling

The chatbot still consumes webhook responses if they contain a `message` field (e.g. acknowledgements or custom prompts). Everything else is ignored after logging, so your webhook can remain optional.

Supported response types:
1. JSON with `message`, `response`, `text`, or `answer`
2. Plain text strings
3. JSON objects with `eventId`, `registerEvent`, etc. (legacy support)

## Example Conversations

### User: "What events are available?"
Gemini responds with a friendly list and follow-up question. Webhook receives the full context for logging.

### User: "Register me for Tech Conference"
Gemini response:
```json
{
  "message": "Great choice! I'll sign you up for Tech Conference.",
  "registerEvent": true,
  "eventName": "Tech Conference",
  "eventId": "2e1b179a-fa2d-4f68-a5a8-123456789abc"
}
```
The chatbot completes registration, stores the QR image, and displays the download modal.

## Error Handling

- **Missing Gemini key**: Chatbot falls back to webhook-only behaviour and logs a console warning.
- **Webhook down**: Gemini conversation continues; webhook errors are logged to console.
- **User not logged in**: Chatbot prompts the user to log in.
- **Profile incomplete**: Chatbot requests missing details before registering.
- **Duplicate registration**: User is informed they're already registered.

## Testing

1. Log in as a user.
2. Click the "💬 Chatbot" button.
3. Ask about events; confirm AI response.
4. Proceed with registration via chatbot.
5. Confirm QR modal appears and “My Registrations” shows the saved QR + poster.
6. Check your n8n workflow receives requests at `https://supasanjay.app.n8n.cloud/webhook/chatbot`.

## Notes

- Chatbot requires `VITE_GEMINI_API_KEY` to be set (for local and Netlify builds).
- Webhook requests always include `profileId` so you can tie chats to Supabase users.
- Stored QR images allow users to re-download without re-registering.
- Admin dashboard shows the latest poster previews automatically after uploads.
- Both form and chatbot registrations share the same table and QR scanning logic.


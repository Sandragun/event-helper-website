# Chatbot Integration Guide

## Overview

The application now supports **dual registration methods**:
1. **Traditional Form Registration** - Users fill out a form to register
2. **Chatbot Registration** - Users can chat with a bot to register for events

Both methods generate a **QR code** for event attendance.

## How It Works

### Chatbot Component

The chatbot is accessible from the User Dashboard via a "💬 Chatbot" button. When opened, it:

1. **Sends GET requests** to your webhook: `https://supasanjay.app.n8n.cloud/webhook-test/chatbot`
2. **Passes context** including:
   - User information (name, email, registration number, phone)
   - Available events list
   - User's message

### Webhook Request Format

```
GET https://supasanjay.app.n8n.cloud/webhook-test/chatbot?message=<user_message>&context=<json_context>
```

**Query Parameters:**
- `message`: The user's chat message
- `context`: JSON string containing:
  ```json
  {
    "userInfo": {
      "email": "user@example.com",
      "name": "John Doe",
      "registration_number": "REG123",
      "phone": "1234567890"
    },
    "availableEvents": [
      {
        "id": "event-uuid",
        "title": "Event Title",
        "description": "Event Description"
      }
    ],
    "userMessage": "I want to register for an event"
  }
  ```

### Expected Webhook Response

The webhook should return a JSON response. The chatbot handles multiple formats:

**Option 1: Simple Message**
```json
{
  "message": "I can help you register for events!"
}
```

**Option 2: Event Registration Response**
```json
{
  "message": "I'll register you for the Tech Conference event!",
  "eventId": "event-uuid-here",
  "registerEvent": true
}
```

**Option 3: Text Response (non-JSON)**
```
Plain text response will be displayed as bot message
```

### Registration Flow

1. User sends a message via chatbot
2. Chatbot sends GET request to webhook with user message and context
3. Webhook processes the request and returns a response
4. If the response indicates registration intent:
   - Chatbot extracts event ID (from `eventId` field or by parsing event name)
   - Verifies user is logged in
   - Checks if user has required details (registration number, phone)
   - Creates registration in database
   - Generates QR code
   - Displays QR code to user

### QR Code Generation

After successful registration (via form or chatbot), a QR code is generated containing:
```json
{
  "event_id": "event-uuid",
  "user_id": "user-uuid",
  "timestamp": 1234567890
}
```

This QR code can be scanned by admins to mark attendance.

## Integration Points

### User Dashboard
- **Chatbot Button**: Green "💬 Chatbot" button in the header
- Opens chatbot interface in a floating window
- Passes current events list to chatbot

### Chatbot Features
- Real-time chat interface
- Webhook integration
- Event registration via chat
- QR code generation and display
- Auto-refresh of user data after registration

## Webhook Response Formats Supported

The chatbot is flexible and handles:

1. **JSON with message field**: `{ "message": "..." }`
2. **JSON with response field**: `{ "response": "..." }`
3. **JSON with text field**: `{ "text": "..." }`
4. **JSON with answer field**: `{ "answer": "..." }`
5. **Plain text responses**
6. **Event registration indicators**:
   - `eventId` or `event_id` field
   - `registerEvent`, `register`, or `register_for_event` boolean
   - Text containing "register" or "sign up"

## Example Conversations

### User: "What events are available?"
**Webhook Response:**
```json
{
  "message": "Here are the available events: Tech Conference, Hackathon, Workshop. Which one would you like to register for?"
}
```

### User: "Register me for Tech Conference"
**Webhook Response:**
```json
{
  "message": "I'll register you for the Tech Conference!",
  "eventId": "tech-conference-uuid",
  "registerEvent": true
}
```

The chatbot will then:
1. Register the user for the event
2. Generate a QR code
3. Display the QR code in a modal

## Error Handling

- If webhook is unavailable, chatbot shows error message
- If user is not logged in, chatbot prompts for login
- If user details are missing, chatbot requests information
- If event not found, chatbot informs user
- If already registered, chatbot confirms existing registration

## Testing

1. Log in as a user
2. Click "💬 Chatbot" button
3. Send a message to test webhook connection
4. Try registering for an event via chatbot
5. Verify QR code is generated and displayed

## Notes

- Chatbot requires user to be logged in for registration
- User must have registration number and phone number in profile
- Chatbot automatically refreshes user data after registration
- QR codes are unique per registration
- Both form and chatbot registrations use the same database table


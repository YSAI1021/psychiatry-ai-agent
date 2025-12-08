# Debug Fix Summary: OpenAI API Key Issue

## Problem Identified

The chat flow was failing with "I apologize, but I encountered an error" because **OpenAI API calls were being made from client-side code**, but the API key (`process.env.OPENAI_API_KEY`) is only available on the **server-side**.

### Root Cause

1. **Client-side code cannot access server environment variables**
   - `app/page.tsx` is a client component (`'use client'`)
   - It was directly calling agent functions that use `lib/openai.ts`
   - `lib/openai.ts` uses `process.env.OPENAI_API_KEY`, which is `undefined` in the browser
   - This caused `openai` to be `null`, making all API calls fail silently

2. **Why `/api/vercel-test` worked**
   - It's a server-side API route (`pages/api/vercel-test.ts`)
   - Server routes have access to `process.env` variables
   - The API key was accessible, so the test endpoint worked correctly

## Solution Implemented

### 1. Created Server-Side API Route (`pages/api/chat.ts`)

**What was changed:**
- Created a unified API endpoint at `/api/chat` that handles all agent types server-side
- All OpenAI API calls now happen on the server where the API key is available
- Added comprehensive error logging with `console.error()` to capture:
  - Request validation errors
  - OpenAI API errors (status codes, response data)
  - Stack traces for debugging
  - Error types and codes

**Error handling improvements:**
- Validates request format (method, required fields, message structure)
- Validates message array format (ensures valid roles: system/user/assistant)
- Validates message content (string type checks)
- Safe fallback responses that don't expose internal errors to clients
- Development vs production error detail levels

**Why this fixes it:**
- Server-side routes have access to `process.env.OPENAI_API_KEY`
- The API key is never exposed to the client
- All OpenAI calls are now properly authenticated

### 2. Updated Client Code (`app/page.tsx`)

**What was changed:**
- Removed direct imports of agent functions that call OpenAI
- Added `callChatAPI()` helper function that makes HTTP requests to `/api/chat`
- Updated all agent handlers to use the API route instead of direct function calls:
  - `handleIntakeAgent()` → calls `/api/chat` with `AgentType.INTAKE`
  - `transitionToSummary()` → calls `/api/chat` with `AgentType.SUMMARY`
  - `handleRecommendationAgent()` → calls `/api/chat` with `AgentType.RECOMMENDATION`
  - `handleBookingAgent()` → calls `/api/chat` with `AgentType.BOOKING`
  - `handlePsychiatristSelect()` → calls `/api/chat` with `AgentType.BOOKING`

**Why this fixes it:**
- Client code now makes HTTP requests to server-side API routes
- Server routes handle OpenAI calls with access to the API key
- Proper separation of concerns (client → API → OpenAI)

### 3. Error Logging Enhancements

**Added logging at multiple levels:**

1. **API Route (`pages/api/chat.ts`):**
   ```typescript
   console.error('[API] Chat handler error:', {
     message: error.message,
     stack: error.stack,
     name: error.name,
     code: error.code,
     status: error.status,
     response: error.response?.data,
   });
   ```

2. **Client-side (`app/page.tsx`):**
   ```typescript
   console.error('[Client] Error calling chat API:', {
     message: error.message,
     stack: error.stack,
   });
   ```

**Benefits:**
- Easy to trace errors from client → API → OpenAI
- Console logs show exactly where failures occur
- Error details help debug issues in production

### 4. Safe Fallback Responses

**Implemented in API route:**
- Never exposes internal error details to clients in production
- Provides user-friendly error messages
- Development mode includes more details for debugging
- Handles OpenAI API errors gracefully (rate limits, invalid keys, etc.)

## Technical Details

### Message Format Validation

The API route now validates:
- ✅ Message array is an array
- ✅ Each message has a valid role (`'user' | 'assistant' | 'system'`)
- ✅ Each message has string content
- ✅ Required fields are present for each agent type

### Model Consistency

- All agents use `'gpt-4o-mini'` consistently
- Model string matches across all agent implementations
- No model mismatch issues

### Role Usage

- ✅ System prompts use `role: 'system'`
- ✅ User messages use `role: 'user'`
- ✅ Assistant responses use `role: 'assistant'`
- All roles are properly typed and validated

## Testing Checklist

After deployment, verify:
1. ✅ Intake agent responds to messages
2. ✅ Summary generation works
3. ✅ Recommendation agent filters psychiatrists
4. ✅ Booking agent generates emails
5. ✅ Error messages are user-friendly
6. ✅ Console logs show detailed errors for debugging

## Why This Was Failing

**Before the fix:**
```
Browser (Client) → lib/openai.ts → process.env.OPENAI_API_KEY (undefined) → OpenAI API fails
```

**After the fix:**
```
Browser (Client) → /api/chat (Server) → process.env.OPENAI_API_KEY (available) → OpenAI API succeeds
```

The fundamental issue was trying to access a **server-side environment variable from client-side code**. Next.js environment variables are only available on the server unless prefixed with `NEXT_PUBLIC_`, but we cannot expose API keys to the client for security reasons.

## Files Modified

1. **Created:** `pages/api/chat.ts` - New server-side API route
2. **Modified:** `app/page.tsx` - Updated to call API route instead of direct agent functions

## Additional Notes

- The `/api/vercel-test` endpoint worked because it's a server-side API route
- All agent logic remains in `lib/agents/*.ts` (no changes needed there)
- The API route acts as a proxy, maintaining the same interface
- Error handling is now consistent across all agents


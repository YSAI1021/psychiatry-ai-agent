# Quick Start Guide

## Setup (5 minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add:
   - `OPENAI_API_KEY` - Your OpenAI API key (required)
   - `OPENAI_MODEL` - Model to use (default: `gpt-4o-mini`)
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (optional for basic testing)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (optional for basic testing)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Testing Without Supabase

The app works without Supabase for basic testing:
- Chat intake works
- Summary generation works
- Psychiatrist matching works (uses mock data)
- Booking form works but won't save to database

To fully test booking, set up Supabase tables as described in README.md.

## Key Routes

- `/` - Welcome page
- `/chat` - Start intake conversation
- `/summary` - Review/edit clinical summary
- `/recommendations` - View matched psychiatrists
- `/book` - Book appointment with psychiatrist

## Next Steps

1. **For Production:**
   - Set up Supabase database with required tables (see README.md)
   - Deploy to Vercel
   - Add environment variables in Vercel dashboard

2. **For Customization:**
   - Edit system prompt in `lib/openai.ts` (`INTAKE_SYSTEM_PROMPT`)
   - Update psychiatrist database in `lib/matching.ts` (`MOCK_PSYCHIATRISTS`)
   - Customize summary schema in `lib/store.ts` (`ClinicalSummary` interface)

3. **For Testing:**
   - Enable test mode toggle (to be added in UI)
   - Log conversation metadata for psychiatrist review
   - Iterate based on feedback

## Troubleshooting

**Build errors:** Make sure all environment variables are set correctly.

**Chat not working:** Verify your OpenAI API key is valid and has credits.

**TypeScript errors:** Run `npm run build` to see detailed error messages.

## Support

See README.md for detailed documentation and Supabase schema setup.


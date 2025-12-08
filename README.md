# Psychiatry AI Intake Assistant

A multi-agent AI psychiatry intake assistant built with Next.js, React, and OpenAI GPT-4. This tool provides clinical-grade patient pre-assessments through a conversational interface where multiple LLM-powered agents collaborate in a continuous flow.

## Features

### Multi-Agent Architecture

1. **Intake Agent** - Collects structured psychiatric data
   - Gathers clinical history, symptoms, medications
   - Administers PHQ-9 depression screening
   - Tracks completion (must reach ≥75% before proceeding)

2. **Summary Agent** - Generates clinical summaries
   - Creates human-readable psychiatric intake report
   - Provides editable interface with live preview
   - Allows patient review and correction

3. **Recommendation Agent** - Matches patients with psychiatrists
   - Filters based on location, insurance, availability
   - Displays psychiatrist profiles with specialties

4. **Booking Agent** - Manages appointment booking
   - Generates editable referral email drafts
   - Includes clinical summary for psychiatrist review
   - Mock email sending functionality

### User Interface

- **Dark mode** by default with light mode toggle
- **ChatGPT-like interface** with resizable input
- **Live preview panel** for clinical summary (auto-hides after confirmation)
- **Responsive design** with shadcn/ui components
- **Security disclaimer** banner for crisis situations

### Data Management

- **Export capabilities**: Download summary as `.txt` file
- **Copy to clipboard** for EMR integration
- **Supabase integration** for data persistence
- **Structured data storage** (no raw chat messages stored)

## Technology Stack

| Area | Technology |
|------|-----------|
| UI Framework | React + Next.js 16 |
| Styling | Tailwind CSS + shadcn/ui |
| LLM Provider | OpenAI GPT-4o-mini |
| Agent System | Custom routed prompts |
| State Management | Zustand |
| Backend | Supabase |
| Booking | Email generation + mock |
| PHQ-9 | Integrated scoring logic |
| Summary Format | Human-readable text |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- OpenAI API key
- Supabase account (for database)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd psychiatry-ai-agent
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
cp env.example .env.local
```

Fill in your credentials:

```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up Supabase database**

- Create a new Supabase project
- Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
- This will create the necessary tables and insert sample psychiatrist data

5. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
psychiatry-ai-agent/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main chat interface and agent orchestration
│   └── globals.css         # Global styles
├── components/
│   ├── chat/               # Chat UI components
│   │   ├── chat-container.tsx
│   │   ├── chat-input.tsx
│   │   └── chat-message.tsx
│   ├── ui/                 # shadcn/ui components
│   ├── clinical-summary-view.tsx  # Summary review with live preview
│   ├── email-preview.tsx          # Email draft editing
│   ├── psychiatrist-card.tsx      # Psychiatrist profile cards
│   ├── security-disclaimer.tsx    # Crisis warning banner
│   └── theme-provider.tsx         # Dark mode provider
├── lib/
│   ├── agents/             # Agent implementations
│   │   ├── intake-agent.ts
│   │   ├── summary-agent.ts
│   │   ├── recommendation-agent.ts
│   │   └── booking-agent.ts
│   ├── store.ts            # Zustand state management
│   ├── openai.ts           # OpenAI client configuration
│   ├── supabase.ts         # Supabase client and types
│   └── utils.ts            # Utility functions
├── supabase-schema.sql     # Database schema
└── README.md
```

## Agent Flow

1. **Intake Agent** starts the conversation
   - Collects: chief complaint, HPI, past history, medications, safety concerns, substance use, functional impact
   - Administers PHQ-9 screening (9 questions, 0-3 scale)
   - Tracks completion percentage
   - Transitions when ≥75% complete

2. **Summary Agent** generates clinical summary
   - Converts intake data to natural-language report
   - Format: "A [age]-year-old [gender] presenting with..."
   - Includes all clinical data points
   - Provides editable interface with live preview

3. **Recommendation Agent** finds psychiatrists
   - Asks for: location, insurance, payment preferences, availability
   - Filters database based on criteria
   - Displays 3-5 matching profiles

4. **Booking Agent** handles referral
   - Patient selects psychiatrist
   - Generates editable email draft with clinical summary
   - Patient reviews and confirms
   - Email sent (or mocked) via Supabase

## PHQ-9 Screening

The Patient Health Questionnaire-9 (PHQ-9) is integrated for depression screening:
- 9 questions, scored 0-3 each (total 0-27)
- Administered during intake
- Score included in clinical summary
- Severity interpretation provided

## Security & Privacy

- **No raw chat messages stored** - only structured data and summaries
- **Secure API key storage** via `.env.local`
- **Crisis warning banner** with 988 Suicide & Crisis Lifeline
- **HIPAA considerations** - use appropriate safeguards for production

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

The app will automatically deploy on every push to main branch.

## Development

### Adding New Agents

1. Create agent file in `lib/agents/`
2. Add agent type to `lib/openai.ts` enum
3. Update agent flow in `lib/store.ts`
4. Add routing logic in `app/page.tsx`

### Customizing UI

- Components use shadcn/ui - customize in `components/ui/`
- Styles use Tailwind CSS - modify in `app/globals.css`
- Theme configured in `components/theme-provider.tsx`

## Testing

For user testing with psychiatrists:
- Use mock psychiatrist data in development
- Test complete flow from intake to booking
- Verify clinical summary accuracy
- Check PHQ-9 scoring logic

## Limitations

- Email sending is currently mocked (not production-ready)
- LLM responses may vary (prompt engineering may be needed)
- Supabase connection required (falls back to mock data if unavailable)
- No authentication system (add as needed for production)

## Contributing

This is a final project submission. For production use:
- Add user authentication
- Implement actual email service
- Add error handling and retries
- Enhance LLM prompt engineering
- Add comprehensive testing
- Implement HIPAA compliance measures

## License

[Your License Here]

## Support

For questions or issues:
- Review agent prompts in `lib/agents/`
- Check Supabase connection and schema
- Verify OpenAI API key is valid
- Check browser console for errors

## Acknowledgments

- Built for Yale SOM LLM Final Project
- Uses OpenAI GPT-4 for multi-agent orchestration
- UI components from shadcn/ui
- Database powered by Supabase

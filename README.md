# AI Psychiatry Intake Assistant

A Next.js web application that serves as a highly specific AI psychiatry intake assistant. It guides patients through a conversational intake session, generates structured clinical summaries, detects safety risks, matches relevant psychiatrists, and integrates with an appointment booking system.

## Features

- **Conversational Intake**: Natural, guided chat interface for psychiatric intake assessment
- **Clinical Summary Generation**: Auto-generated, editable structured JSON summaries
- **Safety Risk Detection**: Keyword and LLM-based detection of safety concerns
- **Psychiatrist Matching**: AI-powered matching based on symptoms and specialties
- **Appointment Booking**: Integration with Supabase for appointment requests
- **Dark/Light Theme**: Toggleable theme using next-themes
- **Privacy-First**: Chat transcripts are not stored; only structured summaries

## Technology Stack

- **Frontend**: React + Next.js 16 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Theming**: next-themes
- **LLM Provider**: OpenAI (GPT-4o-mini or GPT-4o)
- **State Management**: Zustand
- **Storage & Backend**: Supabase
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Supabase account (optional, for production)

### Installation

1. Clone the repository:
```bash
cd psychiatry-ai-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Optional: For Supabase integration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
psychiatry-ai-agent/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # Chat intake endpoint
│   │   ├── summary/      # Summary generation endpoint
│   │   ├── safety/       # Safety risk detection endpoint
│   │   └── book/         # Appointment booking endpoint
│   ├── chat/             # Chat intake page
│   ├── summary/          # Clinical summary page
│   ├── recommendations/  # Psychiatrist recommendations page
│   ├── book/             # Booking page
│   └── layout.tsx        # Root layout with theme provider
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── navbar.tsx        # Navigation bar
│   └── theme-provider.tsx
├── lib/
│   ├── store.ts          # Zustand state management
│   ├── openai.ts         # OpenAI integration
│   ├── supabase.ts       # Supabase integration
│   └── matching.ts       # Psychiatrist matching algorithm
└── public/               # Static assets
```

## Key Features Explained

### 1. Conversational Intake

The chat interface uses OpenAI's GPT models with a specialized system prompt for psychiatric intake. The assistant:
- Builds rapport with patients
- Asks comprehensive clinical questions
- Gathers symptom information, medication history, and safety concerns
- Maintains a warm, non-judgmental tone

### 2. Clinical Summary Generation

After the intake conversation, the system extracts structured data into a JSON schema including:
- Chief complaint
- Symptoms and duration
- Prior diagnoses
- Current medications
- Safety concerns
- Functional impact
- Treatment preferences
- Triage level (normal/urgent/emergency)

The summary is fully editable before saving or submitting.

### 3. Safety Risk Detection

Dual-layer safety detection:
- **Keyword-based**: Detects emergency phrases (e.g., "kill myself", "suicide")
- **LLM-based**: Contextual assessment of safety risks

Risk levels: `low`, `moderate`, `high`, `emergency`

### 4. Psychiatrist Matching

Matches patients with psychiatrists based on:
- Symptom keywords
- Prior diagnoses
- Specialty tags
- Safety concerns (prioritizes psychosis specialists for hallucinations/delusions)

### 5. Supabase Integration

Supabase tables (to be created):
- `clinical_summaries`: Stores structured summaries
- `appointments`: Stores booking requests
- `psychiatrists`: Psychiatrist database (or use mock data)

## Supabase Schema

Create these tables in your Supabase project:

### clinical_summaries
```sql
CREATE TABLE clinical_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  summary_data JSONB NOT NULL,
  triage_level VARCHAR(20) NOT NULL,
  test_mode BOOLEAN DEFAULT false,
  user_rating INTEGER,
  comments TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### appointments
```sql
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  psychiatrist_id VARCHAR(50) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_email VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(50),
  preferred_time VARCHAR(255) NOT NULL,
  summary_id UUID REFERENCES clinical_summaries(id),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will automatically deploy on push to main branch.

### Environment Variables for Production

Ensure all environment variables from `.env.local` are set in your hosting platform.

## Security & Privacy

- **API Keys**: Stored securely in `.env.local` (not committed to git)
- **No Chat Storage**: Raw chat transcripts are never stored
- **Structured Data Only**: Only structured summaries are saved
- **Input Validation**: Forms validate for injection risks
- **Security Notices**: Users are informed that the AI does not provide diagnoses or emergency services

## Testing Mode

Enable test mode to log metadata for user testing:
- Toggle test mode in the app
- Logs timestamps, user ratings, and comments
- Helps with iteration based on psychiatrist feedback

## Export & Import

- **Export Summary**: Download summary as JSON file
- **Copy for EMR**: Copy formatted text for pasting into EMR systems

## Customization

### System Prompt

Edit the `INTAKE_SYSTEM_PROMPT` in `lib/openai.ts` to refine the intake conversation style.

### Psychiatrists Database

Update `MOCK_PSYCHIATRISTS` in `lib/matching.ts` or integrate with Supabase `psychiatrists` table.

### Summary Schema

Modify the `ClinicalSummary` interface in `lib/store.ts` to adjust the summary structure based on feedback.

## License

MIT

## Disclaimer

This application is for educational and research purposes. It does not provide medical diagnoses or emergency services. Always consult with licensed healthcare professionals for medical advice.

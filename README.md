# AI Psychiatry Intake Assistant

A Next.js web application featuring a conversational AI psychiatry intake assistant with a multi-agent system. The app guides patients through structured intake assessments, generates clinical summaries, matches psychiatrists, and handles appointment booking—all within a single seamless chat interface.

## Features

- **Multi-Agent System**: Sequential agents handle intake, summary extraction, recommendations, and booking
- **Conversational Interface**: Single-page chat interface with natural conversation flow
- **PHQ-9 Integration**: Automatic administration and scoring of the Patient Health Questionnaire-9
- **Clinical Summary Generation**: Structured DSM-based summaries extracted from conversations
- **Psychiatrist Matching**: AI-powered matching based on symptoms, insurance, location, and preferences
- **Appointment Booking**: Integrated booking system with Supabase
- **Export & EMR Integration**: Export summaries as JSON and copy formatted text for EMR pasting
- **Dark/Light Theme**: Toggleable theme using next-themes

## Technology Stack

- **Frontend**: React + Next.js 16 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Theming**: next-themes
- **LLM Provider**: OpenAI (GPT-4o-mini or GPT-4o)
- **State Management**: Zustand
- **Storage & Backend**: Supabase
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Supabase account (optional, for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YSAI1021/psychiatry-ai-agent.git
cd psychiatry-ai-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
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
│   │   ├── chat/         # Multi-agent chat endpoint
│   │   ├── summary/      # Summary generation endpoint
│   │   ├── recommendations/ # Recommendations endpoint
│   │   └── book/         # Appointment booking endpoint
│   └── page.tsx          # Main single-page chat interface
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── psychiatrist-card.tsx  # Psychiatrist recommendation cards
│   └── phq9-question.tsx      # PHQ-9 question component
├── lib/
│   ├── store.ts          # Zustand state management
│   ├── agents.ts         # Multi-agent system prompts
│   ├── openai.ts         # OpenAI API integration
│   ├── supabase.ts       # Supabase integration
│   ├── matching.ts       # Psychiatrist matching algorithm
│   └── phq9.ts           # PHQ-9 data structures and scoring
└── public/               # Static assets
```

## Multi-Agent System

The application uses four sequential agents:

### 1. Intake Agent
- Guides patients through structured psychiatric intake
- Asks about chief complaint, symptoms, history, medications, safety concerns
- Administers PHQ-9 questionnaire (all 9 questions)
- Uses concise, professional, information-gathering tone

### 2. Summary Agent
- Extracts structured clinical summary from conversation
- Formats data following DSM/psychiatric interview structure
- Includes identifying info, HPI, past history, symptoms, safety concerns, preferences
- Calculates PHQ-9 total score and severity

### 3. Recommendation Agent
- Matches patients with psychiatrists based on:
  - Symptom alignment with specialties
  - Insurance network status
  - Location preferences
  - Treatment approach preferences
  - PHQ-9 severity level

### 4. Booking Agent
- Handles appointment booking confirmation
- Gathers preferred appointment times
- Confirms contact information
- Submits booking to Supabase

## PHQ-9 Integration

The Patient Health Questionnaire-9 is automatically integrated into the intake process:

- All 9 questions are asked during intake
- Scoring: 0-3 per question (Not at all, Several days, More than half the days, Nearly every day)
- Total score: 0-27
- Severity levels:
  - 0-4: Minimal
  - 5-9: Mild
  - 10-14: Moderate
  - 15-19: Moderately Severe
  - 20-27: Severe

PHQ-9 scores are included in the clinical summary.

## Clinical Summary Schema

The structured summary follows DSM/psychiatric interview format:

```typescript
{
  identifyingInfo: { age, gender, preferredPronouns },
  chiefComplaint: string,
  historyOfPresentIllness: { onset, duration, course, triggers, previousEpisodes },
  pastPsychiatricHistory: { diagnoses, treatments, hospitalizations, therapyHistory },
  medicationHistory: { currentMedications, pastMedications, medicationTrials },
  medicalHistory: { conditions, surgeries, allergies },
  substanceUseHistory: { alcohol, tobacco, illicit, caffeine },
  familyHistory: { psychiatricConditions, medicalConditions, suicideAttempts },
  symptoms: [{ symptom, severity, duration, frequency }],
  functionalImpact: { work, relationships, dailyActivities, social },
  safetyConcerns: { suicidalIdeation, plan, intent, selfHarm, homicidalIdeation, hallucinations, delusions, riskLevel, notes },
  preferences: { therapistGender, treatmentApproach, insurance, location, availability, otherNotes },
  phq9: { questions, totalScore, severity, completed }
}
```

## Supabase Schema

Create these tables in your Supabase project:

### clinical_summaries
```sql
CREATE TABLE clinical_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id VARCHAR(255),
  summary_data JSONB NOT NULL,
  phq9_score INTEGER,
  phq9_severity VARCHAR(50),
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

## Usage Flow

1. **Start Chat**: Patient begins conversation with intake agent
2. **Intake Assessment**: Agent asks structured questions including PHQ-9
3. **Complete Intake**: Patient indicates completion (e.g., "I'm done", "finish")
4. **Summary Generation**: Summary agent extracts structured data
5. **View Summary**: Patient can review summary in sidebar (click "Show Summary")
6. **Get Recommendations**: Patient asks for recommendations or agent suggests them
7. **Select Psychiatrist**: Patient selects from recommendation cards
8. **Book Appointment**: Booking agent handles appointment scheduling
9. **Export**: Patient/clinician can export summary or copy for EMR

## Security & Privacy

- **No Chat Storage**: Raw chat transcripts are never stored
- **Structured Data Only**: Only structured summaries are saved
- **Secure Environment Variables**: API keys stored in `.env.local`
- **Security Disclaimers**: Users informed that AI does not provide diagnoses or emergency services
- **No Model Training**: Collected data is not used to train models

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will automatically deploy on push to main branch.

## Customization

### System Prompts

Edit agent prompts in `lib/agents.ts`:
- `INTAKE_AGENT_PROMPT`: Intake conversation style
- `SUMMARY_AGENT_PROMPT`: Summary extraction format
- `RECOMMENDATION_AGENT_PROMPT`: Recommendation logic
- `BOOKING_AGENT_PROMPT`: Booking flow

### Psychiatrist Database

Update `MOCK_PSYCHIATRISTS` in `lib/matching.ts` or integrate with Supabase `psychiatrists` table.

### Summary Schema

Modify the `ClinicalSummary` interface in `lib/store.ts` to adjust the summary structure.

## License

MIT

## Disclaimer

This application is for educational and research purposes. It does not provide medical diagnoses or emergency services. Always consult with licensed healthcare professionals for medical advice.

# PsyConnect Agent - Psychiatric Intake Assessment System

A streamlined AI-powered system for conducting psychiatric intake assessments via a conversational interface. The system consists of two specialized agents working in sequence to gather information and generate clinical summaries.

## Features

### 🤖 Two-Agent Architecture

1. **Intake Agent**: Conducts friendly, conversational Q&A to gather clinical information
   - No summarizing or reflecting patient responses
   - Smart topic detection to avoid repeating questions
   - Memory tracking of discussed topics
   - Follows psychiatric interview structure
   - Asks "Is there anything else you'd like to share before I summarize everything?"
   - Then asks "Would you like to review a clinical summary of what you shared?"

2. **Summary Agent**: Generates concise clinical summaries for human clinicians
   - Covers all psychiatric interview sections
   - Factual, structured, and clinically relevant
   - Professional language
   - Displays in editable form format

### 💬 Modern UI

- ChatGPT-style chat interface
- Fully responsive design
- Streaming responses for better UX
- Important safety notice prominently displayed
- Monotone gray color scheme

## Setup

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

1. Clone the repository:
```bash
cd psychiatry-ai-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
psychiatry-ai-agent/
├── agents/              # Agent logic files
│   ├── intake-agent.ts
│   └── summary-agent.ts
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── intake/
│   │   └── summary/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/          # React components
│   ├── ChatInterface.tsx
│   └── SummaryForm.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── topicDetection.ts
└── package.json
```

## Key Design Principles

### Intake Agent Behavior

- ✅ Asks one question at a time
- ✅ Detects answered topics to avoid repetition
- ✅ Asks clarifying follow-ups for ambiguous responses
- ✅ Maintains warm, conversational tone
- ❌ Never summarizes or reflects patient responses
- ❌ Never repeats questions already answered

### Interview Sections Covered

1. Reason for visit
2. Identifying information
3. Chief complaint
4. History of present illness
5. Past psychiatric history
6. Family history
7. Medical history
8. Substance use
9. Mental status
10. Functioning (social/work)

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI GPT-4
- **Styling**: CSS-in-JS (styled-jsx)

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Important Notes

⚠️ **This is not a diagnostic or emergency service.** If you are in crisis, please contact your local emergency services or the National Suicide Prevention Lifeline at 988.

This system is designed for intake assessment purposes only and should be used in conjunction with professional clinical oversight.

## License

Private project for educational/research purposes.

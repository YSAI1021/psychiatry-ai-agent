# Psychiatry Intake Assistant

A multi-agent AI system for conducting psychiatric intake assessments via conversational interface. Built with Next.js, TailwindCSS, and OpenAI GPT-4.

## Features

### 🤖 Multi-Agent Architecture

1. **Intake Agent**: Collects psychiatric intake data conversationally
   - No reflection or paraphrasing of patient answers
   - Memory tracking to avoid repeating questions
   - One question at a time
   - Asks "Is there anything else you'd like to share before I summarize everything?"

2. **PHQ-9 Questionnaire**: Form-based assessment
   - Appears in side panel after intake
   - 9 questions with 0-3 scoring
   - Automatic score calculation (max 27)

3. **Summary Agent**: Generates clinical summary
   - Structured, editable form format
   - Includes patient information fields
   - Professional clinical language

### 💬 Modern UI

- ChatGPT-style monotone design
- Responsive layout with TailwindCSS
- Split view: chat + forms in side panel
- Streaming responses
- Important safety disclaimer banner

## Setup

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
psychiatry-intake-assistant/
├── agents/
│   ├── intake-agent.ts      # Conversational intake agent
│   └── summary-agent.ts    # Clinical summary generator
├── app/
│   ├── api/
│   │   ├── intake/          # Intake API with streaming
│   │   └── summary/         # Summary generation API
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ChatLayout.tsx       # Main layout with header and sidebar
│   ├── ChatInterface.tsx   # Chat UI component
│   ├── PHQ9Form.tsx        # PHQ-9 questionnaire form
│   └── SummaryForm.tsx    # Editable clinical summary form
├── lib/
│   └── memory.ts           # Memory tracking utilities
└── package.json
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **AI**: OpenAI GPT-4
- **Streaming**: Native OpenAI streaming API

## Key Design Principles

### Intake Agent

- ✅ Asks one question at a time
- ✅ Tracks topics to avoid repetition
- ✅ Asks clarifying follow-ups for vague responses
- ❌ Never reflects or echoes patient responses
- ❌ Never repeats already-answered questions
- ❌ Never uses clinical jargon unless patient initiates

### Interview Topics Covered

1. Reason for visit
2. Identifying information
3. Chief complaint
4. History of present illness
5. Past psychiatric history
6. Family history
7. Medical history
8. Substance use
9. Mental status
10. Social/work functioning

## Important Notes

⚠️ **This is not a diagnostic or emergency service.** If you are in crisis, please contact 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room immediately.

This system is designed for intake assessment purposes only and should be used in conjunction with professional clinical oversight.

## License

Private project for educational/research purposes.

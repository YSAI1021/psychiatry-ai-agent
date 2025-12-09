# Psychiatric Intake Assessment AI Agent

A multi-agent conversational web application for conducting psychiatric intake assessments. Built with Next.js, React, TypeScript, and GPT-4.

## Features

- **Intake Agent**: Structured Q&A conversation for psychiatric intake assessment
- **PHQ-9 Assessment**: Patient Health Questionnaire-9 depression screening tool
- **Summary Agent**: Generates structured clinical summaries from intake data
- **Modern UI**: Dark mode, ChatGPT-like interface with shadcn/ui components
- **Streaming Responses**: Real-time streaming from GPT-4 API
- **No Data Storage**: All data remains in-browser until explicit submission

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **LLM**: GPT-4 (OpenAI API)
- **State Management**: React Context API

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
psychiatry-ai-agent/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat streaming API endpoint
│   │   └── summary/       # Summary generation API endpoint
│   ├── summary/           # Summary review page
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main intake chat page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── ChatBox.tsx        # Chat input component
│   ├── ChatMessage.tsx    # Message display component
│   ├── ImportantBanner.tsx # Important notice banner
│   ├── PHQ9Form.tsx       # PHQ-9 questionnaire component
│   └── SummaryForm.tsx    # Clinical summary form
├── contexts/
│   └── AssessmentContext.tsx # Global state management
├── lib/
│   ├── agents/
│   │   ├── intake-agent.ts      # Intake agent logic
│   │   ├── summary-agent.ts     # Summary agent logic
│   │   └── recommendation-agent.ts # Recommendation agent (future)
│   └── utils.ts           # Utility functions
└── requirements.txt       # Python dependencies (for future Flask backend)
```

## Usage Flow

1. **Intake Conversation**: User engages in structured Q&A with the Intake Agent
2. **PHQ-9 Assessment**: User completes the PHQ-9 depression screening questionnaire
3. **Summary Review**: User reviews and edits the generated clinical summary
4. **Submission**: User submits the assessment (currently shows confirmation only)

## Agent Behaviors

### Intake Agent

- Asks one question at a time
- Tracks discussed topics to avoid repetition
- Uses friendly, professional tone
- Does not summarize user input
- Guides through structured intake sections:
  - Reason for visit
  - Identifying information
  - Chief complaint
  - History of present illness
  - Past psychiatric history
  - Family history
  - Medical history
  - Substance use
  - Mental status
  - Social/occupational functioning

### Summary Agent

- Generates structured clinical summary from conversation
- Includes PHQ-9 score and severity interpretation
- Creates editable form with patient information fields
- Uses factual language, avoids unnecessary clinical jargon

## Important Notes

⚠️ **This is not a diagnostic or emergency service.** If you are in crisis, please contact 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room immediately.

## Security & Privacy

- No data is stored unless explicitly submitted by the user
- All data remains in-browser session until submission
- API keys should be stored securely in `.env.local` (not committed to git)
- Input sanitization is handled before display

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

## Future Enhancements

- Recommendation Agent for treatment suggestions
- Persistent storage backend (Flask API)
- User authentication
- Export functionality (PDF, JSON)
- Multi-language support

## License

This project is for educational/research purposes.

## Contributing

This is a project for Yale SOM LLM Final Project. For questions or issues, please contact the project maintainer.

# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API key

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Start Intake**: The app will automatically greet you and begin the intake assessment
2. **Answer Questions**: Respond to the intake agent's questions one at a time
3. **Complete PHQ-9**: After the intake conversation, complete the PHQ-9 questionnaire
4. **Review Summary**: Review and edit the generated clinical summary
5. **Submit**: Click submit when ready (currently shows confirmation only)

## Troubleshooting

### API Key Issues

If you see "OpenAI API key not configured":
- Ensure `.env.local` exists in the root directory
- Verify the API key is correct (starts with `sk-`)
- Restart the dev server after creating/updating `.env.local`

### Build Errors

If you encounter build errors:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Port Already in Use

If port 3000 is already in use:
```bash
npm run dev -- -p 3001
```

## Project Structure

- `/app` - Next.js pages and API routes
- `/components` - React components (UI and feature components)
- `/contexts` - React Context for state management
- `/lib` - Utility functions and agent logic
- `/components/ui` - shadcn/ui base components

## Next Steps

- Review the full [README.md](./README.md) for detailed documentation
- Customize agent prompts in `/lib/agents/`
- Adjust styling in `app/globals.css` and `tailwind.config.ts`


# Workforce Scheduling System

A small workforce scheduling app that accepts natural-language commands and converts them into scheduling actions.

## Overview

The project has:

- a React frontend with a chat-style interface
- an Express + TypeScript backend
- SQLite for persistence
- an LLM-first command interpretation flow
- a local parser fallback when the LLM is unavailable or invalid

## How It Works

At a high level:

1. the user sends a command
2. the backend interprets the intent
3. the command is validated
4. the scheduling action is executed

The backend can use Gemini for interpretation. If Gemini is not configured or fails, the system falls back to the local parser.

## Main Intents

- `create_schedule`
- `fill_schedule`
- `assign`
- `swap`
- `create_employee`
- `update_employee`

## Stack

- React
- Express
- TypeScript
- SQLite
- Gemini API

## Setup

Install dependencies:

```bash
npm run install:all
```

Run the project:

```bash
npm run dev
```

## Gemini

Gemini is optional.

Without Gemini, the app still works through the parser fallback.

To enable Gemini:

```bash
cp .env.example .env
```

Then set:

```env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash
```

And run:

```bash
npm run dev
```

## URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Example Commands

- `Create schedule Saturday with 2 cooks`
- `Fill schedule Saturday`
- `Assign Maria to Sunday`
- `Swap John with Jane on Saturday`
- `Create employee Lucas as waiter`
- `Update Alice to manager`

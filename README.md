# Workforce Scheduling System

A workforce scheduling app with a chat-based interface for creating, filling, and updating schedules with natural-language commands.

## Overview

The project has:

- a React frontend with a chat-style interface
- an Express + TypeScript backend
- SQLite for persistence
- an LLM-first interpretation flow with structured responses
- short follow-up questions when the LLM needs more information
- a local parser fallback when the LLM is unavailable or invalid

## How It Works

At a high level:

1. the user sends a command
2. the backend interprets the request with Gemini or the local parser fallback
3. when needed, the assistant asks a short follow-up question before acting
4. the command is validated
5. the scheduling action is executed

The main path uses Gemini to return a structured `tool_call`, `question`, or `message`. If Gemini is not configured or fails, the system falls back to the local parser.

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
- `Create schedule Monday`
- `Fill schedule Saturday`
- `Full schedule Monday with cook`
- `Assign Maria to Sunday`
- `Swap John with Jane on Saturday`
- `Create employee Lucas as waiter`
- `Update Alice to manager`

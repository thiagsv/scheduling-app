# Workforce Scheduling System

A technical demonstration of a scheduling application that process natural language commands to manage workforce shifts.

## Technical Overview

The system is built on a Client-Server architecture, utilizing a React-based frontend and a Node.js/Express backend with an integrated SQLite database for persistence.

### Key Components

#### Intent-Based Command Processor
The application now has a simple LLM-ready intent interpretation layer. It keeps a central catalog of supported intents, required fields, examples, and decision rules so a future LLM can be plugged in later without changing the business logic.

The interpretation flow is:
- Send the English user request directly to the LLM.
- If an LLM client is configured, send a small standardized prompt and expect a fixed JSON response shape.
- Validate the returned command before using it.
- If the LLM is unavailable, invalid, or not configured, safely fall back to the existing parser.

This means the current behavior continues to work today, while the project is already prepared for a future LLM provider.

#### Scheduling Engine
The core business logic resides in the `ScheduleEngine` service. Its responsibilities include:
- **Role Validation**: Ensuring that only employees with the correct role (Cook, Waiter, Manager) are assigned to specific shifts.
- **Conflict Management**: Preventing an employee from being assigned to multiple positions on the same day.
- **Automated Fill Logic**: Identifying empty slots and populating them based on available staff and role requirements.

#### Data Persistence
SQLite was selected using the `better-sqlite3` driver to ensure a "zero-configuration" setup for evaluators, while maintaining relational integrity between employees and shifts.

---

## Technical Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)

### Frontend
- **Library**: React (Functional Components & Hooks)
- **Build Tool**: Vite
- **Styling**: Standard CSS (Modular approach)

---

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation Steps

1. **Install dependencies for both projects**:
   ```bash
   npm run install:all
   ```

2. **Initialize and run the development environment**:
   ```bash
   npm run dev
   ```

The application will be accessible at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## Usage Examples

The system accepts commands through the integrated chat interface. Examples include:
- "Create schedule Saturday with 2 cooks"
- "Fill schedule Sunday"
- "Swap employee1 with employee2 on Saturday"
- "Complete schedule Saturday"

## LLM Readiness

No specific LLM vendor is hard-coded yet.

The backend does not require HTTP for the LLM integration. You can plug any future SDK or transport into the centralized interpreter service, as long as it returns the standard JSON shape below:

```json
{
  "command": {
    "intent": "assign",
    "employee": "John",
    "day": "saturday"
  },
  "reason": null
}
```

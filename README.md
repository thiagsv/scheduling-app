# Workforce Scheduling System

A technical demonstration of a scheduling application that process natural language commands to manage workforce shifts.

## Technical Overview

The system is built on a Client-Server architecture, utilizing a React-based frontend and a Node.js/Express backend with an integrated SQLite database for persistence.

### Key Components

#### Intent-Based Command Processor
The application interprets plain English commands through a backend processing layer. It uses regex-based classification to identify user intent (e.g., `CREATE_SCHEDULE`, `FILL_SCHEDULE`, `SWAP_SHIFT`) and extracts relevant parameters such as days and roles.

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

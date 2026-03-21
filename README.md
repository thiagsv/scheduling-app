# Scheduling App

A smart scheduling application that uses natural language to manage team shifts.

## How to Run

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Run the application**:
   ```bash
   npm run dev
   ```
   *The app will be available at [http://localhost:5173](http://localhost:5173)*

## Features

- **Chat-Based Commands**: No buttons! Tell the app to create, fill, or swap shifts using plain English.
- **Smart Scaling**: Automatic filling of gaps based on employee roles and current workload.
- **Conflict Prevention**: Prevents double-booking and ensures role matching.
- **Persistence**: Powered by SQLite for local data storage.

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (better-sqlite3)


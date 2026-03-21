import Database from "better-sqlite3"

export const db = new Database("database.db")

// cria tabelas
db.exec(`
  DROP TABLE IF EXISTS shifts;
  DROP TABLE IF EXISTS employees;

  CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    employee_id INTEGER,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`)
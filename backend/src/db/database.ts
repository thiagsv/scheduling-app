import Database from "better-sqlite3"

export const db = new Database("database.db")

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day TEXT NOT NULL,
        role TEXT NOT NULL,
        employee_id INTEGER,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
`);

const count = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
if (count.count === 0) {
    console.log("Seeding database with initial data (7 employees)...");
    
    const insertEmployee = db.prepare('INSERT INTO employees (name, role) VALUES (?, ?)');
    insertEmployee.run('John', 'cook');
    insertEmployee.run('Jane', 'cook');
    insertEmployee.run('Mike', 'waiter');
    insertEmployee.run('Emily', 'waiter');
    insertEmployee.run('Chris', 'waiter');
    insertEmployee.run('Sarah', 'manager');
    insertEmployee.run('David', 'manager');

    const insertShift = db.prepare('INSERT INTO shifts (day, role, employee_id) VALUES (?, ?, ?)');
    
    // Empty slots for Saturday
    insertShift.run('saturday', 'cook', null);
    insertShift.run('saturday', 'cook', null);
    insertShift.run('saturday', 'waiter', null);
    insertShift.run('saturday', 'waiter', null);
    insertShift.run('saturday', 'manager', null);

    // Some pre-filled slots for Sunday to show diversity
    const johnId = db.prepare('SELECT id FROM employees WHERE name = ?').get('John') as { id: number };
    insertShift.run('sunday', 'cook', johnId.id); // John works Sunday
    insertShift.run('sunday', 'cook', null);
    insertShift.run('sunday', 'waiter', null);
    insertShift.run('sunday', 'waiter', null);
    insertShift.run('sunday', 'manager', null);
}
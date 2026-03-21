import Database from "better-sqlite3"

export const db = new Database("database.db")

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
    console.log("Seeding database with initial data (20 employees)...");

    const insertEmployee = db.prepare('INSERT INTO employees (name, role) VALUES (?, ?)');
    const employees = [
        { name: 'John', role: 'cook' },
        { name: 'Jane', role: 'cook' },
        { name: 'Mike', role: 'cook' },
        { name: 'Emily', role: 'cook' },
        { name: 'Chris', role: 'waiter' },
        { name: 'Sarah', role: 'waiter' },
        { name: 'David', role: 'waiter' },
        { name: 'Anna', role: 'waiter' },
        { name: 'Robert', role: 'waiter' },
        { name: 'Lisa', role: 'waiter' },
        { name: 'Kevin', role: 'manager' },
        { name: 'Sofia', role: 'manager' },
        { name: 'Daniel', role: 'cleaner' },
        { name: 'Maria', role: 'cleaner' },
        { name: 'Paul', role: 'cleaner' },
        { name: 'Laura', role: 'dishwasher' },
        { name: 'James', role: 'dishwasher' },
        { name: 'Emma', role: 'dishwasher' },
        { name: 'Tom', role: 'host' },
        { name: 'Alice', role: 'host' }
    ];

    for (const emp of employees) {
        insertEmployee.run(emp.name, emp.role);
    }

    const insertShift = db.prepare('INSERT INTO shifts (day, role, employee_id) VALUES (?, ?, ?)');
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const roles = ["cook", "waiter", "manager", "cleaner", "dishwasher", "host"];

    for (const day of days) {
        for (const role of roles) {
            insertShift.run(day, role, null);
        }
    }

    // Pre-fill some shifts to show diversity
    const johnId = db.prepare('SELECT id FROM employees WHERE name = ?').get('John') as { id: number };
    const emilyId = db.prepare('SELECT id FROM employees WHERE name = ?').get('Emily') as { id: number };
    const sarahId = db.prepare('SELECT id FROM employees WHERE name = ?').get('Sarah') as { id: number };
    const lauraId = db.prepare('SELECT id FROM employees WHERE name = ?').get('Laura') as { id: number };
    const tomId = db.prepare('SELECT id FROM employees WHERE name = ?').get('Tom') as { id: number };

    // Update some shifts with employees
    db.prepare(`UPDATE shifts SET employee_id = ? WHERE day = 'monday' AND role = 'cook'`).run(johnId.id);
    db.prepare(`UPDATE shifts SET employee_id = ? WHERE day = 'tuesday' AND role = 'cook'`).run(emilyId.id);
    db.prepare(`UPDATE shifts SET employee_id = ? WHERE day = 'wednesday' AND role = 'waiter'`).run(sarahId.id);
    db.prepare(`UPDATE shifts SET employee_id = ? WHERE day = 'thursday' AND role = 'dishwasher'`).run(lauraId.id);
    db.prepare(`UPDATE shifts SET employee_id = ? WHERE day = 'friday' AND role = 'host'`).run(tomId.id);
}
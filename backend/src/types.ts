export type Role = "cook" | "waiter" | "manager" | "cleaner";

export type Employee = {
    id: number;
    name: string;
    role: string;
};

export type Shift = {
    id: number;
    role: string;
    day: string;
};

export type Assignment = {
    employeeId: number;
    shiftId: number;
};

export type Command =
    | { intent: "create_schedule"; day: string; roles: { role: string; count: number }[] }
    | { intent: "fill_schedule"; day?: string; role?: string }
    | { intent: "swap"; from: string; to: string; day?: string }
    | { intent: "assign"; employee: string; day?: string }
    | { intent: "create_employee"; name: string; role: string }
    | { intent: "update_employee"; name: string; newName?: string; newRole?: string };

export type ErrorResponse = {
    type: "error";
    message: string;
};

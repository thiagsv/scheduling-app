export type Day =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

export type Role = "cook" | "waiter" | "manager" | "cleaner" | "dishwasher" | "host";

export type Employee = {
    id: number;
    name: string;
    role: Role;
};

export type EmployeeContext = Pick<Employee, "name" | "role">;

export type Shift = {
    id: number;
    role: Role;
    day: Day;
};

export type Assignment = {
    employeeId: number;
    shiftId: number;
};

export type RoleCount = {
    role: Role;
    count: number;
};

export type Command =
    | { intent: "create_schedule"; day: Day; roles: RoleCount[] }
    | { intent: "fill_schedule"; day?: Day; role?: Role }
    | { intent: "swap"; from: string; to: string; day?: Day }
    | { intent: "assign"; employee: string; day?: Day }
    | { intent: "create_employee"; name: string; role: Role }
    | { intent: "update_employee"; name: string; newName?: string; newRole?: Role };

export type IntentName = Command["intent"];

export type ErrorResponse = {
    type: "error";
    message: string;
};

export type IntentParameterType =
    | "day"
    | "role"
    | "positive_integer"
    | "employee_name"
    | "string"
    | "role_count_list";

export type IntentParameterDefinition = {
    name: string;
    type: IntentParameterType;
    description: string;
    required: boolean;
};

export type IntentDefinition = {
    name: IntentName;
    description: string;
    keywords: string[];
    requiredParameters: IntentParameterDefinition[];
    optionalParameters: IntentParameterDefinition[];
    examples: string[];
    selectionRules: string[];
};

export type CommandInterpretationSource = "llm" | "parser";

export type InterpretedCommand = {
    command: Command;
    source: CommandInterpretationSource;
};

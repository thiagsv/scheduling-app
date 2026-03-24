import { Day, IntentDefinition, Role } from "../types";

export const INTENT_CATALOG_VERSION = "intent-catalog-v1";

export const DAYS: Day[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];

export const ROLES: Role[] = [
    "cook",
    "waiter",
    "manager",
    "cleaner",
    "dishwasher",
    "host",
];

export const DAY_ALIASES: Record<string, Day> = {
    monday: "monday",
    mon: "monday",
    tuesday: "tuesday",
    tue: "tuesday",
    tues: "tuesday",
    wednesday: "wednesday",
    wed: "wednesday",
    thursday: "thursday",
    thu: "thursday",
    thur: "thursday",
    friday: "friday",
    fri: "friday",
    saturday: "saturday",
    sat: "saturday",
    sunday: "sunday",
    sun: "sunday",
};

export const ROLE_ALIASES: Record<string, Role> = {
    cook: "cook",
    cooks: "cook",
    ck: "cook",
    waiter: "waiter",
    waiters: "waiter",
    wtr: "waiter",
    manager: "manager",
    managers: "manager",
    mgr: "manager",
    cleaner: "cleaner",
    cleaners: "cleaner",
    cln: "cleaner",
    dishwasher: "dishwasher",
    dishwashers: "dishwasher",
    dw: "dishwasher",
    host: "host",
    hosts: "host",
    hst: "host",
};

export const INTENT_CATALOG: IntentDefinition[] = [
    {
        name: "create_schedule",
        description: "Creates or rebuilds the schedule slots for a specific day using one or more role/count pairs.",
        keywords: ["create", "build", "generate", "schedule", "shift"],
        requiredParameters: [
            {
                name: "day",
                type: "day",
                description: "Day that should receive the new schedule slots.",
                required: true,
            },
            {
                name: "roles",
                type: "role_count_list",
                description: "List of roles and how many slots each role should have.",
                required: true,
            },
        ],
        optionalParameters: [],
        examples: [
            "Create schedule Saturday with 2 cooks and 1 waiter",
            "Build Saturday schedule with 2 cooks and 1 manager",
        ],
        selectionRules: [
            "Use this intent only when the user is defining schedule capacity or creating empty slots.",
            "If the user mentions a specific employee to place on a day, prefer assign instead of create_schedule.",
        ],
    },
    {
        name: "fill_schedule",
        description: "Automatically fills open schedule slots, optionally filtered by day or role.",
        keywords: ["fill", "complete", "autofill", "populate", "schedule"],
        requiredParameters: [],
        optionalParameters: [
            {
                name: "day",
                type: "day",
                description: "Optional day filter for the automatic fill.",
                required: false,
            },
            {
                name: "role",
                type: "role",
                description: "Optional role filter for the automatic fill.",
                required: false,
            },
        ],
        examples: [
            "Fill schedule Saturday",
            "Complete only the waiter schedule for Sunday",
        ],
        selectionRules: [
            "Use this intent when the user wants the system to auto-assign staff into empty slots.",
            "If the user explicitly names an employee, prefer assign instead of fill_schedule.",
        ],
    },
    {
        name: "swap",
        description: "Moves or replaces one employee with another, optionally scoped to a specific day.",
        keywords: ["swap", "replace", "change", "switch"],
        requiredParameters: [
            {
                name: "from",
                type: "employee_name",
                description: "Employee that will be replaced or moved out of the shift.",
                required: true,
            },
            {
                name: "to",
                type: "employee_name",
                description: "Employee that will take the place of the first employee.",
                required: true,
            },
        ],
        optionalParameters: [
            {
                name: "day",
                type: "day",
                description: "Optional day filter when the replacement should happen on a single day only.",
                required: false,
            },
        ],
        examples: [
            "Swap John with Jane on Saturday",
            "Replace Maria with Anna on sunday",
        ],
        selectionRules: [
            "Use this intent only when two employees are involved in a replacement.",
            "If only one employee is named and the user wants to place them into a shift, prefer assign.",
        ],
    },
    {
        name: "assign",
        description: "Assigns a named employee to a day, or fills matching slots for that employee.",
        keywords: ["assign", "put", "add", "set", "allocate", "place"],
        requiredParameters: [
            {
                name: "employee",
                type: "employee_name",
                description: "Employee that should be assigned.",
                required: true,
            },
        ],
        optionalParameters: [
            {
                name: "day",
                type: "day",
                description: "Optional day for the assignment. Without a day, the system fills matching open slots.",
                required: false,
            },
        ],
        examples: [
            "Assign John to Saturday",
            "Put Sarah on monday",
        ],
        selectionRules: [
            "Use this intent when a specific employee should be placed on the schedule.",
            "Do not use fill_schedule when the user explicitly names the employee to assign.",
        ],
    },
    {
        name: "create_employee",
        description: "Creates a new employee with a role.",
        keywords: ["create", "add", "new", "hire", "employee", "worker"],
        requiredParameters: [
            {
                name: "name",
                type: "string",
                description: "Name of the employee to create.",
                required: true,
            },
            {
                name: "role",
                type: "role",
                description: "Role of the employee to create.",
                required: true,
            },
        ],
        optionalParameters: [],
        examples: [
            "Create employee Bruno as cook",
            "Add a new waiter called Lucas",
        ],
        selectionRules: [
            "Use this intent only when the user is adding a brand new employee.",
        ],
    },
    {
        name: "update_employee",
        description: "Updates an existing employee name, role, or both.",
        keywords: ["update", "edit", "change", "rename", "alter"],
        requiredParameters: [
            {
                name: "name",
                type: "employee_name",
                description: "Current employee name.",
                required: true,
            },
        ],
        optionalParameters: [
            {
                name: "newName",
                type: "string",
                description: "New name for the employee.",
                required: false,
            },
            {
                name: "newRole",
                type: "role",
                description: "New role for the employee.",
                required: false,
            },
        ],
        examples: [
            "Update John to manager",
            "Rename Maria to Mariana",
            "Change Alice to host",
        ],
        selectionRules: [
            "Use this intent only when the employee already exists.",
            "At least one of newName or newRole must be present.",
        ],
    },
];

export const INTENT_LOOKUP = Object.fromEntries(
    INTENT_CATALOG.map((intent) => [intent.name, intent]),
);

import { useState, useEffect } from "react";
import EmployeeDirectory from "./components/EmployeeDirectory";
import Schedule from "./components/Schedule";
import Chat from "./components/Chat";

function formatSourceLabel(source) {
    switch (source) {
        case "llm":
            return "LLM";
        case "parser":
            return "parser fallback";
        default:
            return "unknown source";
    }
}

export default function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [schedule, setSchedule] = useState({});
    const [employees, setEmployees] = useState([]);

    const fetchData = () => {
        fetch("/employees")
            .then((res) => res.json())
            .then((data) => setEmployees(data))
            .catch((err) => console.error("Error fetching employees:", err));

        fetch("/schedule")
            .then((res) => res.json())
            .then((data) => setSchedule(data))
            .catch((err) => console.error("Error fetching schedule:", err));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const suggestions = [
        "Create schedule Saturday with 2 cooks",
        "Create schedule Sunday with 1 manager and 3 waiters",
        "Fill schedule Saturday",
        "Complete schedule Sunday",
        "Assign Maria to Sunday",
        "Swap John with Jane on Saturday",
        "Create employee Lucas as waiter",
        "Update Maria to manager",
    ];

    const handleSend = async () => {
        if (!input) return;

        const userMessage = { text: input, role: "user" };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const res = await fetch("/command", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ command: input }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages((prev) => [
                    ...prev,
                    {
                        text: data.message || "Error processing command.",
                        role: "ai",
                    },
                ]);
                return;
            }

            // Silently refetch data in background as part of standard state invalidation
            fetchData();

            setMessages((prev) => [
                ...prev,
                { 
                    text: `Command interpreted: ${data.intent.replace(/_/g, ' ')} via ${formatSourceLabel(data.source)}`,
                    role: "ai",
                },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { text: "Error connecting to server", role: "ai" },
            ]);
        }

        setInput("");
    };

    return (
        <div className="h-screen w-full flex justify-center items-center bg-[#F7F7F8] text-gray-900 font-sans p-4">
            <div className="w-full max-w-[1500px] flex flex-col md:flex-row h-[85vh] min-h-[640px] max-h-[900px] bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <EmployeeDirectory employees={employees} />
                <Schedule schedule={schedule} />
                <Chat 
                    messages={messages} 
                    input={input} 
                    setInput={setInput} 
                    handleSend={handleSend} 
                    suggestions={suggestions} 
                />
            </div>
        </div>
    );
}

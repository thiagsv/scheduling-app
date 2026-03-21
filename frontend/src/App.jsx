import { useState, useEffect } from "react";
import Schedule from "./components/Schedule";
import Chat from "./components/Chat";

export default function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const [schedule] = useState({
        Saturday: {
            Cook: ["John", "Mary"],
            Waiter: ["Peter", "Ann"],
            Manager: ["Luke"],
        },
        Sunday: {
            Cook: ["Charles"],
            Waiter: ["Fernanda"],
            Manager: [],
        },
    });

    useEffect(() => {
        fetch("/employees")
            .then((res) => res.json())
            .then((data) => console.log("Backend connection successful:", data))
            .catch((err) => console.error("Backend connection error:", err));
    }, []);

    const suggestions = [
        "Create schedule Saturday with 2 cooks",
        "Create schedule Sunday with 1 manager and 3 waiters",
        "Fill schedule Saturday",
        "Complete schedule Sunday",
        "Swap employee1 with employee2 on Saturday",
        "Replace worker in Sunday schedule",
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

            setMessages((prev) => [
                ...prev,
                { 
                    text: `Command interpreted: ${data.intent.replace(/_/g, ' ')}`, 
                    role: "ai",
                    data: data // Store data for future UI updates
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
        <div className="h-screen w-full flex justify-center items-center bg-[#F7F7F8] text-gray-900 font-sans">
            <div className="w-full max-w-[1400px] flex flex-col md:flex-row h-[85vh] min-h-[640px] max-h-[900px]">
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

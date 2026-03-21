import { useState, useEffect } from "react";
import Schedule from "./components/Schedule";
import Chat from "./components/Chat";

export default function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const [schedule] = useState({
        Saturday: {
            Cook: ["João", "Maria"],
            Waiter: ["Pedro", "Ana"],
            Manager: ["Lucas"],
        },
        Sunday: {
            Cook: ["Carlos"],
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
        "Add 2 cooks on Sunday",
        "Assign João to Sunday",
        "Swap Maria with Pedro",
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

            if (!res.ok) {
                setMessages((prev) => [
                    ...prev,
                    {
                        text: "Comando não implementado ainda (ignorando /command por enquanto).",
                        role: "ai",
                    },
                ]);
                return;
            }

            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                { text: data.message || "Done", role: "ai" },
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

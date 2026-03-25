import { useRef, useEffect } from "react";
import Message from "./Message";
import Suggestions from "./Suggestions";

export default function Chat({
    messages,
    input,
    setInput,
    handleSend,
    suggestions,
    isClarifying,
}) {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="w-full md:w-[320px] lg:w-[380px] shrink-0 border-t md:border-t-0 md:border-l border-gray-100 bg-white flex flex-col h-full overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
                <span className="font-medium text-base md:text-lg">
                    Command Center
                </span>
                <span className="text-xs md:text-sm text-gray-400">AI</span>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-3 md:space-y-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                {messages.map((msg, i) => (
                    <Message key={i} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* suggestions */}
            <Suggestions suggestions={suggestions} onSelect={setInput} />

            <div className="p-5 md:p-6 border-t border-gray-100">
                {isClarifying && (
                    <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        The assistant is waiting for one more detail before executing the command.
                    </div>
                )}
                <div className="flex items-center gap-2 md:gap-3 bg-gray-100 rounded-full px-3 md:px-4 py-2.5 md:py-3 focus-within:ring-2 focus-within:ring-gray-300 transition">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isClarifying ? "Answer the follow-up..." : "Type a command..."}
                        className="flex-1 bg-transparent text-sm md:text-base focus:outline-none text-gray-900 placeholder-gray-400"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSend();
                            }
                        }}
                    />
                    <button
                        onClick={handleSend}
                        className="bg-black text-white px-4 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm hover:opacity-90 active:scale-95 transition"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";

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

  const suggestions = [
    "Add 2 cooks on Sunday",
    "Assign João to Sunday",
    "Swap Maria with Pedro",
  ];

  const handleSend = () => {
    if (!input) return;

    setMessages([...messages, { text: input, role: "user" }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "Schedule updated.", role: "ai" },
      ]);
    }, 600);

    setInput("");
  };

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#F7F7F8] text-gray-900 font-sans">
      <div className="w-full max-w-[1400px] flex flex-col md:flex-row">
        {/* LEFT - SCHEDULE */}
        <div className="w-full md:w-2/3 p-6 md:p-10 overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex items-center justify-between mb-8 md:mb-10 sticky top-0 bg-[#F7F7F8] z-10 pb-2">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Workforce Schedule
            </h1>
            <div className="text-sm md:text-base text-gray-400">
              Live view
            </div>
          </div>

          {Object.entries(schedule).map(([day, roles]) => (
            <div key={day} className="mb-10 md:mb-12">
              <h2 className="text-sm md:text-base uppercase tracking-wider text-gray-400 mb-4 md:mb-5">
                {day}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Object.entries(roles).map(([role, people]) => (
                  <div
                    key={role}
                    className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-3 md:mb-4">
                      <span className="text-sm md:text-base font-medium">
                        {role}
                      </span>
                      <span className="text-xs md:text-sm text-gray-400">
                        {people.length}
                      </span>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      {people.map((person, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 md:gap-3 text-sm md:text-base"
                        >
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs md:text-sm font-medium">
                            {person[0]}
                          </div>
                          {person}
                        </div>
                      ))}

                      {people.length === 0 && (
                        <div className="text-xs md:text-sm text-gray-400">
                          No one assigned
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT - CHAT */}
        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-100 bg-white flex flex-col">
          <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
            <span className="font-medium text-base md:text-lg">
              Command Center
            </span>
            <span className="text-xs md:text-sm text-gray-400">AI</span>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-3 md:space-y-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-4 md:px-5 py-2.5 md:py-3 rounded-2xl text-sm md:text-base transition-all duration-200 ${msg.role === "user"
                    ? "bg-black text-white ml-auto hover:opacity-90"
                    : "bg-gray-100 text-gray-700"
                  }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* suggestions */}
          <div className="px-5 md:px-6 pb-3 md:pb-4">
            <div className="relative">

              {/* fade right */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-5 bg-gradient-to-l from-white to-transparent" />

              <div className="grid grid-flow-col auto-cols-max grid-rows-2 gap-2 md:gap-3 overflow-x-auto max-h-[88px] pl-0 pr-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="whitespace-nowrap text-xs md:text-sm bg-gray-100 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-gray-700 hover:bg-gray-200 active:scale-95 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* input */}
          <div className="p-5 md:p-6 border-t border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 bg-gray-100 rounded-full px-3 md:px-4 py-2.5 md:py-3 focus-within:ring-2 focus-within:ring-gray-300 transition">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a command..."
                className="flex-1 bg-transparent text-sm md:text-base focus:outline-none text-gray-900 placeholder-gray-400"
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
      </div>
    </div>
  );
}

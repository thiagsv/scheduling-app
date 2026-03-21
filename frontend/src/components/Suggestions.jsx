export default function Suggestions({ suggestions, onSelect }) {
    return (
        <div className="px-5 md:px-6 pb-3 md:pb-4">
            <div className="relative">
                {/* fade right */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-5 bg-gradient-to-l from-white to-transparent" />

                <div className="grid grid-flow-col auto-cols-max grid-rows-2 gap-2 md:gap-3 overflow-x-auto max-h-[88px] pl-0 pr-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(s)}
                            className="whitespace-nowrap text-xs md:text-sm bg-gray-100 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-gray-700 hover:bg-gray-200 active:scale-95 transition"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

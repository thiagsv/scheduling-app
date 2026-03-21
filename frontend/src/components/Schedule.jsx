export default function Schedule({ schedule }) {
    return (
        <div className="w-full md:flex-1 bg-white overflow-y-auto overscroll-contain h-full [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="flex items-center justify-between sticky top-0 bg-white z-10 px-6 md:px-10 py-6 md:py-8 border-b border-gray-100 shadow-sm">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    Workforce Schedule
                </h1>
                <div className="text-sm md:text-base text-gray-400">
                    Live view
                </div>
            </div>

            <div className="p-6 md:p-10 pt-4 md:pt-6">
                {Object.entries(schedule).map(([day, roles]) => (
                <div key={day} className="mb-10 md:mb-12">
                    <h2 className="text-sm md:text-base uppercase tracking-wider text-gray-400 mb-4 md:mb-5">
                        {day}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {Object.entries(roles).map(([role, people]) => (
                            <div
                                key={role}
                                className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 min-h-[140px] max-h-[180px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                                    {people.map((person, i) => {
                                        const isEmpty = person === "Empty Slot";
                                        return (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-2 md:gap-3 text-sm md:text-base ${isEmpty ? 'text-gray-400 opacity-80' : ''}`}
                                        >
                                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium ${isEmpty ? 'bg-transparent border border-gray-300 border-dashed' : 'bg-gray-200'}`}>
                                                {isEmpty ? "?" : person[0]}
                                            </div>
                                            {person}
                                        </div>
                                        );
                                    })}

                                    {people.length === 0 && (
                                        <div className="text-xs md:text-sm text-gray-400">
                                            No schedule rules set
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}

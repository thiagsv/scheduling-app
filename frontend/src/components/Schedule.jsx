export default function Schedule({ schedule }) {
    return (
        <div className="w-full md:w-2/3 p-6 md:p-10 overflow-y-auto overscroll-contain h-full [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                                className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 min-h-[140px] max-h-[180px] overflow-hidden"
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
    );
}

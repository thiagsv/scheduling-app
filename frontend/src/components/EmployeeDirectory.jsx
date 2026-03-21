export default function EmployeeDirectory({ employees }) {
    if (!employees || employees.length === 0) return null;

    return (
        <div className="w-full md:w-[260px] lg:w-[280px] shrink-0 border-r border-gray-100 bg-white flex flex-col h-full overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100">
                <h2 className="font-medium text-base md:text-lg">Team Directory</h2>
                <p className="text-xs text-gray-400 mt-1">Available Staff</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                {employees.map(emp => (
                    <div 
                        key={emp.id} 
                        className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex justify-between items-center hover:bg-gray-100 transition"
                    >
                        <span className="text-sm font-medium text-gray-800">{emp.name}</span>
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-wide">
                            {emp.role}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Message({ msg }) {
    return (
        <div
            className={`max-w-[80%] px-4 md:px-5 py-2.5 md:py-3 rounded-2xl text-sm md:text-base transition-all duration-200 ${
                msg.role === "user"
                    ? "bg-black text-white ml-auto hover:opacity-90"
                    : "bg-gray-100 text-gray-700"
            }`}
        >
            {msg.text}
        </div>
    );
}

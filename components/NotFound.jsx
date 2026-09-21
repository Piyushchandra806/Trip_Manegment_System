/**
 * NotFound - Empty state displayed when no passenger is found.
 *
 * Props:
 *  - onReset: callback to reset search and try again
 */
export default function NotFound({ onReset }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
      <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-slate-800">
        Passenger Not Found
      </h3>
      <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
        We couldn&apos;t find a passenger with this mobile number. Please check
        your number or contact the trip administrator.
      </p>

      {onReset && (
        <button
          onClick={onReset}
          className="mt-6 px-6 py-3 bg-slate-900 text-white text-sm font-semibold
                     rounded-xl hover:bg-slate-800 active:bg-slate-950
                     transition-colors duration-200"
        >
          Try Another Number
        </button>
      )}
    </div>
  );
}

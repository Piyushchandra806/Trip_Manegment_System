export function maskMobile(mobile) {
  if (!mobile || mobile.length < 4) return mobile;
  const visible = mobile.slice(-4);
  const masked = "X".repeat(mobile.length - 4);
  return masked + visible;
}

/**
 * PassengerCard - Displays passenger name and masked mobile.
 *
 * Props:
 *  - passenger: { name, mobile }
 */
export default function PassengerCard({ passenger }) {
  if (!passenger) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="text-lg">👤</span>
        MY DETAILS
      </h3>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold">
            {passenger.name.charAt(0)}
          </span>
        </div>

        <div className="min-w-0">
          <h4 className="text-xl font-bold text-slate-800 truncate">
            {passenger.name}
          </h4>
          <p className="text-base text-slate-500 mt-1 font-mono">
            Mobile: {maskMobile(passenger.mobile)}
          </p>
        </div>
      </div>
    </div>
  );
}

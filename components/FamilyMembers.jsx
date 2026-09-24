/**
 * FamilyMembers - Displays family members and their seat arrangements.
 *
 * Props:
 *  - members: Array of { name, mobile, familyName, train: { coach, berth, berthType } }
 *  - currentPassengerName: string - the searched passenger's mobile
 */
export default function FamilyMembers({ members, currentPassengerName }) {
  const formatCoach = (coach) => {
    if (!coach) return "-";
    const types = ["Sleeper", "3-AC", "3AC"];
    for (const t of types) {
      if (coach.toLowerCase().startsWith(t.toLowerCase())) {
        const rest = coach.substring(t.length).trim();
        return (<>{rest} <span className="text-sm font-bold opacity-80">({t})</span></>);
      }
    }
    return coach;
  };

  if (!members || members.length === 0) return null;

  // Determine if all members have the same coach
  const coaches = members.map(m => m.train?.coach).filter(Boolean);
  const uniqueCoaches = new Set(coaches);
  const isSameCoach = coaches.length > 0 && uniqueCoaches.size === 1;
  const isDifferentCoaches = uniqueCoaches.size > 1;

  return (
    <div className="space-y-6">
      {/* Family Members List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-lg">👨‍👩‍👧</span>
          MY FAMILY
        </h3>

        <ul className="space-y-3">
          {members.map((member, index) => {
            const isCurrent = member.mobile === currentPassengerName || member.name === currentPassengerName;
            return (
              <li
                key={member.passengerId || index}
                className={`flex items-center gap-2 text-base font-medium ${
                  isCurrent ? "text-slate-900" : "text-slate-600 pl-6"
                }`}
              >
                {isCurrent && (
                  <span className="text-green-600 font-bold w-4">✓</span>
                )}
                {member.name}
              </li>
            );
          })}
        </ul>
      </div>
      {/* Seat Arrangement */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-lg">👨‍👩‍👧</span>
          FAMILY SEAT ARRANGEMENT
        </h3>

        {/* Coach Indicator */}
        {isSameCoach && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3 text-green-800 text-sm font-medium">
            <span className="text-green-600">✓</span>
            Your family is travelling in the same coach.
          </div>
        )}
        
        {isDifferentCoaches && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800 text-sm font-medium">
            <span className="text-amber-600">ℹ</span>
            Your family members are travelling in different coaches.
          </div>
        )}

        <div className="space-y-4">
          {members.map((member, index) => (
            <div
              key={member.passengerId || index}
              className={`border rounded-xl p-4 transition-colors ${
                member.mobile === currentPassengerName
                  ? "border-blue-200 bg-blue-50/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="font-bold text-slate-800 mb-2">{member.name}</p>
              
              {!member.train ? (
                <p className="text-sm text-slate-500 italic">Seat not assigned yet.</p>
              ) : (
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-slate-500">Coach:</span>
                    <span className="font-bold text-slate-900">{formatCoach(member.train.coach)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">Berth:</span>
                    <span className="font-bold text-slate-900">
                      {member.train.berth || "-"} - {member.train.berthType || "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

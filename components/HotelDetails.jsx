/**
 * Helper to get the ordinal suffix for a number (e.g., 1 -> 1st, 2 -> 2nd).
 */
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format floor string, extracting number if possible to append ordinal.
 */
function formatFloor(floorStr) {
  if (!floorStr) return "-";
  const num = parseInt(floorStr, 10);
  if (!isNaN(num)) {
    return `${getOrdinal(num)} Floor`;
  }
  return floorStr; // fallback if it's already a string like "Ground"
}

/**
 * HotelDetails - Displays the passenger's hotel stays and family room arrangements.
 *
 * Props:
 *  - hotels: Array of { day, date, hotelName, floor, room }
 *  - familyMembers: Array of family members, each with their own `hotels` array
 */
export default function HotelDetails({ hotels, familyMembers = [] }) {
  if (!hotels || hotels.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="text-lg">🏨</span>
          MY HOTEL STAY
        </h3>
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-slate-700 font-medium mb-1">Hotel information is not available yet.</p>
          <p className="text-slate-500 text-sm">Please contact the trip administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <span className="text-lg">🏨</span>
        MY HOTEL STAY
      </h3>

      <div className="space-y-8">
        {hotels.map((hotelStay) => {
          // Find family members staying on this specific day
          const familyInRooms = familyMembers
            .map((member) => {
              const memberStay = member.hotels?.find((h) => h.day === hotelStay.day);
              return {
                name: member.name,
                room: memberStay?.room || "Not assigned",
              };
            })
            .filter((m) => m.name); // ensure valid name

          // Check if all family members are in the exact same room
          const uniqueRooms = new Set(familyInRooms.map(m => m.room));
          const isEveryoneTogether = uniqueRooms.size === 1 && familyInRooms.length > 1;

          return (
            <div key={hotelStay.day} className="relative">
              {/* Timeline dot for multiple stays, optional visual enhancement */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                
                {/* Hotel Header */}
                <div className="border-b border-slate-200 pb-4 mb-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded-md uppercase tracking-wider">
                      Day {hotelStay.day}
                    </span>
                    {hotelStay.date && (
                      <span className="text-sm text-slate-500 font-normal ml-2">{hotelStay.date}</span>
                    )}
                  </h4>
                  <p className="text-xl font-black text-blue-900 mt-2">{hotelStay.hotelName}</p>
                </div>

                {/* Floor and Room Block */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Floor</p>
                    <p className="text-lg font-bold text-slate-800">{formatFloor(hotelStay.floor)}</p>
                  </div>
                  <div className="bg-blue-600 rounded-xl p-3 text-center shadow-sm">
                    <p className="text-xs text-blue-200 uppercase tracking-wide font-bold mb-1">Room</p>
                    <p className="text-3xl font-black text-white tracking-wider">{hotelStay.room || "-"}</p>
                  </div>
                </div>

                {/* Family Room Arrangements */}
                {familyInRooms.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="text-base">👨‍👩‍👧</span>
                      {isEveryoneTogether ? "Staying Together" : "Family Hotel Rooms"}
                    </h5>
                    
                    {isEveryoneTogether ? (
                      <ul className="space-y-1">
                        {familyInRooms.map((m, idx) => (
                          <li key={idx} className="text-sm font-bold text-slate-700">{m.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-2">
                        {familyInRooms.map((m, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                            <span className="font-bold text-slate-700">{m.name}</span>
                            <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                              Room {m.room}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

              </div>
              
              {/* Timeline Connector line (only visible if not the last item, handled by spacing) */}
            </div>
          );
        })}
      </div>
    </div>
  );
}

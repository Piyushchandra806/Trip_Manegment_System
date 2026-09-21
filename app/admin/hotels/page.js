'use client';
import { useState, useEffect } from 'react';
import { exportToCSV } from '@/lib/exportUtils';
import { Printer, Download } from 'lucide-react';

export default function HotelsOverview() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewRoomsFor, setViewRoomsFor] = useState(null);

  useEffect(() => {
    fetch('/api/admin/hotel-stats')
      .then(res => res.json())
      .then(data => {
        setHotels(data);
        setLoading(false);
      });
  }, []);

  const handleExport = () => {
    if (viewRoomsFor) {
      const exportData = [];
      viewRoomsFor.rooms.forEach(r => {
        r.passengers.forEach(p => {
          exportData.push({
            Hotel: viewRoomsFor.name,
            Room: r.room,
            Floor: r.floor,
            Name: p.name,
            Mobile: p.mobile,
            Family: p.familyName
          });
        });
      });
      exportToCSV(`Hotel_${viewRoomsFor.name}_Rooms.csv`, exportData);
    } else {
      const exportData = [];
      hotels.forEach(h => {
        h.rooms.forEach(r => {
          r.passengers.forEach(p => {
            exportData.push({
              Hotel: h.name,
              Room: r.room,
              Floor: r.floor,
              Name: p.name,
              Mobile: p.mobile,
              Family: p.familyName
            });
          });
        });
      });
      exportToCSV('Hotels_List.csv', exportData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-10">Loading hotel data...</div>;

  return (
    <div className="max-w-5xl mx-auto print:bg-white print:p-0">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>🏨</span> {viewRoomsFor ? viewRoomsFor.name : 'Hotels'}
        </h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold border-b pb-2">
           {viewRoomsFor ? `HOTEL: ${viewRoomsFor.name}` : 'ALL HOTELS'}
        </h1>
      </div>

      {!viewRoomsFor ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
            {hotels.map(h => (
              <div key={h.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{h.name}</h3>
                  <div className="text-slate-500 font-medium">{h.assignedRooms} Rooms Assigned</div>
                </div>
                <button 
                  onClick={() => setViewRoomsFor(h)}
                  className="w-full bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  View Rooms
                </button>
              </div>
            ))}
          </div>

          <div className="hidden print:block space-y-8">
            {hotels.map(h => (
              <div key={h.name} className="break-inside-avoid">
                <h2 className="font-bold text-lg mb-2">{h.name} ({h.assignedRooms} Rooms)</h2>
                <div className="overflow-x-auto">
<table className="w-full text-left text-sm border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 w-20">Room</th>
                      <th className="p-2 border-r border-slate-200">Passenger</th>
                      <th className="p-2">Family</th>
                    </tr>
                  </thead>
                  <tbody>
                    {h.rooms.map(r => (
                      r.passengers.map((p, idx) => (
                        <tr key={p.mobile} className="border-b border-slate-200">
                          {idx === 0 && <td rowSpan={r.passengers.length} className="p-2 border-r border-slate-200 font-bold bg-slate-50 align-top">{r.room}</td>}
                          <td className="p-2 border-r border-slate-200">{p.name}</td>
                          <td className="p-2">{p.familyName}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>
          <button 
            onClick={() => setViewRoomsFor(null)}
            className="mb-6 text-slate-500 hover:text-slate-800 font-medium transition-colors print:hidden"
          >
            ← Back to all hotels
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:hidden">
            {viewRoomsFor.rooms.map((r, i) => (
              <div key={i} className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm">
                <div className="font-bold text-slate-800 text-lg border-b pb-2 mb-2">Room {r.room}</div>
                <div className="text-sm text-slate-500 mb-4">Floor {r.floor}</div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Occupants:</p>
                  {r.passengers.map(p => (
                    <div key={p.mobile} className="flex flex-col text-sm bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-semibold text-slate-700">{p.name}</span>
                      <span className="text-xs text-slate-500">{p.familyName}</span>
                    </div>
                  ))}
                  {r.passengers.length === 0 && <p className="text-slate-400 text-sm italic">Empty</p>}
                </div>
              </div>
            ))}
          </div>
          
          {viewRoomsFor.rooms.length === 0 && (
            <p className="text-slate-500 text-center py-6 print:hidden">No rooms assigned yet.</p>
          )}

          {/* Print specific layout for this hotel */}
          <div className="hidden print:block">
            <div className="overflow-x-auto">
<table className="w-full text-left text-sm border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200 w-20">Room</th>
                  <th className="p-2 border-r border-slate-200">Floor</th>
                  <th className="p-2 border-r border-slate-200">Passenger</th>
                  <th className="p-2">Family</th>
                </tr>
              </thead>
              <tbody>
                {viewRoomsFor.rooms.map(r => (
                  r.passengers.map((p, idx) => (
                    <tr key={p.mobile} className="border-b border-slate-200">
                      {idx === 0 && <td rowSpan={r.passengers.length} className="p-2 border-r border-slate-200 font-bold bg-slate-50 align-top">{r.room}</td>}
                      {idx === 0 && <td rowSpan={r.passengers.length} className="p-2 border-r border-slate-200 align-top">{r.floor}</td>}
                      <td className="p-2 border-r border-slate-200">{p.name}</td>
                      <td className="p-2">{p.familyName}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .max-w-5xl, .max-w-5xl * { visibility: visible; }
          .max-w-5xl { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
}

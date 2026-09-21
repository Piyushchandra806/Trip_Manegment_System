'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Train, Hotel, Users } from 'lucide-react';

export default function ProblemsPage() {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [fixModal, setFixModal] = useState(null); // { passenger, type: 'train' | 'hotel' }
  const [fixData, setFixData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await fetch('/api/admin/passengers').then(r => r.json());
    // data is already a flat list of passengers
    setPassengers(data);
    setLoading(false);
  };

  const handleFixSubmit = async () => {
    if (!fixModal) return;
    
    const payload = {
      mobile: fixModal.passenger.mobile,
      fixType: fixModal.type,
      ...fixData
    };

    const res = await fetch('/api/admin/passengers/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setFixModal(null);
      setFixData({});
      fetchData(); // Refresh list to remove fixed item
    } else {
      alert("Failed to apply fix.");
    }
  };

  const missingTrain = passengers.filter(p => !p.train);
  const missingHotel = passengers.filter(p => !p.hotels || p.hotels.length === 0);
  const missingFamily = passengers.filter(p => !p.familyId || p.familyId === 'F000000');

  // Basic duplicate mobile detection
  const mobileCounts = {};
  passengers.forEach(p => {
    mobileCounts[p.mobile] = (mobileCounts[p.mobile] || 0) + 1;
  });
  const duplicates = Object.keys(mobileCounts).filter(m => mobileCounts[m] > 1);

  if (loading) return <div className="text-center py-10">Loading issues...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
        <AlertTriangle className="text-amber-500" /> NEEDS ATTENTION
      </h1>

      <div className="space-y-8">
        
        {/* Missing Train */}
        {missingTrain.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
              <h2 className="font-bold text-amber-800 flex items-center gap-2">
                <Train className="w-5 h-5" /> {missingTrain.length} passengers have no train seat
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {missingTrain.map(p => (
                <div key={p.mobile} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.mobile}</p>
                  </div>
                  <button 
                    onClick={() => setFixModal({ passenger: p, type: 'train' })}
                    className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-slate-700"
                  >
                    Fix
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Hotel */}
        {missingHotel.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
              <h2 className="font-bold text-amber-800 flex items-center gap-2">
                <Hotel className="w-5 h-5" /> {missingHotel.length} passengers have no hotel room
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {missingHotel.map(p => (
                <div key={p.mobile} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.mobile}</p>
                  </div>
                  <button 
                    onClick={() => setFixModal({ passenger: p, type: 'hotel' })}
                    className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-slate-700"
                  >
                    Fix
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Family */}
        {missingFamily.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
              <h2 className="font-bold text-amber-800 flex items-center gap-2">
                <Users className="w-5 h-5" /> {missingFamily.length} passengers have no family information
              </h2>
            </div>
            <div className="p-4 text-slate-600 text-sm">
              * Please go to the Passengers view to assign families using the Edit page.
            </div>
          </div>
        )}
        
        {/* Duplicates */}
        {duplicates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
              <h2 className="font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> {duplicates.length} duplicate mobile numbers found
              </h2>
            </div>
            <div className="p-4 text-slate-600 text-sm">
              * Duplicates detected for: {duplicates.join(', ')}. Please manually correct them in the passenger list.
            </div>
          </div>
        )}

        {missingTrain.length === 0 && missingHotel.length === 0 && missingFamily.length === 0 && duplicates.length === 0 && (
          <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Everything looks perfect!</h2>
            <p className="text-slate-500">All data is complete and accurate.</p>
          </div>
        )}
      </div>

      {/* Quick Fix Modal */}
      {fixModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg text-slate-800 mb-4">
              Fix {fixModal.type === 'train' ? 'Train' : 'Hotel'}
            </h3>
            
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Passenger</p>
              <p className="font-medium text-slate-800">{fixModal.passenger.name}</p>
            </div>

            {fixModal.type === 'train' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Coach</label>
                  <input type="text" placeholder="e.g. S4" className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={fixData.coach || ''} onChange={e => setFixData({...fixData, coach: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Berth</label>
                  <input type="text" placeholder="e.g. 21" className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={fixData.berth || ''} onChange={e => setFixData({...fixData, berth: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Type</label>
                  <select className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={fixData.berthType || 'Unknown'} onChange={e => setFixData({...fixData, berthType: e.target.value})}>
                    <option value="Unknown">Unknown</option>
                    <option value="Lower">Lower</option>
                    <option value="Middle">Middle</option>
                    <option value="Upper">Upper</option>
                    <option value="Side Lower">Side Lower</option>
                    <option value="Side Upper">Side Upper</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Hotel</label>
                  <input type="text" placeholder="e.g. Hotel ABC" className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={fixData.hotel || ''} onChange={e => setFixData({...fixData, hotel: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Floor</label>
                  <input type="text" placeholder="e.g. 3" className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={fixData.floor || ''} onChange={e => setFixData({...fixData, floor: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Room</label>
                  <input type="text" placeholder="e.g. 305" className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={fixData.room || ''} onChange={e => setFixData({...fixData, room: e.target.value})} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => {setFixModal(null); setFixData({});}} className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100">Cancel</button>
              <button 
                onClick={handleFixSubmit} 
                disabled={fixModal.type === 'train' ? (!fixData.coach || !fixData.berth) : (!fixData.hotel || !fixData.room)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

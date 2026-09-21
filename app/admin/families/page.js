'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { exportToCSV } from '@/lib/exportUtils';
import { Printer, Download } from 'lucide-react';

export default function FamiliesList() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState(null);
  
  const [moveModal, setMoveModal] = useState(null);

  useEffect(() => {
    fetch('/api/admin/families')
      .then(res => res.json())
      .then(data => {
        setFamilies(data);
        setLoading(false);
      });
  }, []);

  const handleMoveConfirm = async () => {
    if (!moveModal) return;
    const res = await fetch('/api/admin/families/change', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ 
        mobile: moveModal.passenger.mobile, 
        newFamilyId: moveModal.newFamilyId 
      })
    });
    if (res.ok) {
      const data = await fetch('/api/admin/families').then(r => r.json());
      setFamilies(data);
      setMoveModal(null);
      if (selectedFamily) {
        const updatedFam = data.find(f => f.familyId === selectedFamily.familyId);
        if (updatedFam) {
          setSelectedFamily(updatedFam);
        } else {
          setSelectedFamily(null); // family might be empty now
        }
      }
    } else {
      alert("Failed to move passenger.");
    }
  };

  const handleExport = () => {
    const exportData = [];
    families.forEach(f => {
      f.members.forEach(m => {
        exportData.push({
          'Family Name': f.familyName,
          'Passenger Name': m.name,
          'Mobile': m.mobile,
          'Coach': m.train?.coach || '',
          'Berth': m.train?.berth || '',
          'Hotel': m.hotels?.[0]?.hotelName || '',
          'Room': m.hotels?.[0]?.roomNumber || ''
        });
      });
    });
    exportToCSV('Families_List.csv', exportData);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-10">Loading families...</div>;

  return (
    <div className="max-w-5xl mx-auto print:bg-white print:p-0">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-800">Families</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Print View Only (Hidden on screen) */}
      <div className="hidden print:block space-y-8">
        <h1 className="text-2xl font-bold mb-4">All Families</h1>
        {families.map(f => (
          <div key={f.familyId} className="mb-6">
            <h2 className="text-xl font-bold border-b pb-2 mb-4">{f.familyName} ({f.members.length} Members)</h2>
            <div className="overflow-x-auto">
<table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Mobile</th>
                  <th className="py-2">Train</th>
                  <th className="py-2">Hotel</th>
                </tr>
              </thead>
              <tbody>
                {f.members.map(m => (
                  <tr key={m.mobile} className="border-b border-slate-100">
                    <td className="py-2">{m.name}</td>
                    <td className="py-2">{m.mobile}</td>
                    <td className="py-2">{m.train ? `${m.train.coach}-${m.train.berth}` : '-'}</td>
                    <td className="py-2">{m.hotels?.[0] ? `${m.hotels[0].hotelName} (Room ${m.hotels[0].roomNumber})` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        ))}
      </div>

      {!selectedFamily ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
          {families.map(f => (
            <div key={f.familyId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg text-slate-800 mb-1">{f.familyName}</h3>
              <p className="text-slate-500 text-sm mb-4">{f.members.length} Members</p>
              <button 
                onClick={() => setSelectedFamily(f)}
                className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
              >
                View Family
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="print:hidden">
          <button 
            onClick={() => setSelectedFamily(null)}
            className="mb-6 text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            ← Back to all families
          </button>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 uppercase">{selectedFamily.familyName}</h2>
            <p className="text-slate-500 mb-6">{selectedFamily.members.length} Members</p>
            
            <div className="space-y-4">
              {selectedFamily.members.map(m => (
                <div key={m.mobile} className="p-4 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 hover:bg-white transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-800">{m.name}</h4>
                    <p className="text-sm text-slate-500">{m.mobile}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.train && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-semibold border border-blue-100">🚆 {m.train.coach} / {m.train.berth}</span>}
                      {m.hotels && m.hotels.length > 0 && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-semibold border border-green-100">🏨 {m.hotels[0].hotelName} / Room {m.hotels[0].roomNumber}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <Link href={`/admin/passengers/${m.passengerId}`} className="text-sm text-center bg-slate-800 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-slate-700">
                      Edit
                    </Link>
                    <select 
                      className="text-sm border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        if(e.target.value) {
                          const targetFam = families.find(fam => fam.familyId === e.target.value);
                          setMoveModal({ passenger: m, newFamilyId: targetFam.familyId, newFamilyName: targetFam.familyName });
                        }
                        e.target.value = "";
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Move to...</option>
                      {families.filter(fam => fam.familyId !== selectedFamily.familyId).map(fam => (
                        <option key={fam.familyId} value={fam.familyId}>{fam.familyName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {moveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Change Family?</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Are you sure you want to move <strong>{moveModal.passenger.name}</strong> to <strong>{moveModal.newFamilyName}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMoveModal(null)} className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100">Cancel</button>
              <button onClick={handleMoveConfirm} className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700">Confirm</button>
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

'use client';
import { useState, useEffect, useMemo } from 'react';
import { exportToCSV } from '@/lib/exportUtils';
import { Printer, Download, Search } from 'lucide-react';

export default function TrainOverview() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewCoach, setViewCoach] = useState(null);
  
  const [searchCoach, setSearchCoach] = useState('');

  useEffect(() => {
    fetch('/api/admin/train-stats')
      .then(res => res.json())
      .then(data => {
        setCoaches(data);
        setLoading(false);
      });
  }, []);

  const filteredCoaches = useMemo(() => {
    if (!searchCoach) return coaches;
    return coaches.filter(c => c.coach.toLowerCase().includes(searchCoach.toLowerCase()));
  }, [coaches, searchCoach]);

  const handleExport = () => {
    if (viewCoach) {
      const exportData = viewCoach.passengers.map(p => ({
        Coach: viewCoach.coach,
        Berth: p.berth,
        Name: p.name,
        Mobile: p.mobile
      }));
      exportToCSV(`Coach_${viewCoach.coach}_List.csv`, exportData);
    } else {
      const exportData = [];
      coaches.forEach(c => {
        c.passengers.forEach(p => {
          exportData.push({
            Coach: c.coach,
            Berth: p.berth,
            Name: p.name,
            Mobile: p.mobile
          });
        });
      });
      exportToCSV('Train_List.csv', exportData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-10">Loading train data...</div>;

  return (
    <div className="max-w-5xl mx-auto print:bg-white print:p-0">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>🚆</span> {viewCoach ? `COACH ${viewCoach.coach}` : 'TRAIN'}
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

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold border-b pb-2">
           {viewCoach ? `TRAIN: DEMO EXPRESS | COACH: ${viewCoach.coach}` : 'ALL COACHES'}
        </h1>
      </div>

      {!viewCoach ? (
        <>
          <div className="relative mb-6 print:hidden">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search coach (e.g. S4)..." 
              className="w-full max-w-sm pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchCoach}
              onChange={e => setSearchCoach(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 print:hidden">
            {filteredCoaches.map(c => (
              <div 
                key={c.coach} 
                onClick={() => setViewCoach(c)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600">{c.coach}</h3>
                <p className="text-slate-500 text-sm font-medium">
                  <span className="text-slate-800">{c.passengers.length}</span> Assigned
                </p>
              </div>
            ))}
          </div>
          {filteredCoaches.length === 0 && <p className="text-slate-500">No coaches found.</p>}

          {/* Print View for All Coaches */}
          <div className="hidden print:block space-y-8">
            {coaches.map(c => (
              <div key={c.coach} className="break-inside-avoid">
                <h2 className="font-bold text-lg mb-2">Coach {c.coach}</h2>
                <div className="overflow-x-auto">
<table className="w-full text-left text-sm border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 w-16">Berth</th>
                      <th className="p-2 border-r border-slate-200">Passenger</th>
                      <th className="p-2 border-r border-slate-200">Family</th>
                      <th className="p-2">Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.passengers.map(p => (
                      <tr key={p.mobile} className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 font-bold">{p.berth}</td>
                        <td className="p-2 border-r border-slate-200">{p.name}</td>
                        <td className="p-2 border-r border-slate-200">{p.familyName || '-'}</td>
                        <td className="p-2">{p.mobile}</td>
                      </tr>
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
            onClick={() => setViewCoach(null)}
            className="mb-6 text-slate-500 hover:text-slate-800 font-medium transition-colors print:hidden"
          >
            ← Back to all coaches
          </button>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h2 className="text-2xl font-bold text-slate-800">{viewCoach.coach}</h2>
              <span className="text-slate-500 font-medium">{viewCoach.passengers.length} passengers</span>
            </div>

            <div className="overflow-x-auto">
<table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                  <th className="p-4 border-r border-slate-200 w-24">Berth</th>
                  <th className="p-4 border-r border-slate-200">Passenger</th>
                  <th className="p-4 border-r border-slate-200">Family</th>
                  <th className="p-4">Mobile</th>
                </tr>
              </thead>
              <tbody>
                {viewCoach.passengers.map(p => (
                  <tr key={p.mobile} className="border-b border-slate-100 hover:bg-slate-50 print:border-slate-300">
                    <td className="p-4 border-r border-slate-100 font-bold text-slate-700">{p.berth}</td>
                    <td className="p-4 border-r border-slate-100">{p.name}</td>
                    <td className="p-4 border-r border-slate-100">{p.familyName || '-'}</td>
                    <td className="p-4 text-slate-600">{p.mobile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
            
            {viewCoach.passengers.length === 0 && (
              <p className="text-slate-500 text-center py-6">No passengers assigned to this coach yet.</p>
            )}
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

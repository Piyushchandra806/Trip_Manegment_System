'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { exportToCSV } from '@/lib/exportUtils';
import { Printer, Download, Search } from 'lucide-react';

const ADMIN_OPTIONS = [
  'All',
  'प्रितम चन्द्रा',
  'शीला चन्द्रा',
  'महेन्द्र चन्द्रा',
  'हरनारायण पाण्डेय',
  'सालिक / मयंक',
  'कैलाश / भागवत साहू / मितेश / तोपनारायण',
  'जीवन साहू',
  'जितेन्द्र',
  'पप्पू / कीर्तन',
  'भागवत चन्द्रा',
  'बोधराम चन्द्रा'
];

export default function PassengersList() {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [coachFilter, setCoachFilter] = useState('All');
  const [hotelFilter, setHotelFilter] = useState('All');
  const [adminFilter, setAdminFilter] = useState('All');
  const [missingOnly, setMissingOnly] = useState(false);
  
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    
    // Set a timeout for the request (e.g., 20 seconds)
    const timeoutId = setTimeout(() => {
      controller.abort('timeout');
    }, 20000);

    fetch('/api/admin/passengers', { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        // data is a flat list of enriched passengers
        const allPass = data.map(m => ({
          ...m,
          familyName: m.family?.familyName || m.familyName || 'Unknown',
          familyId: m.family?.familyId || m.familyId || 'F000000',
          coach: m.train?.coach || m.train?.coachNumber || '',
          berth: m.train?.berth || m.train?.berthNumber || '',
          berthType: m.train?.berthType || '',
          hotel: m.hotels?.[0]?.hotelName || '',
          room: m.hotels?.[0]?.roomNumber || m.hotels?.[0]?.room || ''
        }));
        setPassengers(allPass);
        setLoading(false);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') return; // Ignore intentionally cancelled or unmounted
        console.error(err);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort('unmount');
    };
  }, []);

  // Get unique options for filters
  const coaches = useMemo(() => ['All', ...new Set(passengers.map(p => p.coach).filter(Boolean))].sort(), [passengers]);
  const hotels = useMemo(() => ['All', ...new Set(passengers.map(p => p.hotel).filter(Boolean))].sort(), [passengers]);

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredData = useMemo(() => {
    return passengers.filter(p => {
      // Missing info filter
      if (missingOnly && p.coach && p.hotel && p.familyName && p.familyName !== 'Unknown') return false;
      
      // Dropdown filters
      if (coachFilter !== 'All' && p.coach !== coachFilter) return false;
      if (hotelFilter !== 'All' && p.hotel !== hotelFilter) return false;
      if (adminFilter !== 'All' && p.adminName !== adminFilter) return false;

      // Unified search
      if (search) {
        const query = search.toLowerCase();
        const searchableText = `${p.name} ${p.mobile} ${p.familyName} ${p.coach} ${p.berth} ${p.hotel} ${p.room}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      
      // Numeric sort for berth
      if (sortField === 'berth') {
         valA = parseInt(valA) || 0;
         valB = parseInt(valB) || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [passengers, search, coachFilter, hotelFilter, adminFilter, missingOnly, sortField, sortAsc]);

  const handleExport = () => {
    const exportData = filteredData.map(p => ({
      Name: p.name,
      Age: p.age || '',
      Gender: p.gender || '',
      "Father/Husband": p.relativeName || '',
      Mobile: p.mobile || '',
      Address: p.address || '',
      Family: p.familyName,
      Coach: p.coach,
      Berth: p.berth,
      Hotel: p.hotel,
      Room: p.room
    }));
    exportToCSV('Passengers_List.csv', exportData);
  };

  const handlePrint = () => {
    let printIframe = document.getElementById('print-iframe');
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'print-iframe';
      printIframe.style.position = 'absolute';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);
    }

    const printDocument = printIframe.contentWindow.document;
    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Passenger List - Print</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: system-ui, -apple-system, sans-serif; color: #333; margin: 0; padding: 0; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 5px; }
          .meta { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; page-break-inside: auto; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .missing { color: #d97706; }
        </style>
      </head>
      <body>
        <h1>Passenger List</h1>
        <div class="meta">Total Passengers: ${filteredData.length}</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Rel. Name</th>
              <th>Address</th>
              <th>Mobile</th>
              <th>Family</th>
              <th>Coach</th>
              <th>Berth</th>
              <th>Hotel & Room</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(p => `
              <tr>
                <td>${p.name || ''}</td>
                <td>${p.age || ''}</td>
                <td>${p.gender || ''}</td>
                <td>${p.relativeName || ''}</td>
                <td>${p.address || ''}</td>
                <td>${p.mobile || ''}</td>
                <td>${(p.familyName && p.familyName !== 'Unknown') ? p.familyName : '<span class="missing">Missing</span>'}</td>
                <td>${p.coach || '<span class="missing">-</span>'}</td>
                <td>${p.berth || ''}</td>
                <td>${p.hotel ? p.hotel + ' / ' + p.room : '<span class="missing">Missing</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printDocument.close();

    printIframe.contentWindow.focus();
    setTimeout(() => {
      printIframe.contentWindow.print();
    }, 250);
  };

  if (loading) return <div className="text-center py-10">Loading passengers...</div>;

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full print:bg-white print:p-0">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-800">Passengers</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4 print:hidden">
        {/* Universal Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search passenger, family, coach or room..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Coach:</span>
            <select className="border rounded-md px-2 py-1 bg-white outline-none" value={coachFilter} onChange={e => setCoachFilter(e.target.value)}>
              {coaches.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Hotel:</span>
            <select className="border rounded-md px-2 py-1 bg-white outline-none" value={hotelFilter} onChange={e => setHotelFilter(e.target.value)}>
              {hotels.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Admin:</span>
            <select className="border rounded-md px-2 py-1 bg-white outline-none" value={adminFilter} onChange={e => setAdminFilter(e.target.value)}>
              {ADMIN_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
            <input type="checkbox" checked={missingOnly} onChange={e => setMissingOnly(e.target.checked)} className="rounded text-blue-600" />
            Only show people with missing information
          </label>
        </div>
      </div>

      <div className="text-slate-600 mb-2 font-medium print:block hidden text-xl font-bold mb-4">
        Passenger List ({filteredData.length})
      </div>
      <div className="text-slate-500 text-sm mb-4 print:hidden">
        Showing {filteredData.length} passengers
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
          No matching passengers found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto print:border-none print:shadow-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-white text-sm">
                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                  Name {sortField === 'name' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 font-bold text-slate-700">Age</th>
                <th className="p-4 font-bold text-slate-700">Gender</th>
                <th className="p-4 font-bold text-slate-700">Rel. Name</th>
                <th className="p-4 font-bold text-slate-700">Address</th>
                <th className="p-4 font-bold text-slate-700">Mobile</th>
                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('familyName')}>
                  Family {sortField === 'familyName' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('coach')}>
                  Coach {sortField === 'coach' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('berth')}>
                  Berth {sortField === 'berth' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 font-bold text-slate-700">Hotel & Room</th>
                <th className="p-4 font-bold text-slate-700 print:hidden text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.map(p => (
                <tr key={p.passengerId} className="border-b border-slate-100 hover:bg-slate-50 print:border-slate-300">
                  <td className="p-4 font-medium text-slate-800">{p.name}</td>
                  <td className="p-4 text-slate-600">{p.age || '-'}</td>
                  <td className="p-4 text-slate-600">{p.gender || '-'}</td>
                  <td className="p-4 text-slate-600">{p.relativeName || '-'}</td>
                  <td className="p-4 text-slate-600">{p.address || '-'}</td>
                  <td className="p-4 text-slate-600">{p.mobile}</td>
                  <td className="p-4 text-slate-600">{(p.familyName && p.familyName !== 'Unknown') ? p.familyName : <span className="text-amber-500">⚠ Missing</span>}</td>
                  <td className="p-4 text-slate-600">{p.coach || <span className="text-amber-500">⚠</span>}</td>
                  <td className="p-4 text-slate-600">{p.berth}</td>
                  <td className="p-4 text-slate-600">
                    {p.hotel ? `${p.hotel} / ${p.room}` : <span className="text-amber-500">⚠ Missing</span>}
                  </td>
                  <td className="p-4 text-right print:hidden">
                    <Link href={`/admin/passengers/${p.passengerId}`} className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      

    </div>
  );
}

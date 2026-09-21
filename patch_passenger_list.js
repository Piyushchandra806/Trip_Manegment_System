const fs = require('fs');
let content = fs.readFileSync('app/admin/passengers/page.js', 'utf8');

// Patch handleExport
content = content.replace(
  `    const exportData = filteredData.map(p => ({
      Name: p.name,
      Mobile: p.mobile,
      Family: p.familyName,
      Coach: p.coach,
      Berth: p.berth,
      Hotel: p.hotel,
      Room: p.room
    }));`,
  `    const exportData = filteredData.map(p => ({
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
    }));`
);

// Patch Table Headers
const oldHeaders = `                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                  Name {sortField === 'name' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 font-bold text-slate-700">Mobile</th>
                <th className="p-4 font-bold text-slate-700">Aadhaar</th>
                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('familyName')}>
                  Family {sortField === 'familyName' && (sortAsc ? '↑' : '↓')}
                </th>`;
const newHeaders = `                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                  Name {sortField === 'name' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 font-bold text-slate-700">Age</th>
                <th className="p-4 font-bold text-slate-700">Sex</th>
                <th className="p-4 font-bold text-slate-700">Rel. Name</th>
                <th className="p-4 font-bold text-slate-700">Address</th>
                <th className="p-4 font-bold text-slate-700">Mobile</th>
                <th className="p-4 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('familyName')}>
                  Family {sortField === 'familyName' && (sortAsc ? '↑' : '↓')}
                </th>`;
content = content.replace(oldHeaders, newHeaders);

// Patch Table Body
const oldRow = `                  <td className="p-4 font-medium text-slate-800">{p.name}</td>
                  <td className="p-4 text-slate-600">{p.mobile}</td>
                  <td className="p-4 text-slate-600">{(p.familyName && p.familyName !== 'Unknown') ? p.familyName : <span className="text-amber-500">⚠ Missing</span>}</td>`;
const newRow = `                  <td className="p-4 font-medium text-slate-800">{p.name}</td>
                  <td className="p-4 text-slate-600">{p.age || '-'}</td>
                  <td className="p-4 text-slate-600">{p.gender || '-'}</td>
                  <td className="p-4 text-slate-600">{p.relativeName || '-'}</td>
                  <td className="p-4 text-slate-600">{p.address || '-'}</td>
                  <td className="p-4 text-slate-600">{p.mobile}</td>
                  <td className="p-4 text-slate-600">{(p.familyName && p.familyName !== 'Unknown') ? p.familyName : <span className="text-amber-500">⚠ Missing</span>}</td>`;
content = content.replace(oldRow, newRow);

fs.writeFileSync('app/admin/passengers/page.js', content);

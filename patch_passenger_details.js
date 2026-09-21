const fs = require('fs');
let content = fs.readFileSync('app/admin/passengers/[id]/page.js', 'utf8');

content = content.replace(
  `const [detailsForm, setDetailsForm] = useState({ name: '', mobile: '', familyName: '' });`,
  `const [detailsForm, setDetailsForm] = useState({ name: '', mobile: '', familyName: '', age: '', relativeName: '', address: '', gender: '' });`
);

content = content.replace(
  `setDetailsForm({ name: p.name, mobile: p.mobile, familyName: p.familyName });`,
  `setDetailsForm({ 
            name: p.name || '', 
            mobile: p.mobile || '', 
            familyName: p.familyName || '',
            age: p.age || '',
            relativeName: p.relativeName || '',
            address: p.address || '',
            gender: p.gender || ''
          });`
);

const formReplacement = `          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Age</label>
              <input type="number" value={detailsForm.age} onChange={e => setDetailsForm({...detailsForm, age: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Father/Husband Name</label>
              <input type="text" value={detailsForm.relativeName} onChange={e => setDetailsForm({...detailsForm, relativeName: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">`;
content = content.replace(`          <div className="grid grid-cols-2 gap-4">`, formReplacement);

fs.writeFileSync('app/admin/passengers/[id]/page.js', content);

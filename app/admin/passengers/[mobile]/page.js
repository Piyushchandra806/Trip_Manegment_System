'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PassengerDetail() {
  const params = useParams();
  const router = useRouter();
  const mobileParam = params.mobile;

  const [passenger, setPassenger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Form states
  const [detailsForm, setDetailsForm] = useState({ name: '', mobile: '', familyName: '' });
  const [trainForm, setTrainForm] = useState({ coach: '', berth: '', berthType: '' });
  const [newHotel, setNewHotel] = useState({ day: '', date: '', hotelName: '', floor: '', room: '' });

  const fetchPassenger = () => {
    fetch('/api/admin/passengers')
      .then(res => res.json())
      .then(data => {
        const p = data.find(x => x.mobile === mobileParam);
        if (p) {
          setPassenger(p);
          setDetailsForm({ name: p.name, mobile: p.mobile, familyName: p.familyName });
          if (p.train) {
            setTrainForm({ trainName: p.train.trainName || "", trainNumber: p.train.trainNumber || "", coachNumber: p.train.coach || "", berthNumber: p.train.berth || "", berthType: p.train.berthType || "" });
          }
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPassenger();
  }, [mobileParam]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to update these details?')) return;
    const res = await fetch(`/api/admin/passengers/${mobileParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...detailsForm, newMobile: detailsForm.mobile })
    });
    if (res.ok) {
      showToast('✓ Changes saved successfully.');
      if (detailsForm.mobile !== mobileParam) {
        router.push(`/admin/passengers/${detailsForm.mobile}`);
      } else {
        fetchPassenger();
      }
    } else {
      res.json().then(data => showToast(data.error || 'We couldn\'t save the changes. Please try again.'));
    }
  };

  const handleSaveTrain = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/train/${mobileParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainForm)
    });
    if (res.ok) {
      showToast('✓ Changes saved successfully.');
      fetchPassenger();
    } else {
      res.json().then(data => showToast(data.error || 'We couldn\'t save the changes. Please try again.'));
    }
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/hotels/${mobileParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHotel)
    });
    if (res.ok) {
      showToast('✓ Added successfully.');
      setNewHotel({ day: '', date: '', hotelName: '', floor: '', room: '' });
      fetchPassenger();
    } else {
      res.json().then(data => showToast(data.error || 'We couldn\'t save the changes. Please try again.'));
    }
  };

  
  const handleDeletePassenger = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete this passenger and all their allocations? This action cannot be undone.')) return;
    const res = await fetch(`/api/admin/passengers/${mobileParam}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Passenger deleted successfully.');
      router.push('/admin/passengers');
    } else {
      res.json().then(data => showToast(data.error || 'Failed to delete passenger.'));
    }
  };

  const handleDeleteHotel = async (day) => {
    if (!window.confirm('Are you sure you want to remove this hotel stay?')) return;
    const res = await fetch(`/api/admin/hotels/${mobileParam}/${day}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      showToast('✓ Removed successfully.');
      fetchPassenger();
    } else {
      res.json().then(data => showToast(data.error || 'We couldn\'t save the changes. Please try again.'));
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!passenger) return <div className="text-center py-10">Passenger not found.</div>;

  return (
    <div className="max-w-3xl mx-auto pb-12 relative">
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/passengers" className="text-slate-500 hover:text-slate-800 transition-colors">
          ← Back to Passengers
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Passenger Details</h2>
        <form onSubmit={handleSaveDetails} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input type="text" value={detailsForm.name} onChange={e => setDetailsForm({...detailsForm, name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
            <input type="text" value={detailsForm.mobile} onChange={e => setDetailsForm({...detailsForm, mobile: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Father/Husband Name</label>
              <input type="text" value={detailsForm.relativeName} onChange={e => setDetailsForm({...detailsForm, relativeName: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Age</label>
              <input type="number" value={detailsForm.age} onChange={e => setDetailsForm({...detailsForm, age: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Address</label>
              <input type="text" value={detailsForm.address} onChange={e => setDetailsForm({...detailsForm, address: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Gender</label>
              <select value={detailsForm.gender} onChange={e => setDetailsForm({...detailsForm, gender: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl bg-white">
                <option value="">Select Gender</option>
                <option value="M">Male (पु)</option>
                <option value="F">Female (म)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Family</label>
            <input type="text" value={detailsForm.familyName} onChange={e => setDetailsForm({...detailsForm, familyName: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-800 text-white px-5 py-2 rounded-xl font-semibold text-sm">Save Changes</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">🚆 Train Seat</h2>
        <form onSubmit={handleSaveTrain} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Train Name</label>
              <input type="text" value={trainForm.trainName} onChange={e => setTrainForm({...trainForm, trainName: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Train Number</label>
              <input type="text" value={trainForm.trainNumber} onChange={e => setTrainForm({...trainForm, trainNumber: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Coach</label>
              <input type="text" value={trainForm.coachNumber} onChange={e => setTrainForm({...trainForm, coachNumber: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Berth</label>
              <input type="text" value={trainForm.berthNumber} onChange={e => setTrainForm({...trainForm, berthNumber: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select value={trainForm.berthType} onChange={e => setTrainForm({...trainForm, berthType: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl bg-white" required>
                <option value="">Select</option>
                <option value="Lower">Lower</option>
                <option value="Middle">Middle</option>
                <option value="Upper">Upper</option>
                <option value="Side Lower">Side Lower</option>
                <option value="Side Upper">Side Upper</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-800 text-white px-5 py-2 rounded-xl font-semibold text-sm">Save Train Details</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">🏨 Hotel Stays</h2>
        
        {passenger.hotels && passenger.hotels.length > 0 ? (
          <div className="space-y-4 mb-6">
            {passenger.hotels.map(h => (
              <div key={h.day} className="p-4 border rounded-xl bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="font-bold text-slate-800">Day {h.day} - {h.hotelName}</div>
                  <div className="text-sm text-slate-500">Floor: {h.floor} | Room: {h.room}</div>
                </div>
                <button onClick={() => handleDeleteHotel(h.day)} className="text-red-600 font-semibold text-sm hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 mb-6">No hotel stays assigned.</p>
        )}

        <h3 className="font-bold text-slate-700 mb-3">+ Add Hotel Stay</h3>
        <form onSubmit={handleAddHotel} className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Day</label>
              <input type="number" value={newHotel.day} onChange={e => setNewHotel({...newHotel, day: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Date</label>
              <input type="text" placeholder="e.g. 24 Oct" value={newHotel.date} onChange={e => setNewHotel({...newHotel, date: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Hotel Name</label>
            <input type="text" value={newHotel.hotelName} onChange={e => setNewHotel({...newHotel, hotelName: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Floor</label>
              <input type="text" value={newHotel.floor} onChange={e => setNewHotel({...newHotel, floor: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Room</label>
              <input type="text" value={newHotel.room} onChange={e => setNewHotel({...newHotel, room: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-xl" required />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-800 text-white px-5 py-2 rounded-xl font-semibold text-sm">Add Stay</button>
          </div>
        </form>
      </div>


      <div className="mt-12 mb-6 border-t pt-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-red-800">Delete Passenger</p>
            <p className="text-sm text-red-600">This will remove the passenger and all their train and hotel allocations. This action cannot be undone.</p>
          </div>
          <button onClick={handleDeletePassenger} className="bg-red-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-red-700 whitespace-nowrap">
            Delete Passenger
          </button>
        </div>
      </div>
    </div>
  );
}

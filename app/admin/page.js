'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Download, Upload, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
    fetch('/api/admin/activities').then(r => r.json()).then(setActivities);
  }, []);

  const handleRestoreSubmit = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    
    const formData = new FormData();
    formData.append('file', restoreFile);
    
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert("Backup restored successfully!");
        window.location.reload();
      } else {
        alert(data.error || "Failed to restore backup.");
      }
    } catch (err) {
      alert("We couldn't complete the restore operation. Please try again.");
    } finally {
      setRestoring(false);
      setShowRestoreModal(false);
      setRestoreFile(null);
    }
  };

  if (!stats) return <div className="text-center py-10">Loading overview...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      
      {/* Overview Section */}
      <section>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">TRIP OVERVIEW</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-2">👥</span>
            <p className="text-slate-500 font-medium">Passengers</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalPassengers}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-2">👨‍👩‍👧</span>
            <p className="text-slate-500 font-medium">Families</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalFamilies}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-2">🚆</span>
            <p className="text-slate-500 font-medium">Train Seats</p>
            <p className="text-3xl font-bold text-slate-800">{stats.assignedSeats}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-2">🏨</span>
            <p className="text-slate-500 font-medium">Hotel Assignments</p>
            <p className="text-3xl font-bold text-slate-800">{stats.assignedRooms}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Data Status Section */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">DATA STATUS</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.missingTrainCount === 0 ? <span className="text-green-500 text-xl font-bold">✓</span> : <span className="text-amber-500 text-xl font-bold">⚠</span>}
                <span className="text-slate-800 font-medium text-lg">Passenger information</span>
              </div>
              {stats.missingTrainCount === 0 ? (
                 <span className="text-slate-500">Complete</span>
              ) : (
                 <span className="text-amber-600 font-medium">{stats.missingTrainCount} people missing</span>
              )}
            </div>

            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.missingTrainCount === 0 ? <span className="text-green-500 text-xl font-bold">✓</span> : <span className="text-amber-500 text-xl font-bold">⚠</span>}
                <span className="text-slate-800 font-medium text-lg">Train seat information</span>
              </div>
              {stats.missingTrainCount === 0 ? (
                 <span className="text-slate-500">Complete</span>
              ) : (
                 <span className="text-amber-600 font-medium">{stats.missingTrainCount} people missing</span>
              )}
            </div>

            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.missingHotelCount === 0 ? <span className="text-green-500 text-xl font-bold">✓</span> : <span className="text-amber-500 text-xl font-bold">⚠</span>}
                <span className="text-slate-800 font-medium text-lg">Hotel information</span>
              </div>
              {stats.missingHotelCount === 0 ? (
                 <span className="text-slate-500">Complete</span>
              ) : (
                 <span className="text-amber-600 font-medium">{stats.missingHotelCount} people missing</span>
              )}
            </div>

            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.missingFamilyCount === 0 ? <span className="text-green-500 text-xl font-bold">✓</span> : <span className="text-amber-500 text-xl font-bold">⚠</span>}
                <span className="text-slate-800 font-medium text-lg">Family information</span>
              </div>
              {stats.missingFamilyCount === 0 ? (
                 <span className="text-slate-500">Complete</span>
              ) : (
                 <span className="text-amber-600 font-medium">{stats.missingFamilyCount} people missing</span>
              )}
            </div>
            
          </div>
          
          {(stats.missingTrainCount > 0 || stats.missingHotelCount > 0 || stats.missingFamilyCount > 0) && (
            <div className="mt-6 flex justify-end">
              <Link href="/admin/problems" className="bg-amber-100 text-amber-800 px-6 py-3 rounded-xl font-bold hover:bg-amber-200 transition-colors">
                Fix Missing Information →
              </Link>
            </div>
          )}
        </section>

        {/* Activity & Backup Section */}
        <section className="space-y-12">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              💾 System Backups
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <a 
                href="/api/admin/backup" 
                download
                className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              >
                <Download className="w-5 h-5" /> Download Backup
              </a>
              
              <button 
                onClick={() => setShowRestoreModal(true)}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                <Upload className="w-5 h-5" /> Restore Backup
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-slate-400" /> Recent Activity
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No recent activity logged.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.map(act => (
                    <div key={act.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className="mt-1">
                         <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{act.action}</p>
                        {act.details && <p className="text-slate-600 text-sm mt-0.5">{act.details}</p>}
                        <p className="text-slate-400 text-xs mt-1">
                          {new Date(act.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </section>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="font-bold text-xl">Restore Trip Data?</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
              Restoring will completely replace the current trip information. 
              <strong> An automatic backup will be created before continuing.</strong>
            </p>

            <div className="mb-8">
              <input 
                type="file" 
                accept=".zip"
                onChange={(e) => setRestoreFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowRestoreModal(false); setRestoreFile(null); }}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleRestoreSubmit}
                disabled={!restoreFile || restoring}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {restoring ? 'Restoring...' : 'Backup & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

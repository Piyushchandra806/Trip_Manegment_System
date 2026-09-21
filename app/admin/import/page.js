'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, FileImage, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, X, Play, RefreshCw, UploadCloud } from 'lucide-react';
import { parseFile } from '@/lib/importParser';

export default function ImportPage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('Passengers'); // Passengers, Trains, Hotels, Complete
  
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  
  const [existingPassengers, setExistingPassengers] = useState([]);
  const [history, setHistory] = useState([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const [toast, setToast] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/admin/passengers').then(r => r.json()).then(data => {
      setExistingPassengers(data);
    });
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    fetch('/api/admin/import-history').then(r => r.json()).then(setHistory).catch(e => setHistory([]));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv|pdf|jpg|jpeg|png)$/i)) {
      showToast('Unsupported file format. Please upload Excel, CSV, PDF, or JPG/PNG.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast('This file is too large. Please upload a smaller file (Max 5MB).');
      return;
    }
    
    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const result = await parseFile(selectedFile, (p) => setProgress(Math.round(p * 100)));
      
      // Post processing: check duplicates
      const enrichedRecords = result.records.map(record => {
        const isDuplicate = existingPassengers.some(ep => 
          ep.mobile === record.mobile || 
          (record.aadhaarNumber && ep.aadhaarNumber === record.aadhaarNumber)
        );
        return {
          ...record,
          _isDuplicate: isDuplicate,
          duplicateAction: isDuplicate ? 'skip' : 'create' // Default Keep Existing
        };
      });

      setParsedData({
        records: enrichedRecords,
        confidence: result.confidence
      });
    } catch (err) {
      
      showToast("We couldn't read this file. Please make sure the file is clear and try again.");
      setFile(null);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const updateRecord = (index, field, value) => {
    const newRecords = [...parsedData.records];
    newRecords[index][field] = value;
    if (field === 'mobile') {
       newRecords[index]._warnings = { ...(newRecords[index]._warnings || {}), mobile: false };
    }
    setParsedData({ ...parsedData, records: newRecords });
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.records.length === 0) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: parsedData.records,
          actionType: activeTab
        })
      });
      
      if (res.ok) {
        showToast("Import successful!");
        setParsedData(null);
        setFile(null);
        fetchHistory();
        // Refresh passenger list
        const updated = await fetch('/api/admin/passengers').then(r => r.json());
        setExistingPassengers(updated.flatMap(f => f.members));
      } else {
        const err = await res.json();
        showToast(err.error || "Import failed");
      }
    } catch (err) {
      showToast("Error connecting to server");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing && !parsedData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Reading File...</h1>
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 mb-4">Please wait while we extract the information.</p>
          <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (parsedData) {
    const warningsCount = parsedData.records.reduce((acc, r) => acc + Object.keys(r._warnings || {}).length, 0);
    const duplicatesCount = parsedData.records.filter(r => r._isDuplicate).length;

    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">READY TO IMPORT</h1>
          <button onClick={() => setParsedData(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex justify-between items-center">
          <div>
            <p className="text-lg text-gray-800">Found <strong>{parsedData.records.length}</strong> records</p>
            {warningsCount > 0 && (
              <p className="text-amber-600 flex items-center mt-2">
                <AlertTriangle className="w-4 h-4 mr-1" /> {warningsCount} records need attention (low confidence)
              </p>
            )}
            {duplicatesCount > 0 && (
              <p className="text-blue-600 flex items-center mt-2">
                <AlertTriangle className="w-4 h-4 mr-1" /> {duplicatesCount} existing passengers detected
              </p>
            )}
          </div>
          <button 
            onClick={handleImport}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isProcessing ? 'Importing...' : 'Import Correct Records'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-medium text-gray-600">Mobile</th>
                <th className="p-4 font-medium text-gray-600">Name</th>
                <th className="p-4 font-medium text-gray-600">Coach</th>
                <th className="p-4 font-medium text-gray-600">Berth</th>
                <th className="p-4 font-medium text-gray-600">Hotel</th>
                <th className="p-4 font-medium text-gray-600">Room</th>
                <th className="p-4 font-medium text-gray-600">Duplicate Action</th>
              </tr>
            </thead>
            <tbody>
              {parsedData.records.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <input 
                      type="text" 
                      value={r.mobile || ''}
                      onChange={(e) => updateRecord(idx, 'mobile', e.target.value)}
                      className={`w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500 ${r._warnings?.mobile ? 'bg-amber-100 border-amber-300' : 'border-transparent bg-transparent hover:border-gray-300'}`} 
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="text" 
                      value={r.name || ''}
                      onChange={(e) => updateRecord(idx, 'name', e.target.value)}
                      className="w-full p-2 border border-transparent bg-transparent hover:border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="text" 
                      value={r.coach || ''}
                      onChange={(e) => updateRecord(idx, 'coach', e.target.value)}
                      className="w-16 p-2 border border-transparent bg-transparent hover:border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="text" 
                      value={r.berth || ''}
                      onChange={(e) => updateRecord(idx, 'berth', e.target.value)}
                      className="w-16 p-2 border border-transparent bg-transparent hover:border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="text" 
                      value={r.hotel || ''}
                      onChange={(e) => updateRecord(idx, 'hotel', e.target.value)}
                      className="w-full p-2 border border-transparent bg-transparent hover:border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="text" 
                      value={r.room || ''}
                      onChange={(e) => updateRecord(idx, 'room', e.target.value)}
                      className="w-16 p-2 border border-transparent bg-transparent hover:border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="p-4">
                    {r._isDuplicate ? (
                      <select 
                        value={r.duplicateAction} 
                        onChange={(e) => updateRecord(idx, 'duplicateAction', e.target.value)}
                        className="p-2 bg-blue-50 text-blue-800 rounded border border-blue-200 outline-none"
                      >
                        <option value="skip">Keep Existing</option>
                        <option value="update">Update Existing</option>
                      </select>
                    ) : (
                      <span className="text-green-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> New</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-6 py-3 rounded shadow-lg z-50">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-2">📥 ADD TRIP INFORMATION</h1>
      <p className="text-gray-600 mb-8">
        You can upload: <strong>Excel • CSV • PDF • JPG • PNG</strong>
      </p>

      <div className="mb-8">
        <p className="text-gray-700 font-medium mb-4">Choose what information you are adding:</p>
        <div className="flex flex-wrap gap-4">
          {['Passengers', 'Train Seats', 'Hotel Rooms', 'Complete Trip'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg border font-medium transition-colors ${activeTab === tab ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {tab === 'Passengers' && '👥 '}
              {tab === 'Train Seats' && '🚆 '}
              {tab === 'Hotel Rooms' && '🏨 '}
              {tab === 'Complete Trip' && '📋 '}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-12 text-center cursor-pointer transition-colors group mb-12"
      >
        <UploadCloud className="w-16 h-16 text-gray-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
        <h3 className="text-xl font-medium text-gray-800 mb-2">Drop file here</h3>
        <p className="text-gray-500 mb-6">or</p>
        <span className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors">
          Choose File
        </span>
        <p className="text-gray-400 text-sm mt-6">Excel • PDF • JPG • PNG</p>
        
        {/* We use accept attributes to allow mobile device camera as well */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/pdf, image/jpeg, image/png, image/jpg"
          onChange={handleFileChange}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Uploads</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">No recent uploads.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">{h.filename}</p>
                    <p className="text-sm text-gray-500">{h.count} records</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(h.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-xl text-slate-800 mb-4">You're about to update:</h3>
            
            <ul className="text-slate-600 space-y-2 mb-6 font-medium">
              <li>• {parsedData?.records.length} records</li>
            </ul>

            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm font-medium mb-6 flex items-start gap-2">
              <span>ℹ️</span> A backup will be created automatically before importing.
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100">
                Cancel
              </button>
              <button 
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                {importing ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

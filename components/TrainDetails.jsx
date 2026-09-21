/**
 * TrainDetails - Displays the train information.
 *
 * Props:
 *  - train: { trainName, trainNumber, coach, berth, berthType }
 */
export default function TrainDetails({ train }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <span className="text-lg">🚆</span>
        MY TRAIN
      </h3>

      {!train ? (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-slate-700 font-medium mb-1">Your train seat has not been assigned yet.</p>
          <p className="text-slate-500 text-sm">Please contact the trip administrator.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Train Name</p>
              <p className="text-lg font-bold text-slate-800">{train.trainName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Train Number</p>
              <p className="text-lg font-bold text-slate-800">{train.trainNumber || "-"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-600 uppercase tracking-wide font-bold mb-1">Coach</p>
                <p className="text-2xl font-black text-blue-900">{train.coach || "-"}</p>
             </div>
             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600 uppercase tracking-wide font-bold mb-1">Berth</p>
                <p className="text-2xl font-black text-emerald-900">{train.berth || "-"}</p>
             </div>
             <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex flex-col justify-center text-center">
                <p className="text-xs text-purple-600 uppercase tracking-wide font-bold mb-1">Type</p>
                <p className="text-lg font-bold text-purple-900 leading-tight">{train.berthType || "-"}</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

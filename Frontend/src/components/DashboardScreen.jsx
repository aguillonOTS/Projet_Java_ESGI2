import { Utensils, LogOut, Plus, Lock, MapPin } from 'lucide-react';

export default function DashboardScreen({ currentUser, openTables, tableCarts, onLogout, onOpenTable, onOpenAdmin }) {
  
  const getTableTotal = (tableNum) => {
    const cart = tableCarts[tableNum] || [];
    return cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
       {/* ... Header identique ... */}
       <div className="bg-white p-4 shadow flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-orange-600"><Utensils/> Dashboard</div>
        <div className="flex gap-4 items-center">
          <span className="font-bold text-gray-700">{currentUser?.firstName}</span>
          <button onClick={onLogout} className="text-red-500 flex gap-1 items-center text-sm font-bold hover:bg-red-50 px-3 py-1 rounded transition-colors"><LogOut size={16}/> Quitter</button>
        </div>
      </div>

      <div className="flex-1 p-10 max-w-5xl mx-auto w-full flex flex-col gap-10">
        <div className="grid grid-cols-2 gap-8">
            {/* ... Boutons Actions identiques ... */}
            <button onClick={() => { const t = prompt("Table N°?"); if(t) onOpenTable(t); }} className="bg-orange-600 text-white h-40 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 hover:bg-orange-700 hover:scale-[1.02] transition-all">
                <Plus size={48}/> <span className="text-2xl font-bold">Nouvelle Table</span>
            </button>
            {currentUser.permissions?.manage_stock && (
                <button onClick={onOpenAdmin} className="bg-slate-800 text-white h-40 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 hover:bg-slate-900 hover:scale-[1.02] transition-all">
                <Lock size={48}/> <span className="text-2xl font-bold">Administration</span>
                </button>
            )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center gap-2"><MapPin/> Tables Ouvertes</h2>
          <div className="grid grid-cols-4 gap-4">
            {openTables.map(t => {
                const amount = getTableTotal(t);
                return (
                  <button key={t} onClick={() => onOpenTable(t)} className="bg-white p-6 rounded-xl border-2 border-green-500 text-green-700 flex flex-col items-center justify-between h-32 hover:bg-green-50 shadow-sm transition-all active:scale-95">
                    <span className="font-bold text-xl">Table {t}</span>
                    {amount > 0 ? (
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                            {amount.toFixed(2)} €
                        </span>
                    ) : (
                        <span className="text-gray-300 text-xs">Libre</span>
                    )}
                  </button>
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
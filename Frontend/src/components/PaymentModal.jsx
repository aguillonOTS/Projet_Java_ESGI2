import { X, CreditCard, Banknote, Smartphone } from 'lucide-react';

export default function PaymentModal({ total, subtotal, discountAmount, onClose, onConfirm }) {
  const methods = [
    { id: 'CB', label: 'Carte Bancaire', icon: <CreditCard size={32}/>, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { id: 'CASH', label: 'Espèces', icon: <Banknote size={32}/>, color: 'bg-green-100 text-green-600 hover:bg-green-200' },
    { id: 'CONTACTLESS', label: 'Sans Contact', icon: <Smartphone size={32}/>, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' }
  ];

  const hasDiscount = discountAmount > 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-xl">Encaissement</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-8 text-center">
          {hasDiscount ? (
            <>
              <p className="text-gray-400 mb-1 line-through text-lg">{subtotal?.toFixed(2)} €</p>
              <p className="text-red-500 text-sm font-bold mb-2">Remise appliquée : -{discountAmount.toFixed(2)} €</p>
              <p className="text-5xl font-bold text-gray-800 mb-8">{total.toFixed(2)} €</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-2">Montant à régler</p>
              <p className="text-5xl font-bold text-gray-800 mb-8">{total.toFixed(2)} €</p>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => onConfirm(m.id)}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all border-2 border-transparent hover:border-gray-200 ${m.color}`}
              >
                {m.icon}
                <span className="font-bold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

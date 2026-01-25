import { X, Printer, Mail, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ReceiptModal({ cart, total, tableNumber, paymentMethod, onClose }) {
  const [emailSent, setEmailSent] = useState(false);
  const date = new Date().toLocaleString();

  // Calcul TVA simple
  const tva = total * 0.10; 
  const ht = total - tva;

  const handleSendEmail = () => {
    // Simulation d'envoi
    setTimeout(() => setEmailSent(true), 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in zoom-in-95">
      <div className="flex gap-4">
        
        {/* TICKET VISUEL */}
        <div className="bg-white w-80 shadow-2xl overflow-hidden font-mono text-sm relative rounded">
          <div className="p-6 text-center border-b border-dashed border-gray-300">
            <h2 className="text-xl font-bold uppercase mb-1">Pizzeria ESGI</h2>
            <p>12 Rue de la Pizza, PARIS</p>
            <p className="mt-4 text-xs">Tel: 01 23 45 67 89</p>
          </div>

          <div className="p-6 border-b border-dashed border-gray-300">
            <div className="flex justify-between mb-4 text-xs">
              <span>{date}</span>
              <span>Tab: {tableNumber}</span>
            </div>
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity || 1} x {item.name}</span>
                  <span>{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>TOTAL TTC</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Paiement: <span className="font-bold">{paymentMethod}</span>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>HT: {ht.toFixed(2)}</span>
              <span>TVA (10%): {tva.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 text-center text-xs">Merci de votre visite !</div>
        </div>

        {/* ACTIONS (IMPRIMER / EMAIL) */}
        <div className="flex flex-col gap-4 justify-center">
            <button onClick={() => window.print()} className="bg-white text-gray-800 px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-gray-50 flex items-center gap-3">
                <Printer size={24}/> Imprimer le ticket
            </button>

            <button onClick={handleSendEmail} disabled={emailSent} className={`px-6 py-4 rounded-xl font-bold shadow-lg flex items-center gap-3 transition-all ${emailSent ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {emailSent ? <><CheckCircle size={24}/> Envoyé !</> : <><Mail size={24}/> Facture Numérique</>}
            </button>

            <button onClick={onClose} className="bg-gray-800 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-gray-900 mt-auto">
                Terminer / Nouvelle commande
            </button>
        </div>

      </div>
    </div>
  );
}
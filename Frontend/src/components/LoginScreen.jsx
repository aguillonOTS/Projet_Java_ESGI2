import { useState } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config'; // Assurez-vous d'avoir exporté ENDPOINTS
import { User, Lock, ChevronRight, AlertCircle } from 'lucide-react';

export default function LoginScreen({ users, onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError(false);

    try {
      // APPEL SÉCURISÉ AU BACKEND
      // On n'envoie jamais le vrai mot de passe stocké en local, on envoie la tentative
      // Et le serveur répond Oui/Non
      await axios.post(`${ENDPOINTS.SALESPERSONS}/login`, {
        id: selectedUser.id,
        pinCode: pin
      });

      // Si axios ne throw pas d'erreur (status 200), c'est gagné
      onLogin(selectedUser);

    } catch (err) {
      console.error("Échec authentification", err);
      setError(true);
      setPin('');
      // Animation secousse
      setTimeout(() => setError(false), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-[800px] flex overflow-hidden min-h-[500px]">
        
        {/* COLONNE GAUCHE : LISTE UTILISATEURS */}
        <div className="w-1/2 border-r pr-6 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pizzeria ESGI</h1>
          <p className="text-gray-500 mb-6">Sélectionnez votre profil</p>
          
          <div className="space-y-3">
            {users.map(u => (
              <button 
                key={u.id}
                onClick={() => { setSelectedUser(u); setPin(''); setError(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    selectedUser?.id === u.id 
                    ? 'border-orange-500 bg-orange-50 shadow-md transform scale-102' 
                    : 'border-gray-100 hover:border-orange-200 hover:bg-gray-50'
                }`}
              >
                <div className={`p-3 rounded-full ${selectedUser?.id === u.id ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {u.role === 'ADMIN' ? <Lock size={20}/> : <User size={20}/>}
                </div>
                <div>
                    <span className="font-bold text-lg block">{u.firstName}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">{u.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* COLONNE DROITE : PIN PAD */}
        <div className="w-1/2 pl-6 flex flex-col justify-center items-center relative">
            {selectedUser ? (
                <form onSubmit={handleSubmit} className="w-full max-w-xs text-center animate-in fade-in slide-in-from-right-8">
                    <div className="mb-6">
                        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-2 transition-colors ${error ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {error ? <AlertCircle size={32}/> : <Lock size={32}/>}
                        </div>
                        <h3 className="font-bold text-xl text-gray-800">Bonjour {selectedUser.firstName}</h3>
                        <p className={`text-sm transition-colors ${error ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                            {error ? "Code incorrect" : "Entrez votre code PIN"}
                        </p>
                    </div>

                    <input 
                        type="password" 
                        autoFocus
                        maxLength={4}
                        value={pin}
                        disabled={loading}
                        onChange={(e) => { setPin(e.target.value); setError(false); }}
                        className={`w-full text-center text-4xl tracking-[1em] font-mono border-b-2 py-2 mb-8 outline-none bg-transparent transition-colors ${
                            error ? 'border-red-500 text-red-500' : 'border-gray-300 focus:border-orange-500'
                        }`}
                        placeholder="••••"
                    />

                    <button 
                        type="submit" 
                        disabled={loading || pin.length < 4}
                        className="w-full bg-orange-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Vérification...' : <>Connexion <ChevronRight className="group-hover:translate-x-1 transition-transform"/></>}
                    </button>
                </form>
            ) : (
                <div className="text-gray-300 flex flex-col items-center">
                    <User size={64} className="mb-4 opacity-20"/>
                    <p>En attente de sélection...</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
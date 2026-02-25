import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from './config'; // Configuration globale
import {
    Package, Coffee, Users, ArrowLeft, BarChart3, TrendingUp,
    Receipt, CreditCard, Banknote, Calendar, Clock, Power, UserCheck
} from 'lucide-react';

// Import des sous-composants
import UsersPanel from './components/UsersPanel';
import StockPanel from './components/StockPanel';
import MenuPanel from './components/MenuPanel';
import CustomersPanel from './components/CustomersPanel';

/**
 * Écran d'administration complet.
 * Regroupe les statistiques (Dashboard), la gestion de stock, du menu et des utilisateurs.
 */
export default function AdminPanel({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('STATS');
  
  // --- ÉTATS DONNÉES ---
  const [orders, setOrders] = useState([]); // Données brutes (Source de vérité locale)
  const [filteredOrders, setFilteredOrders] = useState([]); // Données filtrées pour affichage
  
  // --- ÉTATS UI ---
  const [timeRange, setTimeRange] = useState('DAY'); // 'DAY' | 'WEEK' | 'MONTH'
  const [serviceOpen, setServiceOpen] = useState(true); 
  
  // KPIs (Key Performance Indicators)
  const [kpi, setKpi] = useState({ revenue: 0, count: 0, average: 0, cash: 0, cb: 0 });

  // 1. Chargement des données au montage ou changement d'onglet
  useEffect(() => {
    if (activeTab === 'STATS') fetchOrders();
  }, [activeTab]);

  // 2. Recalcul automatique si les commandes ou le filtre changent
  useEffect(() => {
    filterAndCalculate();
  }, [orders, timeRange]);

  const fetchOrders = () => {
    axios.get(ENDPOINTS.ORDERS)
      .then(res => setOrders(res.data))
      .catch(err => console.error("Erreur chargement commandes:", err));
  };

  /**
   * Cœur du tableau de bord : Filtre les données brutes et recalcule les métriques.
   * NOTE: Dans une application à fort trafic, ces calculs devraient être faits par le Backend (SQL Aggregations).
   */
  const filterAndCalculate = () => {
    const now = new Date();
    
    // Étape A : Filtrage Temporel
    const filtered = orders.filter(order => {
        const orderDate = new Date(order.date);
        
        if (timeRange === 'DAY') {
            return orderDate.toDateString() === now.toDateString();
        }
        if (timeRange === 'WEEK') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return orderDate >= oneWeekAgo;
        }
        if (timeRange === 'MONTH') {
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    // Tri : Plus récent en haut
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredOrders(filtered);

    // Étape B : Agrégation (Calcul des totaux)
    const revenue = filtered.reduce((acc, o) => acc + o.totalAmount, 0);
    const count = filtered.length;
    
    const cashTotal = filtered
        .filter(o => o.paymentMethod === 'CASH')
        .reduce((acc, o) => acc + o.totalAmount, 0);
        
    const cbTotal = filtered
        .filter(o => ['CB', 'CONTACTLESS'].includes(o.paymentMethod))
        .reduce((acc, o) => acc + o.totalAmount, 0);

    setKpi({
        revenue,
        count,
        average: count > 0 ? revenue / count : 0,
        cash: cashTotal,
        cb: cbTotal
    });
  };

  /**
   * Gestion de la clôture de caisse (Z de caisse).
   */
  const toggleService = () => {
    if (serviceOpen) {
        if(!window.confirm("⚠️ Voulez-vous vraiment CLÔTURER la journée ?\nCela devrait générer le rapport Z.")) return;
        alert(`JOURNÉE CLÔTURÉE.\n\nTotal: ${kpi.revenue.toFixed(2)}€\nEspèces: ${kpi.cash.toFixed(2)}€\nCB: ${kpi.cb.toFixed(2)}€`);
    }
    setServiceOpen(!serviceOpen);
  };

  // Helpers de formatage date/heure
  const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (isoString) => new Date(isoString).toLocaleDateString();

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* SIDEBAR DE NAVIGATION */}
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col shadow-xl z-10">
        <div className="mb-10">
            <h2 className="text-xl font-bold tracking-wider uppercase text-orange-500">Administration</h2>
            <p className="text-xs text-slate-400 mt-1">Connecté : {user?.firstName}</p>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavButton 
            active={activeTab === 'STATS'} 
            onClick={() => setActiveTab('STATS')} 
            icon={<BarChart3 size={20}/>} 
            label="Supervision" 
          />
          
          {user.permissions?.manage_stock && (
            <NavButton 
                active={activeTab === 'STOCK'} 
                onClick={() => setActiveTab('STOCK')} 
                icon={<Package size={20}/>} 
                label="Stocks" 
            />
          )}

          {user.permissions?.manage_menu && (
            <NavButton 
                active={activeTab === 'MENU'} 
                onClick={() => setActiveTab('MENU')} 
                icon={<Coffee size={20}/>} 
                label="Carte" 
            />
          )}

          {user.permissions?.manage_users && (
            <NavButton
                active={activeTab === 'USERS'}
                onClick={() => setActiveTab('USERS')}
                icon={<Users size={20}/>}
                label="Équipe"
            />
          )}

          <NavButton
            active={activeTab === 'CUSTOMERS'}
            onClick={() => setActiveTab('CUSTOMERS')}
            icon={<UserCheck size={20}/>}
            label="Clients"
          />
        </nav>

        <button onClick={onBack} className="mt-auto flex items-center justify-center gap-2 text-slate-400 hover:text-white p-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft size={16}/> Retour Caisse
        </button>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 p-8 overflow-y-auto bg-gray-100">
        
        {activeTab === 'STATS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              
              {/* HEADER */}
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="text-orange-600"/> Pilotage
                    </h2>
                    <p className="text-gray-500 text-sm">Vue d'ensemble de l'activité</p>
                  </div>

                  {/* Bouton État Service */}
                  <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-sm ${serviceOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <Power size={16}/> {serviceOpen ? 'SERVICE EN COURS' : 'SERVICE CLÔTURÉ'}
                      </div>
                      <button 
                        onClick={toggleService}
                        className={`text-sm font-bold px-4 py-2 rounded-lg text-white transition-all shadow ${serviceOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                      >
                          {serviceOpen ? 'Fermer la Journée' : 'Ouvrir la Journée'}
                      </button>
                  </div>
              </div>

              {/* BARRE DE FILTRES */}
              <div className="flex justify-center">
                  <div className="bg-white p-1 rounded-lg shadow-sm border flex gap-1">
                      {[
                          { id: 'DAY', label: "Aujourd'hui", icon: <Clock size={16}/> },
                          { id: 'WEEK', label: "7 Jours", icon: <Calendar size={16}/> },
                          { id: 'MONTH', label: "Ce Mois", icon: <Calendar size={16}/> }
                      ].map(t => (
                          <button 
                            key={t.id}
                            onClick={() => setTimeRange(t.id)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${timeRange === t.id ? 'bg-slate-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                              {t.icon} {t.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KpiCard title="Chiffre d'Affaires" value={`${kpi.revenue.toFixed(2)} €`} color="blue" />
                  <KpiCard title="Panier Moyen" value={`${kpi.average.toFixed(2)} €`} color="green" />
                  <KpiCard title="Commandes" value={kpi.count} color="purple" />
                  
                  {/* Card Ventilation */}
                  <div className="bg-slate-800 p-5 rounded-xl shadow-sm text-white">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-2">Répartition</p>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-1"><Banknote size={14}/> Espèces</span>
                          <span className="font-bold">{kpi.cash.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1"><CreditCard size={14}/> Carte</span>
                          <span className="font-bold">{kpi.cb.toFixed(2)} €</span>
                      </div>
                  </div>
              </div>

              {/* TABLEAU HISTORIQUE */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2">
                          <Receipt size={18}/> Historique des transactions
                      </h3>
                      <span className="text-xs font-bold bg-white border px-2 py-1 rounded text-gray-500">
                          {filteredOrders.length} lignes
                      </span>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-400 text-xs uppercase sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-4 font-bold">Heure / Date</th>
                                <th className="p-4 font-bold">Table</th>
                                <th className="p-4 font-bold">Détail</th>
                                <th className="p-4 font-bold">Paiement</th>
                                <th className="p-4 text-right font-bold">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 italic">Aucune vente sur cette période.</td>
                                </tr>
                            ) : (
                                filteredOrders.map((o, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                        <td className="p-4 text-gray-600">
                                            <div className="font-bold text-gray-800">{formatTime(o.date)}</div>
                                            <div className="text-xs">{formatDate(o.date)}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold text-xs">T-{o.tableNumber}</span>
                                        </td>
                                        <td className="p-4 text-gray-500 max-w-xs truncate" title={o.items?.map(i => i.name).join(', ')}>
                                            {o.items?.length || 0} art. ({o.items?.[0]?.name}...)
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${o.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {o.paymentMethod === 'CASH' ? <Banknote size={12}/> : <CreditCard size={12}/>}
                                                {o.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-gray-800">
                                            {o.totalAmount?.toFixed(2)} €
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
        )}

        {/* COMPOSANTS ENFANTS */}
        {activeTab === 'STOCK' && <StockPanel />}
        {activeTab === 'MENU' && <MenuPanel />}
        {activeTab === 'USERS' && <UsersPanel />}
        {activeTab === 'CUSTOMERS' && <CustomersPanel />}

      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS UI (Pour la lisibilité) ---

function NavButton({ active, onClick, icon, label }) {
    return (
        <button 
            onClick={onClick} 
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${active ? 'bg-orange-600 text-white shadow-lg scale-105' : 'text-slate-300 hover:bg-slate-800'}`}
        >
            {icon} {label}
        </button>
    );
}

function KpiCard({ title, value, color }) {
    const borderColors = {
        blue: "border-blue-500",
        green: "border-green-500",
        purple: "border-purple-500"
    };

    return (
        <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${borderColors[color] || 'border-gray-500'}`}>
            <p className="text-gray-400 text-xs font-bold uppercase">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );
}
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ENDPOINTS } from './config'; // Configuration centralisée des URLs

// Import des écrans métiers
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import PosScreen from './components/PosScreen';
import AdminPanel from './AdminPanel';
import ReceiptModal from './components/ReceiptModal';
import PaymentModal from './components/PaymentModal';

import './App.css';

/**
 * Composant Racine (Main Orchestrator).
 * <p>
 * Rôle :
 * 1. Gère le routage simple (View State) entre Login, Dashboard, POS et Admin.
 * 2. Maintient l'état global du restaurant (Tables ouvertes, Utilisateur connecté).
 * 3. Gère le flux de finalisation de commande (Paiement -> API).
 * </p>
 */
export default function App() {
  
  // --- ÉTATS GLOBAUX ---
  const [view, setView] = useState('LOGIN'); 
  const [currentUser, setCurrentUser] = useState(null);
  
  // Données référentielles (chargées au démarrage)
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // État opérationnel (Tables & Paniers)
  const [tableNumber, setTableNumber] = useState(null);
  const [tableCarts, setTableCarts] = useState({}); 
  const [openTables, setOpenTables] = useState([]); 

  // Modales d'interaction
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  /**
   * Initialisation : Récupération des données maîtres depuis le Backend.
   * Utilise les ENDPOINTS définis dans config.js pour la maintenabilité.
   */
  useEffect(() => {
    axios.get(ENDPOINTS.SALESPERSONS)
         .then(r => setUsers(r.data))
         .catch(err => console.error("Erreur critique chargement vendeurs", err));

    axios.get(ENDPOINTS.PRODUCTS)
         .then(r => setProducts(r.data))
         .catch(err => console.error("Erreur critique chargement produits", err));
  }, []);

  /**
   * Met à jour le panier d'une table spécifique en temps réel.
   * @param {number} tableNum - Numéro de la table.
   * @param {Array} newCart - Liste des articles mis à jour.
   */
  const updateTableCart = (tableNum, newCart) => {
    setTableCarts(prev => ({ ...prev, [tableNum]: newCart }));
  };

  /**
   * Simule l'envoi en cuisine (Step intermédiaire avant paiement).
   */
  const handleSendOrder = () => {
    alert(`Commande pour la Table ${tableNumber} envoyée en cuisine ! 👨‍🍳🔥`);
    setView('DASHBOARD');
  };

  /**
   * Ouvre la modale de paiement avec le montant calculé localement.
   * @param {number} total - Montant total estimé.
   * @param {Array} cart - Contenu du panier.
   */
  const handleInitiatePayment = (total, cart) => {
    setCurrentTransaction({ total, cart });
    setShowPayment(true);
  };

  /**
   * Finalise la transaction et l'envoie au Backend.
   * <p>
   * SÉCURITÉ : Nous n'envoyons PAS le montant total au backend.
   * Nous envoyons uniquement les articles (ID + Quantité).
   * Le backend (OrderService) recalculera le prix pour certifier la transaction.
   * </p>
   * @param {string} method - Méthode de paiement ('CASH', 'CB', etc.)
   */
  const handleConfirmPayment = (method) => {
    setShowPayment(false);
    
    // Construction du DTO (Data Transfer Object) pour l'API
    const orderData = {
      salespersonId: currentUser.id,
      tableNumber: parseInt(tableNumber),
      paymentMethod: method,
      // Mapping propre pour ne garder que les données essentielles
      items: currentTransaction.cart.map(item => ({
          id: item.id,
          quantity: item.quantity
      }))
    };

    axios.post(ENDPOINTS.ORDERS, orderData)
      .then((response) => {
        // Succès : La commande est persistée et validée par le serveur
        setShowReceipt(true);
        
        // Nettoyage de l'état local (Table libérée)
        const newCarts = { ...tableCarts };
        delete newCarts[tableNumber];
        setTableCarts(newCarts);
        
        // Retour à la vue salle
        setView('DASHBOARD');
      })
      .catch(err => {
        console.error(err);
        alert("Erreur encaissement : " + (err.response?.data?.message || "Erreur serveur inconnue"));
      });
  };

  /**
   * Ferme le ticket de caisse et réinitialise la table courante.
   */
  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCurrentTransaction(null);
    setOpenTables(prev => prev.filter(t => t !== tableNumber));
    setTableNumber(null);
  };

  // --- RENDU CONDITIONNEL (ROUTING) ---

  if (view === 'LOGIN') {
    return (
        <LoginScreen 
            users={users} 
            onLogin={(u) => { setCurrentUser(u); setView('DASHBOARD'); }} 
        />
    );
  }

  if (view === 'ADMIN') {
    return (
        <AdminPanel 
            user={currentUser} 
            onBack={() => setView('DASHBOARD')} 
        />
    );
  }

  if (view === 'DASHBOARD') {
    return (
      <>
        <DashboardScreen 
          currentUser={currentUser} 
          openTables={openTables}
          tableCarts={tableCarts}
          onLogout={() => setView('LOGIN')}
          onOpenAdmin={() => setView('ADMIN')}
          onOpenTable={(num) => {
              const tableInt = parseInt(num);
              // Ajout à la liste des tables ouvertes si nouveau
              if (!openTables.includes(tableInt)) {
                  setOpenTables(prev => [...prev, tableInt].sort((a,b) => a - b));
              }
              setTableNumber(tableInt);
              setView('POS');
          }}
        />
        {/* Affichage conditionnel du ticket après paiement */}
        {showReceipt && currentTransaction && (
          <ReceiptModal 
            cart={currentTransaction.cart} 
            total={currentTransaction.total} 
            tableNumber={tableNumber} 
            paymentMethod={currentTransaction.method || 'CB'}
            onClose={handleCloseReceipt} 
          />
        )}
      </>
    );
  }

  if (view === 'POS') {
    return (
      <>
        <PosScreen 
          currentUser={currentUser}
          tableNumber={tableNumber}
          products={products}
          initialCart={tableCarts[tableNumber] || []}
          onUpdateCart={(newCart) => updateTableCart(tableNumber, newCart)}
          onSendOrder={handleSendOrder}
          onPay={(total, cart) => handleInitiatePayment(total, cart)}
          onExit={() => setView('DASHBOARD')}
        />
        
        {/* Modale de choix de paiement */}
        {showPayment && currentTransaction && (
           <PaymentModal 
             total={currentTransaction.total}
             onClose={() => setShowPayment(false)}
             onConfirm={handleConfirmPayment}
           />
        )}
      </>
    );
  }

  return <div className="loading-screen">Chargement de l'application...</div>;
}
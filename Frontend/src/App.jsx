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
import CustomerSearchModal from './components/CustomerSearchModal';

import './App.css';

/**
 * Composant Racine (Main Orchestrator).
 * <p>
 * Rôle :
 * 1. Gère le routage simple (View State) entre Login, Dashboard, POS et Admin.
 * 2. Maintient l'état global du restaurant (Tables ouvertes, Utilisateur connecté).
 * 3. Gère le flux de finalisation de commande (Client -> Remise -> Paiement -> API).
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
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  /**
   * Initialisation : Récupération des données maîtres depuis le Backend.
   */
  useEffect(() => {
    axios.get(ENDPOINTS.SALESPERSONS)
         .then(r => setUsers(r.data))
         .catch(err => console.error("Erreur critique chargement vendeurs", err));

    axios.get(ENDPOINTS.PRODUCTS)
         .then(r => setProducts(r.data))
         .catch(err => console.error("Erreur critique chargement produits", err));
  }, []);

  const updateTableCart = (tableNum, newCart) => {
    setTableCarts(prev => ({ ...prev, [tableNum]: newCart }));
  };

  const handleSendOrder = () => {
    alert(`Commande pour la Table ${tableNumber} envoyée en cuisine ! 👨‍🍳🔥`);
    setView('DASHBOARD');
  };

  /**
   * Étape 1 : L'utilisateur clique "Encaisser".
   * On ouvre d'abord la recherche client / remise.
   */
  const handleInitiatePayment = (total, cart) => {
    setCurrentTransaction({ total, cart });
    setShowCustomerSearch(true);
  };

  /**
   * Étape 2 : L'utilisateur a choisi (ou non) un client et ses remises.
   * On passe au choix du moyen de paiement.
   */
  const handleCustomerConfirm = ({ customer, discountAmount, discountReason, finalTotal }) => {
    setShowCustomerSearch(false);
    setCurrentTransaction(prev => ({
      ...prev,
      customer,
      discountAmount,
      discountReason,
      finalTotal
    }));
    setShowPayment(true);
  };

  /**
   * Étape 3 : Finalise la transaction et l'envoie au Backend.
   * <p>
   * SÉCURITÉ : On envoie uniquement les articles (ID + Quantité) + les infos de remise.
   * Le backend (OrderService) recalcule le prix et applique la remise pour certifier la transaction.
   * </p>
   */
  const handleConfirmPayment = (method) => {
    setShowPayment(false);

    const orderData = {
      salespersonId: currentUser.id,
      tableNumber: parseInt(tableNumber),
      paymentMethod: method,
      customerId: currentTransaction.customer?.id || null,
      discountAmount: currentTransaction.discountAmount || 0,
      discountReason: currentTransaction.discountReason || null,
      items: currentTransaction.cart.map(item => ({
        id: item.id,
        quantity: item.quantity
      }))
    };

    // Points avant la commande — pour calculer les points gagnés après
    const previousPoints = currentTransaction.customer?.loyaltyPoints ?? 0;
    const customerId = orderData.customerId;

    axios.post(ENDPOINTS.ORDERS, orderData)
      .then((response) => {
        // Le serveur retourne la commande validée avec le total certifié
        // (peut inclure une remise auto 5% appliquée côté serveur)
        const savedOrder = response.data;

        const finalize = (updatedCustomer) => {
          // Points gagnés = différence calculée depuis le backend (source de vérité)
          const pointsEarned = updatedCustomer
            ? Math.max(0, updatedCustomer.loyaltyPoints - previousPoints)
            : 0;

          setCurrentTransaction(prev => ({
            ...prev,
            method,
            finalTotal: savedOrder.totalAmount,
            discountAmount: savedOrder.discountAmount ?? 0,
            discountReason: savedOrder.discountReason ?? null,
            customer: updatedCustomer ?? prev.customer,
            pointsEarned,
          }));
          setShowReceipt(true);

          // Nettoyage de l'état local (Table libérée)
          const newCarts = { ...tableCarts };
          delete newCarts[tableNumber];
          setTableCarts(newCarts);
          setView('DASHBOARD');
        };

        if (customerId) {
          // Re-fetch du client pour avoir le solde exact après crédit des points
          axios.get(`${ENDPOINTS.CUSTOMERS}/${customerId}`)
            .then(r => finalize(r.data))
            .catch(() => finalize(null));
        } else {
          finalize(null);
        }
      })
      .catch(err => {
        console.error(err);
        const message = err.response?.data?.message || "Erreur serveur inconnue";
        alert("⚠️ " + message);
      });
  };

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
              if (!openTables.includes(tableInt)) {
                  setOpenTables(prev => [...prev, tableInt].sort((a,b) => a - b));
              }
              setTableNumber(tableInt);
              setView('POS');
          }}
        />
        {showReceipt && currentTransaction && (
          <ReceiptModal
            cart={currentTransaction.cart}
            total={currentTransaction.finalTotal ?? currentTransaction.total}
            subtotal={currentTransaction.total}
            discountAmount={currentTransaction.discountAmount}
            discountReason={currentTransaction.discountReason}
            customer={currentTransaction.customer}
            pointsEarned={currentTransaction.pointsEarned ?? 0}
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

        {/* Étape 1 : Recherche client + remises */}
        {showCustomerSearch && currentTransaction && (
          <CustomerSearchModal
            subtotal={currentTransaction.total}
            onConfirm={handleCustomerConfirm}
            onClose={() => setShowCustomerSearch(false)}
          />
        )}

        {/* Étape 2 : Choix du moyen de paiement */}
        {showPayment && currentTransaction && (
          <PaymentModal
            total={currentTransaction.finalTotal ?? currentTransaction.total}
            subtotal={currentTransaction.total}
            discountAmount={currentTransaction.discountAmount}
            onClose={() => setShowPayment(false)}
            onConfirm={handleConfirmPayment}
          />
        )}
      </>
    );
  }

  return <div className="loading-screen">Chargement de l'application...</div>;
}

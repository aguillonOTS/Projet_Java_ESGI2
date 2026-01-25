import { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, ChevronLeft, Minus, Search, Plus,
  Pizza, Utensils, Cookie, GlassWater, Beer, Wine 
} from 'lucide-react';

// Configuration statique des catégories (Design)
const POS_CATEGORIES = [
  { id: 'PIZZA', label: 'Pizzas', icon: <Pizza size={24}/>, color: 'bg-orange-100 text-orange-600' },
  { id: 'PASTA', label: 'Pâtes', icon: <Utensils size={24}/>, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'DESSERT', label: 'Desserts', icon: <Cookie size={24}/>, color: 'bg-pink-100 text-pink-600' },
  { id: 'SOFT', label: 'Softs', icon: <GlassWater size={24}/>, color: 'bg-blue-100 text-blue-600' },
  { id: 'BEER', label: 'Bières', icon: <Beer size={24}/>, color: 'bg-amber-100 text-amber-600' },
  { id: 'WINE_RED', label: 'Vin Rouge', icon: <Wine size={24}/>, color: 'bg-red-100 text-red-800' },
  { id: 'WINE_WHITE', label: 'Vin Blanc', icon: <Wine size={24}/>, color: 'bg-lime-100 text-lime-700' },
  { id: 'WINE_ROSE', label: 'Vin Rosé', icon: <Wine size={24}/>, color: 'bg-rose-100 text-rose-600' },
  { id: 'APERITIF', label: 'Apéritifs', icon: <GlassWater size={24}/>, color: 'bg-green-100 text-green-600' },
];

/**
 * Écran de Prise de Commande (Point of Sale).
 * <p>
 * Permet au serveur de sélectionner des produits par catégorie, d'ajuster les quantités
 * et de voir le total en temps réel.
 * </p>
 * * @param {Object} currentUser - L'utilisateur connecté.
 * @param {number} tableNumber - La table en cours d'édition.
 * @param {Array} products - Catalogue complet des produits.
 * @param {Array} initialCart - Panier existant (si on revient sur la table).
 * @param {Function} onUpdateCart - Callback vers le parent pour sauvegarder l'état.
 */
export default function PosScreen({ currentUser, tableNumber, products, initialCart, onUpdateCart, onPay, onSendOrder, onExit }) {
  const [selectedCategory, setSelectedCategory] = useState('PIZZA');
  const [cart, setCart] = useState(initialCart || []);

  // Synchronisation ascendante : Informe App.jsx à chaque modif du panier
  useEffect(() => {
    if (onUpdateCart) onUpdateCart(cart);
  }, [cart, onUpdateCart]);

  /**
   * Ajoute un produit au panier.
   * Logique : Si le produit existe déjà, on incrémente sa quantité (pas de doublon de ligne).
   */
  const addToCart = (product) => {
      setCart(prevCart => {
          const existingIndex = prevCart.findIndex(item => item.id === product.id);
          
          if (existingIndex >= 0) {
              // Clone du tableau pour respecter l'immutabilité React
              const newCart = [...prevCart];
              newCart[existingIndex] = {
                  ...newCart[existingIndex],
                  quantity: (newCart[existingIndex].quantity || 1) + 1
              };
              return newCart;
          } else {
              // Nouvel article
              return [...prevCart, { ...product, quantity: 1 }];
          }
      });
  };

  /**
   * Retire un produit ou décrémente sa quantité.
   * Logique : Si quantité > 1, on décrémente. Si quantité = 1, on supprime la ligne.
   */
  const removeFromCart = (product) => {
      setCart(prevCart => {
          const existingIndex = prevCart.findIndex(item => item.id === product.id);
          if (existingIndex === -1) return prevCart;

          const newCart = [...prevCart];
          const currentQty = newCart[existingIndex].quantity || 1;

          if (currentQty > 1) {
              newCart[existingIndex] = { ...newCart[existingIndex], quantity: currentQty - 1 };
              return newCart;
          } else {
              newCart.splice(existingIndex, 1);
              return newCart;
          }
      });
  };

  /**
   * OPTIMISATION DE PERFORMANCE (useMemo)
   * Filtre les produits à afficher selon la catégorie sélectionnée.
   * Ne recalcule que si 'products' ou 'selectedCategory' changent.
   */
  const displayedProducts = useMemo(() => {
    return products.filter(p => {
      const name = p.name ? p.name.toUpperCase() : '';
      const type = p.type; 
      
      // Filtrage métier basique sur le nom et le type
      switch (selectedCategory) {
        case 'PIZZA': return type === 'DISH' && name.includes('PIZZA');
        case 'PASTA': return type === 'DISH' && (name.includes('PASTA') || name.includes('TAGLIATELLE') || name.includes('LASAGNE'));
        case 'DESSERT': return type === 'DISH' && (name.includes('TIRAMISU') || name.includes('GLACE') || name.includes('MOUSSE') || name.includes('PANNA') || name.includes('DESSERT'));
        case 'SOFT': return type === 'DRINK' && !p.isAlcoholic;
        case 'BEER': return type === 'DRINK' && (name.includes('BIÈRE') || name.includes('HEINEKEN') || name.includes('PERONI') || name.includes('MORETTI'));
        case 'WINE_RED': return type === 'DRINK' && (name.includes('ROUGE') || name.includes('CHIANTI') || name.includes('BAROLO') || name.includes('BORDEAUX') || name.includes('NERO'));
        case 'WINE_WHITE': return type === 'DRINK' && (name.includes('BLANC') || name.includes('PINOT') || name.includes('CHABLIS') || name.includes('SANCERRE'));
        case 'WINE_ROSE': return type === 'DRINK' && (name.includes('ROSÉ') || name.includes('PROVENCE'));
        case 'APERITIF': return type === 'DRINK' && (name.includes('SPRITZ') || name.includes('MARTINI'));
        default: return false;
      }
    });
  }, [products, selectedCategory]);

  /**
   * OPTIMISATION DE PERFORMANCE
   * Calcule le total du panier. Ne se recalcule que si le 'cart' change.
   */
  const totalAmount = useMemo(() => {
      return cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  }, [cart]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      {/* HEADER POS : Navigation et Info Table */}
      <div className="bg-white p-3 shadow-sm border-b flex justify-between items-center z-10">
          <button onClick={onExit} className="flex items-center gap-2 font-bold text-gray-500 hover:text-orange-600 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
              <ChevronLeft/> Retour Dashboard
          </button>
          <div className="flex flex-col items-center">
              <span className="font-bold text-xl">Table {tableNumber}</span>
              <span className="text-xs text-gray-400">Serveur: {currentUser?.firstName}</span>
          </div>
          <div className="w-32 text-right font-mono font-bold text-orange-600 text-lg">
             {totalAmount.toFixed(2)} €
          </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR GAUCHE : Sélecteur de Catégories */}
        <div className="w-32 bg-white border-r overflow-y-auto flex flex-col gap-2 p-2 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.02)] no-scrollbar">
          {POS_CATEGORIES.map(cat => (
              <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ${selectedCategory === cat.id ? `${cat.color} ring-2 ring-offset-1 shadow-md` : 'text-gray-500 hover:bg-gray-50'}`}
              >
                  <div className={`p-2 rounded-full ${selectedCategory === cat.id ? 'bg-white/50' : 'bg-gray-100'}`}>
                      {cat.icon}
                  </div>
                  <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
              </button>
          ))}
        </div>

        {/* ZONE CENTRALE : Grille des produits filtrés */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
           <h2 className="text-lg font-bold text-gray-700 mb-4 px-2 flex items-center gap-2">
              {POS_CATEGORIES.find(c => c.id === selectedCategory)?.icon}
              {POS_CATEGORIES.find(c => c.id === selectedCategory)?.label}
           </h2>
           
           {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 auto-rows-fr">
                  {displayedProducts.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-400 hover:shadow-md transition-all active:scale-95 flex flex-col justify-between h-32 group">
                      <div className="flex justify-between items-start w-full">
                          <h3 className="font-bold text-gray-700 text-left leading-tight group-hover:text-orange-600">{p.name}</h3>
                          <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded text-xs whitespace-nowrap">{p.price.toFixed(2)} €</span>
                      </div>
                      <div className="text-xs text-gray-400 text-left line-clamp-2 mt-2">
                           {p.ingredients && p.ingredients.length > 0 ? p.ingredients.join(', ') : '...'}
                      </div>
                  </button>
                  ))}
              </div>
           ) : (
               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                   <Search size={48} className="mb-4 opacity-20"/>
                   <p>Aucun produit dans cette catégorie.</p>
               </div>
           )}
        </div>
        
        {/* SIDEBAR DROITE : Panier et Actions */}
        <div className="w-96 bg-white border-l flex flex-col shadow-2xl z-20">
           <div className="p-4 border-b bg-gray-50">
              <h2 className="font-bold text-lg flex items-center gap-2 text-gray-700"><ShoppingCart size={20}/> Panier</h2>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {cart.length === 0 && (
                  <div className="text-center text-gray-400 italic mt-10">Ajoutez des produits...</div>
              )}
              {cart.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 shadow-sm animate-in slide-in-from-right-5 fade-in duration-200">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-gray-800">{item.name}</span>
                      <span className="text-xs text-gray-500">{(item.price * (item.quantity || 1)).toFixed(2)}€</span>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => removeFromCart(item)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-500 font-bold"><Minus size={14}/></button>
                        <span className="font-bold text-sm w-4 text-center">{item.quantity || 1}</span>
                        <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-green-500 font-bold"><Plus size={14}/></button>
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="p-6 border-t bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
               <div className="flex justify-between items-end mb-4">
                   <span className="text-gray-500">Total à payer</span>
                   <span className="text-3xl font-bold text-gray-800">{totalAmount.toFixed(2)} €</span>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => { if(onSendOrder) onSendOrder(); }}
                    disabled={cart.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow active:scale-95 transition-all"
                   >
                       Envoyer
                   </button>

                   <button 
                    onClick={() => onPay(totalAmount, cart)}
                    disabled={cart.length === 0}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow active:scale-95 transition-all"
                   >
                       Encaisser
                   </button>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
}
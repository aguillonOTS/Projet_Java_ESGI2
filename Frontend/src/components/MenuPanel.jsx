import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config'; // <--- IMPORTANT
import { Pizza, Trash2, Plus, Save, X, ChefHat, Wine, Beer, GlassWater } from 'lucide-react';

const MENU_TABS = [
    { id: 'ALL', label: 'Tout' },
    { id: 'PIZZA', label: 'Pizzas' },
    { id: 'PASTA', label: 'Pâtes' },
    { id: 'DESSERT', label: 'Desserts' },
    { id: 'SOFT', label: 'Softs' },
    { id: 'BEER', label: 'Bières' },
    { id: 'WINE_RED', label: 'Vin Rouge' },
    { id: 'WINE_WHITE', label: 'Vin Blanc' },
    { id: 'WINE_ROSE', label: 'Vin Rosé' }
];

export default function MenuPanel() {
    const [products, setProducts] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    
    // Formulaire
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newProduct, setNewProduct] = useState({ id: '', name: '', type: 'DISH', price: 0, ingredients: [] });
    const [recipeBuffer, setRecipeBuffer] = useState([]); 
    const [selectedIngId, setSelectedIngId] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            // Utilisation des ENDPOINTS importés
            const [p, i] = await Promise.all([
                axios.get(ENDPOINTS.PRODUCTS),
                axios.get(ENDPOINTS.INGREDIENTS)
            ]);
            setProducts(p.data);
            setIngredients(i.data);
        } catch(e) { console.error("Erreur chargement menu:", e); }
    };

    const handleEditClick = (product) => {
        setIsEditing(true);
        setNewProduct({ ...product });
        // Reconstruction des objets ingrédients pour l'affichage
        const reconstructedBuffer = product.ingredients ? product.ingredients.map(name => {
            return ingredients.find(i => i.name === name) || { name: name, unitPrice: 0 };
        }) : [];
        setRecipeBuffer(reconstructedBuffer);
        setShowForm(true);
    };

    const handleCreateClick = () => {
        setIsEditing(false);
        setNewProduct({ id: '', name: '', type: 'DISH', price: 0, ingredients: [] });
        setRecipeBuffer([]);
        setShowForm(true);
    };

    const handleSave = () => {
        // Préparation de l'objet propre pour le backend
        const productToSave = {
            ...newProduct,
            // Si c'est une création, on laisse l'ID null ou on le génère (le Service Backend gère aussi)
            id: isEditing ? newProduct.id : undefined, 
            ingredients: recipeBuffer.map(i => i.name),
            status: "VALIDATED",
            vat: 0.10, 
            isAlcoholic: newProduct.type === 'DRINK'
        };

        axios.post(ENDPOINTS.PRODUCTS, productToSave)
            .then((res) => {
                // On utilise la réponse du serveur pour mettre à jour la liste (ID généré, etc.)
                const saved = res.data;
                if (isEditing) {
                    setProducts(products.map(p => p.id === saved.id ? saved : p));
                } else {
                    setProducts([...products, saved]);
                }
                setShowForm(false);
            })
            .catch(err => alert("Erreur sauvegarde : " + err));
    };

    const handleDeleteProduct = (id) => {
        if(!window.confirm("Supprimer ce produit ?")) return;
        axios.delete(`${ENDPOINTS.PRODUCTS}/${id}`)
            .then(() => setProducts(products.filter(p => p.id !== id)))
            .catch(err => console.error(err));
    };

    // --- FILTRAGE ---
    const filteredProducts = products.filter(p => {
        if (activeTab === 'ALL') return true;
        const name = p.name ? p.name.toUpperCase() : '';
        const type = p.type;

        switch (activeTab) {
            case 'PIZZA': return type === 'DISH' && name.includes('PIZZA');
            case 'PASTA': return type === 'DISH' && (name.includes('PASTA') || name.includes('LASAGNE') || name.includes('TAGLIATELLE'));
            case 'DESSERT': return type === 'DISH' && (name.includes('DESSERT') || name.includes('GLACE') || name.includes('TIRAMISU') || name.includes('PANNA'));
            case 'SOFT': return type === 'DRINK' && !p.isAlcoholic;
            case 'BEER': return type === 'DRINK' && (name.includes('BIÈRE') || name.includes('HEINEKEN') || name.includes('PERONI'));
            case 'WINE_RED': return type === 'DRINK' && (name.includes('ROUGE') || name.includes('CHIANTI') || name.includes('BORDEAUX'));
            case 'WINE_WHITE': return type === 'DRINK' && (name.includes('BLANC') || name.includes('CHABLIS'));
            case 'WINE_ROSE': return type === 'DRINK' && (name.includes('ROSÉ') || name.includes('PROVENCE'));
            default: return false;
        }
    });

    const currentCost = recipeBuffer.reduce((acc, i) => acc + (i.unitPrice || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex overflow-x-auto bg-white rounded-lg p-1 shadow-sm border max-w-4xl no-scrollbar">
                    {MENU_TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button onClick={handleCreateClick} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow font-bold whitespace-nowrap">
                    <Plus size={18} /> Nouveau
                </button>
            </div>

            {/* FORMULAIRE (MODALE) */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-orange-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-xl flex items-center gap-2"><ChefHat/> {isEditing ? 'Modifier' : 'Créer'}</h3>
                            <button onClick={() => setShowForm(false)} className="hover:bg-orange-700 p-1 rounded"><X/></button>
                        </div>
                        
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Nom du produit</label>
                                    <input type="text" className="w-full border p-2 rounded" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Type</label>
                                        <select className="w-full border p-2 rounded" value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})}>
                                            <option value="DISH">Plat</option>
                                            <option value="DRINK">Boisson</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Prix Vente (€)</label>
                                        <input type="number" className="w-full border p-2 rounded font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold text-gray-500 mb-2 block">Recette / Ingrédients</label>
                                <div className="flex gap-2 mb-2">
                                    <select className="flex-1 border text-sm rounded" value={selectedIngId} onChange={e => setSelectedIngId(e.target.value)}>
                                        <option value="">Ajouter un ingrédient...</option>
                                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unitPrice}€)</option>)}
                                    </select>
                                    <button onClick={() => {
                                        const ing = ingredients.find(i => i.id === selectedIngId);
                                        if(ing) { setRecipeBuffer([...recipeBuffer, ing]); setSelectedIngId(''); }
                                    }} className="bg-blue-600 text-white px-3 rounded font-bold">+</button>
                                </div>
                                
                                <div className="h-32 overflow-y-auto bg-white border rounded p-2 mb-2">
                                    {recipeBuffer.map((ing, idx) => (
                                        <div key={idx} className="flex justify-between text-sm border-b py-1">
                                            <span>{ing.name}</span>
                                            <button onClick={() => {
                                                const newBuf = [...recipeBuffer]; newBuf.splice(idx, 1); setRecipeBuffer(newBuf);
                                            }} className="text-red-500 hover:bg-red-50 rounded"><X size={14}/></button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between text-sm pt-2 border-t font-bold">
                                    <span>Coût matière: {currentCost.toFixed(2)}€</span>
                                    <span className={newProduct.price < currentCost * 3 ? "text-red-500" : "text-green-600"}>
                                        Marge x3: {(currentCost * 3).toFixed(2)}€
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 flex justify-end">
                            <button onClick={handleSave} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2">
                                <Save size={18}/> Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GRILLE PRODUITS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-[600px] overflow-y-auto content-start pr-2">
                {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => handleEditClick(p)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-400 cursor-pointer group transition-all flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${p.type === 'DISH' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {p.type === 'DISH' ? <Pizza size={20}/> : p.isAlcoholic ? <Wine size={20}/> : <GlassWater size={20}/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 group-hover:text-orange-600">{p.name}</h4>
                                <p className="text-xs text-gray-400 line-clamp-1">{p.ingredients?.join(', ') || 'Aucun ingrédient'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-lg bg-gray-50 px-2 py-1 rounded">{p.price} €</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
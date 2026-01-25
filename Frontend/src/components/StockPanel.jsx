import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config'; // <--- IMPORTANT
import { AlertTriangle, CheckCircle, RefreshCw, Package, ChevronDown, ChevronRight, Plus, Trash2, PenLine, Save } from 'lucide-react';

const CATEGORY_LABELS = {
    'BASES_PIZZA': 'Bases & Pâtes',
    'FROMAGE': 'Crèmerie & Fromages',
    'CHARCUTERIE': 'Viandes & Charcuteries',
    'LEGUME': 'Fruits & Légumes',
    'EPICERIE': 'Épicerie Sèche',
    'SOFT': 'Boissons Softs',
    'ALCOOL': 'Bières & Cidres',
    'CAVE': 'Cave à Vins',
    'AUTRE': 'Autres'
};

export default function StockPanel() {
    const [ingredients, setIngredients] = useState([]);
    const [collapsed, setCollapsed] = useState({});
    
    // État Formulaire
    const [showForm, setShowForm] = useState(false);
    const [editingIng, setEditingIng] = useState(null);
    const [formData, setFormData] = useState({ id: '', name: '', stock: 0, unitPrice: 0, unit: 'kg', category: 'EPICERIE' });

    useEffect(() => { fetchIngredients(); }, []);

    const fetchIngredients = () => {
        axios.get(ENDPOINTS.INGREDIENTS).then(res => setIngredients(res.data)).catch(console.error);
    };

    const handleSave = () => {
        const payload = { 
            ...formData, 
            id: editingIng ? formData.id : undefined // Laissez le backend générer l'ID si null
        };
        
        axios.post(ENDPOINTS.INGREDIENTS, payload)
            .then(() => {
                fetchIngredients();
                setShowForm(false);
            })
            .catch(err => alert("Erreur sauvegarde : " + err));
    };

    const handleDelete = (id) => {
        if(!window.confirm("Supprimer définitivement cet ingrédient ?")) return;
        axios.delete(`${ENDPOINTS.INGREDIENTS}/${id}`)
            .then(() => fetchIngredients())
            .catch(err => alert("Erreur suppression : " + err));
    };

    const openNewForm = () => {
        setEditingIng(null);
        setFormData({ id: '', name: '', stock: 0, unitPrice: 0, unit: 'kg', category: 'EPICERIE' });
        setShowForm(true);
    };

    const openEditForm = (ing) => {
        setEditingIng(ing);
        setFormData({ ...ing });
        setShowForm(true);
    };

    const handleQuickStock = (ing, qty) => {
        const updated = { ...ing, stock: parseFloat(ing.stock) + parseFloat(qty) };
        axios.post(ENDPOINTS.INGREDIENTS, updated).then(fetchIngredients);
    };

    // Groupement par catégorie
    const groupedIngredients = ingredients.reduce((acc, ing) => {
        const cat = ing.category || 'AUTRE';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(ing);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="text-orange-600"/> Gestion des Stocks
                </h2>
                <div className="flex gap-2">
                    <button onClick={fetchIngredients} className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded font-bold"><RefreshCw size={18}/></button>
                    <button onClick={openNewForm} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow font-bold flex items-center gap-2">
                        <Plus size={18}/> Nouvel Article
                    </button>
                </div>
            </div>

            {/* MODALE FORMULAIRE */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4">{editingIng ? 'Modifier' : 'Ajouter'} un ingrédient</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-gray-500">Nom</label>
                                <input type="text" className="w-full border p-2 rounded focus:border-orange-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Catégorie</label>
                                <select className="w-full border p-2 rounded bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {Object.keys(CATEGORY_LABELS).map(k => <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Unité</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Stock Actuel</label>
                                <input type="number" className="w-full border p-2 rounded" value={formData.stock} onChange={e => setFormData({...formData, stock: parseFloat(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Prix Unitaire (€)</label>
                                <input type="number" className="w-full border p-2 rounded" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value)})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Annuler</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2"><Save size={18}/> Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LISTE DES STOCKS */}
            {Object.keys(groupedIngredients).length === 0 && <div className="text-center text-gray-400 p-10">Aucun ingrédient en stock.</div>}
            
            {Object.keys(groupedIngredients).map(catKey => {
                const isClosed = collapsed[catKey];
                return (
                    <div key={catKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div 
                            onClick={() => setCollapsed(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                            className="bg-slate-50 p-4 border-b flex items-center justify-between cursor-pointer hover:bg-slate-100 select-none"
                        >
                            <div className="flex items-center gap-3">
                                {isClosed ? <ChevronRight size={20}/> : <ChevronDown size={20}/>}
                                <span className="font-bold text-slate-700 uppercase tracking-wider text-sm">{CATEGORY_LABELS[catKey] || catKey}</span>
                                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">{groupedIngredients[catKey].length} réf.</span>
                            </div>
                        </div>
                        
                        {!isClosed && (
                            <table className="w-full text-left">
                                <thead className="bg-white text-gray-400 text-xs uppercase border-b">
                                    <tr>
                                        <th className="p-3 pl-10">Ingrédient</th>
                                        <th className="p-3">Coût</th>
                                        <th className="p-3 text-center">Stock</th>
                                        <th className="p-3 text-center">État</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {groupedIngredients[catKey].map(ing => (
                                        <tr key={ing.id} className="hover:bg-blue-50/30 group transition-colors">
                                            <td className="p-3 pl-10 font-bold text-gray-700">{ing.name}</td>
                                            <td className="p-3 text-gray-500 text-sm">{ing.unitPrice} € / {ing.unit}</td>
                                            <td className="p-3 text-center font-mono font-bold">{ing.stock}</td>
                                            <td className="p-3 text-center">
                                                {ing.stock < 15 ? <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold"><AlertTriangle size={12}/> Bas</span> : <span className="text-green-600"><CheckCircle size={16}/></span>}
                                            </td>
                                            <td className="p-3 flex justify-end gap-2 items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleQuickStock(ing, 10)} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-200">+10</button>
                                                <button onClick={() => openEditForm(ing)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><PenLine size={16}/></button>
                                                <button onClick={() => handleDelete(ing.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config';
import { UserCheck, UserPlus, Trash2, PenLine, Phone, MapPin, Star, Save, X, Search } from 'lucide-react';

export default function CustomersPanel() {
    const [customers, setCustomers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const emptyCustomer = { id: '', name: '', phone: '', address: '', city: '' };
    const [formData, setFormData] = useState(emptyCustomer);

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = () => {
        axios.get(ENDPOINTS.CUSTOMERS).then(res => setCustomers(res.data)).catch(console.error);
    };

    const handleSave = () => {
        if (!formData.name || !formData.phone) return alert("Nom et téléphone obligatoires");
        const payload = { ...formData, id: editingCustomer ? formData.id : undefined };
        axios.post(ENDPOINTS.CUSTOMERS, payload)
            .then(() => { fetchCustomers(); setShowForm(false); })
            .catch(err => alert("Erreur : " + err));
    };

    const handleDelete = (id) => {
        if (!window.confirm("Supprimer ce client ?")) return;
        axios.delete(`${ENDPOINTS.CUSTOMERS}/${id}`).then(fetchCustomers).catch(console.error);
    };

    const openEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({ ...customer });
        setShowForm(true);
    };

    const openNew = () => {
        setEditingCustomer(null);
        setFormData(emptyCustomer);
        setShowForm(true);
    };

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserCheck className="text-orange-600"/> Base Clients
                </h2>
                <button onClick={openNew} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow font-bold flex items-center gap-2">
                    <UserPlus size={18}/> Nouveau Client
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input
                    type="text"
                    placeholder="Rechercher par nom, téléphone, ville..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:border-orange-500 outline-none bg-white"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* FORMULAIRE MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-6 border-b pb-2">
                            <h3 className="text-xl font-bold">{editingCustomer ? 'Modifier le client' : 'Nouveau client'}</h3>
                            <button onClick={() => setShowForm(false)} className="hover:bg-gray-100 p-1 rounded"><X/></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500">Nom complet *</label>
                                <input type="text" className="w-full border p-2 rounded focus:border-orange-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Téléphone *</label>
                                <input type="tel" className="w-full border p-2 rounded focus:border-orange-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="06 12 34 56 78" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Adresse</label>
                                <input type="text" className="w-full border p-2 rounded focus:border-orange-500 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Ville</label>
                                <input type="text" className="w-full border p-2 rounded focus:border-orange-500 outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button onClick={handleSave} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 flex justify-center items-center gap-2">
                                <Save size={18}/> Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LISTE CLIENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-3 text-center text-gray-400 italic p-12 bg-white rounded-xl border">
                        {searchQuery ? "Aucun client trouvé." : "Aucun client enregistré. Créez-en un !"}
                    </div>
                ) : filtered.map(c => (
                    <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                                <UserCheck size={20}/>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-100 rounded text-blue-600"><PenLine size={16}/></button>
                                <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded text-red-600"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-gray-800">{c.name}</h3>

                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                            <p className="flex items-center gap-2"><Phone size={13}/> {c.phone}</p>
                            {c.city && <p className="flex items-center gap-2"><MapPin size={13}/> {c.city}</p>}
                        </div>

                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                            <span className="text-xs text-gray-400">Points fidélité</span>
                            <span className="flex items-center gap-1 font-bold text-orange-600">
                                <Star size={14}/> {c.loyaltyPoints || 0} pts
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

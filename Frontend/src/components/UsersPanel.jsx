import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config'; // <--- IMPORTANT
import { Users, UserPlus, Trash2, PenLine, Shield, ShieldAlert, KeyRound, Save, X } from 'lucide-react';

export default function UsersPanel() {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Modèle vierge
    const emptyUser = { 
        id: '', firstName: '', lastName: '', role: 'SERVER', pinCode: '', 
        permissions: { manage_stock: false, manage_menu: false, manage_users: false, cash_out: true }
    };
    const [formData, setFormData] = useState(emptyUser);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = () => {
        axios.get(ENDPOINTS.SALESPERSONS).then(res => setUsers(res.data)).catch(console.error);
    };

    const handleRoleChange = (e) => {
        const role = e.target.value;
        // Définition automatique des permissions selon le rôle
        const perms = {
            manage_stock: role === 'ADMIN',
            manage_menu: role === 'ADMIN',
            manage_users: role === 'ADMIN',
            cash_out: true
        };
        setFormData({ ...formData, role: role, permissions: perms });
    };

    const handleSave = () => {
        if(!formData.firstName || !formData.pinCode) return alert("Nom et Code PIN obligatoires");

        const payload = {
            ...formData,
            id: editingUser ? formData.id : undefined, // Laissez le backend générer
            isActive: true
        };

        axios.post(ENDPOINTS.SALESPERSONS, payload)
            .then(() => {
                fetchUsers();
                setShowForm(false);
            })
            .catch(err => alert("Erreur: " + err));
    };

    const handleDelete = (id) => {
        if(!window.confirm("Supprimer cet utilisateur ?")) return;
        axios.delete(`${ENDPOINTS.SALESPERSONS}/${id}`)
            .then(fetchUsers)
            .catch(console.error);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({ ...user });
        setShowForm(true);
    };

    const openNew = () => {
        setEditingUser(null);
        setFormData(emptyUser);
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-orange-600"/> Gestion de l'Équipe
                </h2>
                <button onClick={openNew} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow font-bold flex items-center gap-2">
                    <UserPlus size={18}/> Nouveau Membre
                </button>
            </div>

            {/* FORMULAIRE MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b pb-2">
                            <h3 className="text-xl font-bold">{editingUser ? 'Modifier le membre' : 'Recruter un membre'}</h3>
                            <button onClick={() => setShowForm(false)} className="hover:bg-gray-100 p-1 rounded"><X/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Prénom</label>
                                    <input type="text" className="w-full border p-2 rounded focus:border-orange-500 outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Nom</label>
                                    <input type="text" className="w-full border p-2 rounded focus:border-orange-500 outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500">Rôle (Définit les droits)</label>
                                <select className="w-full border p-2 rounded bg-white" value={formData.role} onChange={handleRoleChange}>
                                    <option value="SERVER">Serveur (Caisse uniquement)</option>
                                    <option value="ADMIN">Manager (Accès complet)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1"><KeyRound size={12}/> Code PIN (Connexion)</label>
                                <input type="text" maxLength="4" className="w-full border p-2 rounded font-mono tracking-widest text-center text-xl font-bold bg-gray-50 focus:border-orange-500 outline-none" value={formData.pinCode} onChange={e => setFormData({...formData, pinCode: e.target.value})} />
                            </div>

                            <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                                <strong>Droits actuels :</strong>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Encaisser les clients</li>
                                    {formData.permissions.manage_stock && <li>Gérer les stocks</li>}
                                    {formData.permissions.manage_menu && <li>Modifier la carte</li>}
                                    {formData.permissions.manage_users && <li>Gérer l'équipe</li>}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={handleSave} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 flex justify-center items-center gap-2">
                                <Save size={18}/> Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LISTE UTILISATEURS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {u.role === 'ADMIN' ? <ShieldAlert size={24}/> : <Shield size={24}/>}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(u)} className="p-2 hover:bg-gray-100 rounded text-blue-600"><PenLine size={18}/></button>
                                {u.id !== 'admin-01' && (
                                    <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 rounded text-red-600"><Trash2 size={18}/></button>
                                )}
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-xl text-gray-800">{u.firstName} {u.lastName}</h3>
                        <p className="text-sm text-gray-400 font-bold mb-4">{u.role === 'ADMIN' ? 'MANAGER' : 'SERVEUR'}</p>
                        
                        <div className="bg-gray-50 p-2 rounded flex justify-between items-center text-sm">
                            <span className="text-gray-500">Code PIN</span>
                            <span className="font-mono font-bold tracking-widest bg-white px-2 rounded border">••••</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
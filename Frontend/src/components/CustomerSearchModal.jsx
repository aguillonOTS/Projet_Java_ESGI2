import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config';
import { X, Search, Star, UserPlus, Percent, Euro, ChevronRight, UserX, Zap, Users } from 'lucide-react';

/**
 * Modal intercalée entre "Encaisser" et le choix de paiement.
 *
 * UX :
 * - Annuaire de tous les clients, triés A-Z, avec index alphabétique
 * - Recherche filtrante en temps réel (nom, prénom, téléphone)
 * - Clic sur un client → sélection → section remise / fidélité
 * - Création rapide d'un nouveau client
 */
export default function CustomerSearchModal({ subtotal, onConfirm, onClose }) {

    // --- Config fidélité depuis l'API ---
    const [loyaltyConfig, setLoyaltyConfig] = useState(null);

    // --- Annuaire complet ---
    const [allCustomers, setAllCustomers] = useState([]);
    const [loadingList, setLoadingList] = useState(true);

    // --- Recherche / filtre ---
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef(null);

    // --- Client sélectionné ---
    const [customer, setCustomer] = useState(null);

    // --- Création rapide ---
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    // --- Fidélité ---
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    // --- Remise manuelle ---
    const [discountType, setDiscountType] = useState('PERCENT');
    const [discountValue, setDiscountValue] = useState('');

    // Refs pour scroll alphabétique
    const letterRefs = useRef({});

    // =================== CHARGEMENTS ===================

    useEffect(() => {
        // Config fidélité
        axios.get(`${ENDPOINTS.CUSTOMERS}/loyalty-config`)
            .then(res => setLoyaltyConfig(res.data))
            .catch(() => setLoyaltyConfig({
                pointsPerEuro: 1, redemptionStep: 100,
                discountPerRedemption: 5, autoDiscountRate: 5, autoDiscountThreshold: 20
            }));

        // Tous les clients
        axios.get(ENDPOINTS.CUSTOMERS)
            .then(res => setAllCustomers(res.data))
            .catch(() => setAllCustomers([]))
            .finally(() => setLoadingList(false));

        // Focus sur la recherche à l'ouverture
        setTimeout(() => searchRef.current?.focus(), 50);
    }, []);

    // =================== CALCULS ===================

    const redemptionStep        = loyaltyConfig?.redemptionStep        ?? 100;
    const discountPerStep       = loyaltyConfig?.discountPerRedemption ?? 5;
    const autoDiscountRate      = loyaltyConfig?.autoDiscountRate      ?? 5;
    const autoDiscountThreshold = loyaltyConfig?.autoDiscountThreshold ?? 20;

    const loyaltyDiscount = customer
        ? (pointsToRedeem / redemptionStep) * discountPerStep : 0;

    const manualDiscount = (() => {
        const v = parseFloat(discountValue) || 0;
        if (discountType === 'PERCENT') return Math.min(subtotal * v / 100, subtotal);
        return Math.min(v, subtotal);
    })();

    const totalDiscount = Math.min(loyaltyDiscount + manualDiscount, subtotal);
    const finalTotal    = Math.max(subtotal - totalDiscount, 0);

    const autoDiscountApplies = loyaltyConfig && subtotal > autoDiscountThreshold && totalDiscount === 0;
    const autoDiscountAmount  = autoDiscountApplies ? +(subtotal * autoDiscountRate / 100).toFixed(2) : 0;

    const maxRedeemable = customer
        ? Math.floor(customer.loyaltyPoints / redemptionStep) * redemptionStep : 0;

    // =================== FILTRE + TRI A-Z ===================

    const filteredCustomers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return allCustomers
            .filter(c => {
                if (!q) return true;
                return (c.name  || '').toLowerCase().includes(q)
                    || (c.phone || '').includes(q);
            })
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }));
    }, [allCustomers, searchQuery]);

    // Groupement par première lettre pour l'index alphabétique
    const grouped = useMemo(() => {
        const map = {};
        for (const c of filteredCustomers) {
            const letter = (c.name || '?')[0].toUpperCase();
            if (!map[letter]) map[letter] = [];
            map[letter].push(c);
        }
        return map;
    }, [filteredCustomers]);

    const letters = Object.keys(grouped).sort();

    // =================== HANDLERS ===================

    const handleSelectCustomer = (c) => {
        setCustomer(c);
        setPointsToRedeem(0);
        setSearchQuery('');
    };

    const handleClearCustomer = () => {
        setCustomer(null);
        setPointsToRedeem(0);
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    const handleCreateCustomer = () => {
        if (!newName.trim() || !newPhone.trim()) return alert("Nom et téléphone obligatoires");
        axios.post(ENDPOINTS.CUSTOMERS, { name: newName.trim(), phone: newPhone.trim() })
            .then(res => {
                setAllCustomers(prev => [...prev, res.data]);
                setCustomer(res.data);
                setShowCreate(false);
                setNewName(''); setNewPhone('');
            })
            .catch(() => alert("Erreur lors de la création du client"));
    };

    const scrollToLetter = (letter) => {
        letterRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const buildDiscountReason = () => {
        const parts = [];
        if (loyaltyDiscount > 0) parts.push(`Fidélité: ${pointsToRedeem} pts (-${loyaltyDiscount.toFixed(2)}€)`);
        if (manualDiscount > 0) {
            parts.push(discountType === 'PERCENT'
                ? `Remise ${discountValue}% (-${manualDiscount.toFixed(2)}€)`
                : `Remise fixe (-${manualDiscount.toFixed(2)}€)`);
        }
        return parts.join(' + ') || null;
    };

    const handleConfirm = () => {
        const doConfirm = () => onConfirm({
            customer: customer || null,
            discountAmount: totalDiscount,
            discountReason: buildDiscountReason(),
            finalTotal
        });
        if (customer && pointsToRedeem > 0) {
            axios.post(`${ENDPOINTS.CUSTOMERS}/${customer.id}/redeem`, { points: pointsToRedeem })
                .then(doConfirm)
                .catch(() => alert("Erreur lors de l'utilisation des points"));
        } else {
            doConfirm();
        }
    };

    const handleSkip = () => onConfirm({
        customer: null, discountAmount: 0, discountReason: null, finalTotal: subtotal
    });

    // =================== RENDER ===================

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* ── HEADER ── */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Users size={20} className="text-orange-600"/> Client & Réductions
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={18}/>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">

                    {/* ══════════════════════════════════════
                        COLONNE GAUCHE — Annuaire + recherche
                    ══════════════════════════════════════ */}
                    <div className="w-72 border-r flex flex-col shrink-0">

                        {/* Barre de recherche */}
                        <div className="p-3 border-b bg-gray-50 shrink-0">
                            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 focus-within:border-orange-500 transition-colors">
                                <Search size={15} className="text-gray-400 shrink-0"/>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Nom, prénom ou téléphone..."
                                    className="flex-1 outline-none text-sm bg-transparent"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                                        <X size={13}/>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Liste des clients */}
                        <div className="flex-1 overflow-y-auto">
                            {loadingList ? (
                                <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                                    Chargement...
                                </div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-sm gap-2">
                                    <Users size={28} className="opacity-20"/>
                                    {searchQuery ? 'Aucun résultat' : 'Aucun client enregistré'}
                                </div>
                            ) : (
                                <div>
                                    {letters.map(letter => (
                                        <div key={letter}>
                                            {/* Séparateur lettre */}
                                            <div
                                                ref={el => letterRefs.current[letter] = el}
                                                className="px-3 py-1 bg-gray-100 text-xs font-bold text-gray-500 uppercase sticky top-0 z-10"
                                            >
                                                {letter}
                                            </div>

                                            {/* Clients de cette lettre */}
                                            {grouped[letter].map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-orange-50 transition-colors border-b border-gray-50 ${customer?.id === c.id ? 'bg-orange-100 border-l-4 border-l-orange-500' : ''}`}
                                                >
                                                    {/* Avatar initiales */}
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {(c.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-gray-800 truncate">{c.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{c.phone}</p>
                                                    </div>
                                                    {c.loyaltyPoints > 0 && (
                                                        <span className="flex items-center gap-0.5 text-xs text-amber-600 font-bold shrink-0">
                                                            <Star size={10}/> {c.loyaltyPoints}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bouton créer client */}
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full p-3 flex items-center gap-2 text-sm text-orange-600 font-bold hover:bg-orange-50 transition-colors border-t"
                            >
                                <UserPlus size={16}/> Nouveau client
                            </button>
                        </div>

                        {/* Index alphabétique (barre latérale) */}
                        {letters.length > 5 && (
                            <div className="absolute right-[calc(100%-72px+4px)] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-20 hidden">
                                {letters.map(l => (
                                    <button key={l} onClick={() => scrollToLetter(l)}
                                        className="text-[10px] font-bold text-gray-400 hover:text-orange-600 w-4 text-center leading-none">
                                        {l}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════
                        COLONNE DROITE — Remises + résumé
                    ══════════════════════════════════════ */}
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <div className="p-4 space-y-4 flex-1">

                            {/* Client sélectionné */}
                            {customer ? (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold">
                                            {(customer.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-green-800">{customer.name}</p>
                                            <p className="text-xs text-green-600">{customer.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 font-bold text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded-lg">
                                            <Star size={13}/> {customer.loyaltyPoints} pts
                                        </span>
                                        <button onClick={handleClearCustomer} className="p-1.5 hover:bg-red-100 rounded-lg text-red-400 transition-colors">
                                            <UserX size={16}/>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-400">
                                    Sélectionnez un client dans la liste
                                </div>
                            )}

                            {/* Formulaire création rapide */}
                            {showCreate && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold text-orange-700">Nouveau client</p>
                                        <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                                            <X size={14}/>
                                        </button>
                                    </div>
                                    <input type="text" placeholder="Nom complet *"
                                        className="w-full border p-2 rounded-lg text-sm focus:border-orange-500 outline-none bg-white"
                                        value={newName} onChange={e => setNewName(e.target.value)}/>
                                    <input type="tel" placeholder="Téléphone *"
                                        className="w-full border p-2 rounded-lg text-sm focus:border-orange-500 outline-none bg-white"
                                        value={newPhone} onChange={e => setNewPhone(e.target.value)}/>
                                    <button onClick={handleCreateCustomer}
                                        className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors">
                                        Créer & sélectionner
                                    </button>
                                </div>
                            )}

                            {/* Fidélité */}
                            {customer && customer.loyaltyPoints >= redemptionStep && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-xs font-bold text-amber-700 uppercase mb-2">Points fidélité</p>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-amber-800">
                                            <strong>{customer.loyaltyPoints}</strong> pts disponibles
                                            <span className="text-xs ml-1 text-amber-500">({redemptionStep} pts = {discountPerStep}€)</span>
                                        </span>
                                        <span className="text-sm font-bold text-amber-700">
                                            {loyaltyDiscount > 0 ? `-${loyaltyDiscount.toFixed(2)} €` : '0 €'}
                                        </span>
                                    </div>
                                    <input type="range" min={0} max={maxRedeemable} step={redemptionStep} value={pointsToRedeem}
                                        onChange={e => setPointsToRedeem(Number(e.target.value))}
                                        className="w-full accent-orange-500"/>
                                    <div className="flex justify-between text-xs text-amber-500 mt-1">
                                        <span>0</span>
                                        <span className="font-bold text-amber-700">{pointsToRedeem} pts utilisés</span>
                                        <span>{maxRedeemable} max</span>
                                    </div>
                                </div>
                            )}

                            {/* Remise manuelle */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Remise manuelle</p>
                                <div className="flex gap-2">
                                    <div className="flex border rounded-lg overflow-hidden shrink-0">
                                        <button onClick={() => setDiscountType('PERCENT')}
                                            className={`px-3 py-2 flex items-center gap-1 text-sm font-bold transition-colors ${discountType === 'PERCENT' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                                            <Percent size={13}/> %
                                        </button>
                                        <button onClick={() => setDiscountType('FIXED')}
                                            className={`px-3 py-2 flex items-center gap-1 text-sm font-bold transition-colors ${discountType === 'FIXED' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                                            <Euro size={13}/> €
                                        </button>
                                    </div>
                                    <input type="number" min={0}
                                        max={discountType === 'PERCENT' ? 100 : subtotal}
                                        step={discountType === 'PERCENT' ? 5 : 0.5}
                                        placeholder={discountType === 'PERCENT' ? 'ex: 10' : 'ex: 5.00'}
                                        className="flex-1 border p-2 rounded-lg text-sm focus:border-orange-500 outline-none"
                                        value={discountValue} onChange={e => setDiscountValue(e.target.value)}/>
                                    {discountValue && (
                                        <span className="flex items-center px-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg whitespace-nowrap">
                                            -{manualDiscount.toFixed(2)} €
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hint remise auto */}
                            {autoDiscountApplies && (
                                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                                    <Zap size={15} className="shrink-0 mt-0.5"/>
                                    <span>
                                        <strong>Remise automatique {autoDiscountRate}%</strong> sera appliquée
                                        (sous-total &gt; {autoDiscountThreshold}€) — soit <strong>-{autoDiscountAmount.toFixed(2)} €</strong>
                                    </span>
                                </div>
                            )}

                            {/* Récapitulatif */}
                            <div className="bg-gray-50 rounded-xl p-4 border space-y-1 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Sous-total</span>
                                    <span>{subtotal.toFixed(2)} €</span>
                                </div>
                                {loyaltyDiscount > 0 && (
                                    <div className="flex justify-between text-amber-600">
                                        <span>Fidélité ({pointsToRedeem} pts)</span>
                                        <span>-{loyaltyDiscount.toFixed(2)} €</span>
                                    </div>
                                )}
                                {manualDiscount > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>Remise manuelle</span>
                                        <span>-{manualDiscount.toFixed(2)} €</span>
                                    </div>
                                )}
                                {autoDiscountApplies && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span className="flex items-center gap-1"><Zap size={11}/> Auto {autoDiscountRate}%</span>
                                        <span>-{autoDiscountAmount.toFixed(2)} €</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t mt-1">
                                    <span>TOTAL</span>
                                    <span className="text-orange-600">
                                        {autoDiscountApplies
                                            ? (subtotal - autoDiscountAmount).toFixed(2)
                                            : finalTotal.toFixed(2)} €
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
                            <button onClick={handleSkip}
                                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-100 text-sm transition-colors">
                                Sans client
                            </button>
                            <button onClick={handleConfirm}
                                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors">
                                Continuer <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

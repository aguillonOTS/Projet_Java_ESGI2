import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config';
import { X, Search, Star, UserPlus, Percent, Euro, ChevronRight, UserX, Zap } from 'lucide-react';

/**
 * Modal intercalée entre "Encaisser" et le choix de paiement.
 * Permet d'associer un client, d'utiliser ses points de fidélité
 * et d'appliquer une remise manuelle.
 *
 * Props :
 * - subtotal       : number — montant brut du panier
 * - onConfirm(data): appelé avec { customer, discountAmount, discountReason, finalTotal }
 * - onClose        : ferme la modal sans payer
 */
export default function CustomerSearchModal({ subtotal, onConfirm, onClose }) {

    // --- Config fidélité (chargée depuis l'API — aucune constante hardcodée) ---
    const [loyaltyConfig, setLoyaltyConfig] = useState(null);

    useEffect(() => {
        axios.get(`${ENDPOINTS.CUSTOMERS}/loyalty-config`)
            .then(res => setLoyaltyConfig(res.data))
            .catch(() => {
                // Fallback conservatif si l'API est indisponible
                setLoyaltyConfig({
                    pointsPerEuro: 1,
                    redemptionStep: 100,
                    discountPerRedemption: 5,
                    autoDiscountRate: 5,
                    autoDiscountThreshold: 20
                });
            });
    }, []);

    // --- Recherche client ---
    const [phoneInput, setPhoneInput] = useState('');
    const [customer, setCustomer] = useState(null);
    const [searching, setSearching] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // --- Création rapide ---
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    // --- Fidélité ---
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    // --- Remise manuelle ---
    const [discountType, setDiscountType] = useState('PERCENT'); // 'PERCENT' | 'FIXED'
    const [discountValue, setDiscountValue] = useState('');

    // --- Calculs dérivés (règles issues de la config backend) ---
    const redemptionStep       = loyaltyConfig?.redemptionStep       ?? 100;
    const discountPerStep      = loyaltyConfig?.discountPerRedemption ?? 5;
    const autoDiscountRate     = loyaltyConfig?.autoDiscountRate      ?? 5;
    const autoDiscountThreshold = loyaltyConfig?.autoDiscountThreshold ?? 20;

    const loyaltyDiscount = customer
        ? (pointsToRedeem / redemptionStep) * discountPerStep
        : 0;

    const manualDiscount = (() => {
        const v = parseFloat(discountValue) || 0;
        if (discountType === 'PERCENT') return Math.min(subtotal * v / 100, subtotal);
        return Math.min(v, subtotal);
    })();

    const totalDiscount = Math.min(loyaltyDiscount + manualDiscount, subtotal);
    const finalTotal = Math.max(subtotal - totalDiscount, 0);

    const maxRedeemable = customer
        ? Math.floor(customer.loyaltyPoints / redemptionStep) * redemptionStep
        : 0;

    // --- Handlers ---
    const handleSearch = () => {
        if (!phoneInput.trim()) return;
        setSearching(true);
        setNotFound(false);
        setCustomer(null);
        setPointsToRedeem(0);

        axios.get(`${ENDPOINTS.CUSTOMERS}/search`, { params: { phone: phoneInput.trim() } })
            .then(res => { setCustomer(res.data); setNewPhone(phoneInput.trim()); })
            .catch(() => { setNotFound(true); setNewPhone(phoneInput.trim()); })
            .finally(() => setSearching(false));
    };

    const handleCreateCustomer = () => {
        if (!newName.trim() || !newPhone.trim()) return alert("Nom et téléphone obligatoires");
        axios.post(ENDPOINTS.CUSTOMERS, { name: newName.trim(), phone: newPhone.trim() })
            .then(res => {
                setCustomer(res.data);
                setShowCreate(false);
                setNotFound(false);
            })
            .catch(() => alert("Erreur lors de la création du client"));
    };

    const handleClearCustomer = () => {
        setCustomer(null);
        setPhoneInput('');
        setNotFound(false);
        setPointsToRedeem(0);
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
        customer: null,
        discountAmount: 0,
        discountReason: null,
        finalTotal: subtotal
    });

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">Client & Réductions</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={18}/></button>
                </div>

                <div className="p-5 space-y-5">

                    {/* SECTION RECHERCHE CLIENT */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Associer un client (optionnel)</p>

                        {!customer ? (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        placeholder="Numéro de téléphone..."
                                        className="flex-1 border p-2 rounded-lg focus:border-orange-500 outline-none text-sm"
                                        value={phoneInput}
                                        onChange={e => setPhoneInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={searching}
                                        className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-sm font-bold"
                                    >
                                        <Search size={15}/> {searching ? '...' : 'Chercher'}
                                    </button>
                                </div>

                                {notFound && !showCreate && (
                                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-center justify-between">
                                        <span className="text-amber-700">Client introuvable.</span>
                                        <button
                                            onClick={() => setShowCreate(true)}
                                            className="text-orange-600 font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <UserPlus size={14}/> Créer
                                        </button>
                                    </div>
                                )}

                                {showCreate && (
                                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
                                        <p className="text-xs font-bold text-orange-700">Création rapide</p>
                                        <input
                                            type="text"
                                            placeholder="Nom complet *"
                                            className="w-full border p-2 rounded text-sm focus:border-orange-500 outline-none"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Téléphone *"
                                            className="w-full border p-2 rounded text-sm focus:border-orange-500 outline-none"
                                            value={newPhone}
                                            onChange={e => setNewPhone(e.target.value)}
                                        />
                                        <button
                                            onClick={handleCreateCustomer}
                                            className="w-full bg-orange-600 text-white py-2 rounded font-bold text-sm hover:bg-orange-700"
                                        >
                                            Créer le client
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-green-800">{customer.name}</p>
                                    <p className="text-xs text-green-600">{customer.phone}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 font-bold text-orange-600 text-sm">
                                        <Star size={14}/> {customer.loyaltyPoints} pts
                                    </span>
                                    <button onClick={handleClearCustomer} className="p-1 hover:bg-red-100 rounded text-red-400">
                                        <UserX size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION FIDÉLITÉ */}
                    {customer && customer.loyaltyPoints >= redemptionStep && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Utiliser des points fidélité</p>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-amber-800">
                                        Points disponibles : <strong>{customer.loyaltyPoints}</strong>
                                        <span className="text-xs ml-1">({redemptionStep} pts = {discountPerStep}€)</span>
                                    </span>
                                    <span className="text-sm font-bold text-amber-700">
                                        -{loyaltyDiscount.toFixed(2)} €
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={maxRedeemable}
                                    step={redemptionStep}
                                    value={pointsToRedeem}
                                    onChange={e => setPointsToRedeem(Number(e.target.value))}
                                    className="w-full accent-orange-500"
                                />
                                <div className="flex justify-between text-xs text-amber-600 mt-1">
                                    <span>0 pt</span>
                                    <span className="font-bold">{pointsToRedeem} pts utilisés</span>
                                    <span>{maxRedeemable} pts max</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION REMISE MANUELLE */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Remise manuelle</p>
                        <div className="flex gap-2">
                            <div className="flex border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setDiscountType('PERCENT')}
                                    className={`px-3 py-2 flex items-center gap-1 text-sm font-bold transition-colors ${discountType === 'PERCENT' ? 'bg-slate-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Percent size={14}/> %
                                </button>
                                <button
                                    onClick={() => setDiscountType('FIXED')}
                                    className={`px-3 py-2 flex items-center gap-1 text-sm font-bold transition-colors ${discountType === 'FIXED' ? 'bg-slate-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Euro size={14}/> €
                                </button>
                            </div>
                            <input
                                type="number"
                                min={0}
                                max={discountType === 'PERCENT' ? 100 : subtotal}
                                step={discountType === 'PERCENT' ? 5 : 0.5}
                                placeholder={discountType === 'PERCENT' ? 'ex: 10' : 'ex: 5.00'}
                                className="flex-1 border p-2 rounded-lg text-sm focus:border-orange-500 outline-none"
                                value={discountValue}
                                onChange={e => setDiscountValue(e.target.value)}
                            />
                            {discountValue && (
                                <span className="flex items-center px-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg whitespace-nowrap">
                                    -{manualDiscount.toFixed(2)} €
                                </span>
                            )}
                        </div>
                    </div>

                    {/* REMISE AUTOMATIQUE — hint affiché quand aucune autre remise n'est appliquée */}
                    {loyaltyConfig && subtotal > autoDiscountThreshold && totalDiscount === 0 && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                            <Zap size={15} className="shrink-0"/>
                            <span>
                                <strong>Remise automatique {autoDiscountRate}%</strong> sera appliquée par le serveur
                                (sous-total &gt; {autoDiscountThreshold}€) — soit <strong>-{(subtotal * autoDiscountRate / 100).toFixed(2)} €</strong>
                            </span>
                        </div>
                    )}

                    {/* RÉCAPITULATIF */}
                    <div className="bg-gray-50 rounded-xl p-4 border space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Sous-total</span>
                            <span>{subtotal.toFixed(2)} €</span>
                        </div>
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-amber-600">
                                <span>Remise fidélité ({pointsToRedeem} pts)</span>
                                <span>-{loyaltyDiscount.toFixed(2)} €</span>
                            </div>
                        )}
                        {manualDiscount > 0 && (
                            <div className="flex justify-between text-blue-600">
                                <span>Remise manuelle</span>
                                <span>-{manualDiscount.toFixed(2)} €</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t mt-2">
                            <span>TOTAL</span>
                            <span>{finalTotal.toFixed(2)} €</span>
                        </div>
                    </div>

                </div>

                {/* ACTIONS */}
                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-100 text-sm"
                    >
                        Passer sans client
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 flex items-center justify-center gap-2"
                    >
                        Continuer <ChevronRight size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
}

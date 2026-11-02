import React, { useState } from 'react';
import { buyFromShopUseCase, dailyOffers, type ShopEntry, type ShopTab } from '../../../application/ShopUseCases';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { ItemIcon } from './ItemIcon';

interface ShopModalProps
{
    isOpen: boolean;
    onClose: () => void;
}

type Tab = ShopTab | 'daily';

const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'seeds', icon: '🌱', label: 'ເມັດພືດ' },
    { id: 'potions', icon: '🧪', label: 'ຢາ & ອາຫານ' },
    { id: 'supplies', icon: '🎒', label: 'ຂອງໃຊ້' },
    { id: 'daily', icon: '⭐', label: 'ສິນຄ້າມື້ນີ້' },
];

const REASONS: Record<string, string> = {
    insufficient_materials: 'ວັດຖຸດິບບໍ່ພໍ',
    backpack_full: 'ກະເປົາເຕັມ',
    sold_out: 'ມື້ນີ້ຂາຍໝົດແລ້ວ',
};

/** Grandma Chanthy's shop: goods for Materials (barter). Credit is never asked for and never paid. */
export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) =>
{
    const [tab, setTab] = useState<Tab>('seeds');
    const [message, setMessage] = useState<string | null>(null);
    const [, setRevision] = useState(0);
    if (!isOpen) return null;

    const shop = getGameContent().shop;
    const dayCount = entities.worldTime.dayCount;
    const entries: ShopEntry[] = tab === 'daily' ? dailyOffers(shop, dayCount) : shop.stock[tab];
    const getItem = (id: string) => entities.itemCatalog.get(id);

    const handleBuy = (entry: ShopEntry) =>
    {
        const result = buyFromShopUseCase(entry, entities.backpack, entities.shopPurchases, dayCount);
        if (result.success)
        {
            soundManager.playPowerUp();
            setMessage(`ໄດ້ຮັບ ${getItem(entry.itemId)?.name ?? entry.itemId} ແລ້ວ`);
            EventBus.emit('backpack-changed');
        }
        else
        {
            soundManager.playHurt();
            setMessage(REASONS[result.reason]);
        }
        setRevision(r => r + 1);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" data-testid="shop-modal">
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🌿</span>
                        <div>
                            <h2 className="text-xl font-bold text-emerald-300">ຮ້ານແມ່ເຖົ້າ ຈັນທີ</h2>
                            <p className="text-xs text-slate-400">ແລກວັດຖຸດິບທີ່ເຈົ້າເກັບມາ ເອົາເມັດ ຢາ ແລະ ຂອງໃຊ້ (ບໍ່ໃຊ້ເຄຣດິດ)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition">✕</button>
                </div>

                <div className="flex gap-4 px-6 pt-3 border-b border-slate-700/60 bg-slate-900/40 overflow-x-auto">
                    {TABS.map(({ id, icon, label }) => (
                        <button
                            key={id}
                            type="button"
                            data-testid={`shop-tab-${id}`}
                            onClick={() => { soundManager.playSelect(); setTab(id); setMessage(null); }}
                            className={`pb-2.5 font-bold text-sm transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                                tab === id ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>{icon}</span>
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {message && <p className="text-sm text-amber-300 text-center" data-testid="shop-message">{message}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entries.map(entry =>
                        {
                            const item = getItem(entry.itemId);
                            const left = entry.dailyLimit === undefined ? null : entry.dailyLimit - entities.shopPurchases.boughtToday(entry.itemId, dayCount);
                            const affordable = entry.price.every(ing => entities.backpack.getItemCount(ing.itemId) >= ing.count);
                            const canBuy = affordable && (left === null || left > 0);
                            return (
                                <div
                                    key={entry.itemId}
                                    data-testid={`shop-item-${entry.itemId}`}
                                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                                        canBuy ? 'bg-slate-800/80 border-emerald-500/40' : 'bg-slate-800/40 border-slate-700/60'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2.5">
                                            <ItemIcon iconImage={item?.iconImage} icon={item?.icon || '📦'} size={32} />
                                            <div>
                                                <h3 className="font-bold text-white text-base">{item?.name ?? entry.itemId}</h3>
                                                <p className="text-xs text-slate-400">
                                                    ມີໃນກະເປົາ {entities.backpack.getItemCount(entry.itemId)}
                                                    {left !== null && ` · ເຫຼືອມື້ນີ້ ${left}`}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-300">{item?.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {entry.price.map(ing =>
                                            {
                                                const ingItem = getItem(ing.itemId);
                                                const count = entities.backpack.getItemCount(ing.itemId);
                                                const ok = count >= ing.count;
                                                return (
                                                    <span
                                                        key={ing.itemId}
                                                        className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 font-mono ${
                                                            ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                        }`}
                                                    >
                                                        <ItemIcon iconImage={ingItem?.iconImage} icon={ingItem?.icon} size={16} />
                                                        <span>{ingItem?.name}: {count}/{ing.count}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(entry)}
                                        disabled={!canBuy}
                                        className={`w-full py-2 rounded-lg font-bold text-sm transition shadow ${
                                            canBuy ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {left !== null && left <= 0 ? 'ຂາຍໝົດມື້ນີ້' : affordable ? 'ແລກ' : 'ວັດຖຸດິບບໍ່ພໍ'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-6 py-3 border-t border-slate-700/60 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                    <span>🎒 ກະເປົາ: {entities.backpack.usedSlotsCount} / {entities.backpack.maxSlots} ຊ່ອງ</span>
                    <span>🌅 ມື້ທີ {dayCount + 1} ຂອງເກມ</span>
                </div>
            </div>
        </div>
    );
};

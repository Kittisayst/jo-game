import React, { useState } from 'react';
import { buyFromShopUseCase, dailyOffers, type ShopEntry, type ShopTab } from '../../../application/ShopUseCases';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { ItemIcon } from './ItemIcon';
import { BookFrame, BookTabItem } from './book/BookFrame';

interface ShopModalProps {
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

/** Grandma Chanthy's shop: goods for Materials (barter). Dual-page Market Ledger. */
export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
    const [tab, setTab] = useState<Tab>('seeds');
    const [message, setMessage] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [, setRevision] = useState(0);

    if (!isOpen) return null;

    const shop = getGameContent().shop;
    const dayCount = entities.worldTime.dayCount;
    const entries: ShopEntry[] = tab === 'daily' ? dailyOffers(shop, dayCount) : shop.stock[tab];
    const getItem = (id: string) => entities.itemCatalog.get(id);

    const activeEntry = entries.find(e => e.itemId === selectedItemId) || entries[0] || null;

    const handleBuy = (entry: ShopEntry) => {
        const result = buyFromShopUseCase(entry, entities.backpack, entities.shopPurchases, dayCount);
        if (result.success) {
            soundManager.playPowerUp();
            setMessage(`ໄດ້ຮັບ ${getItem(entry.itemId)?.name ?? entry.itemId} ແລ້ວ`);
            EventBus.emit('backpack-changed');
        } else {
            soundManager.playHurt();
            setMessage(REASONS[result.reason]);
        }
        setRevision(r => r + 1);
    };

    const bookTabs: BookTabItem[] = TABS.map(t => ({
        id: t.id,
        label: t.label,
        icon: t.icon,
        testId: `shop-tab-${t.id}`,
    }));

    // Left Page: Wares Catalog List
    const leftPage = (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#d6c7a7]">
                <span className="book-subheading text-xs uppercase tracking-wider">
                    🌿 ລາຍການສິນຄ້າ ({entries.length})
                </span>
                <span className="text-[11px] text-[#78350f]">ກົດເພື່ອເບິ່ງລາຍລະອຽດ</span>
            </div>

            {message && (
                <p className="text-xs text-amber-900 bg-amber-100 p-1.5 rounded-lg border border-amber-300 text-center font-bold" data-testid="shop-message">
                    {message}
                </p>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {entries.map(entry => {
                    const item = getItem(entry.itemId);
                    const left = entry.dailyLimit === undefined ? null : entry.dailyLimit - entities.shopPurchases.boughtToday(entry.itemId, dayCount);
                    const affordable = entry.price.every(ing => entities.backpack.getItemCount(ing.itemId) >= ing.count);
                    const canBuy = affordable && (left === null || left > 0);
                    const isSelected = activeEntry?.itemId === entry.itemId;

                    return (
                        <div
                            key={entry.itemId}
                            data-testid={`shop-item-${entry.itemId}`}
                            onClick={() => {
                                soundManager.playSelect();
                                setSelectedItemId(entry.itemId);
                            }}
                            className={`book-card cursor-pointer flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition ${
                                isSelected ? 'book-card-selected' : ''
                            } ${!canBuy ? 'opacity-70' : ''}`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-1 rounded-lg bg-amber-950/20 border border-amber-900/30 flex-shrink-0">
                                    <ItemIcon iconImage={item?.iconImage} icon={item?.icon || '📦'} size={28} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="book-heading text-sm font-bold truncate">
                                        {item?.name ?? entry.itemId}
                                    </h4>
                                    <p className="text-[11px] book-text-muted truncate">
                                        ມີໃນກະເປົາ {entities.backpack.getItemCount(entry.itemId)}
                                        {left !== null && ` · ເຫຼືອ ${left}`}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleBuy(entry);
                                }}
                                disabled={!canBuy}
                                className={`min-h-[44px] min-w-[54px] text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm flex items-center justify-center ${
                                    canBuy
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                                        : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                                }`}
                            >
                                {left !== null && left <= 0 ? 'ໝົດ' : affordable ? 'ແລກ' : 'ບໍ່ພໍ'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Right Page: Grandma Chanthy's Showcase & Barter Action
    const activeItem = activeEntry ? getItem(activeEntry.itemId) : null;
    const activeLeft = activeEntry && activeEntry.dailyLimit !== undefined
        ? activeEntry.dailyLimit - entities.shopPurchases.boughtToday(activeEntry.itemId, dayCount)
        : null;
    const activeAffordable = activeEntry ? activeEntry.price.every(ing => entities.backpack.getItemCount(ing.itemId) >= ing.count) : false;
    const activeCanBuy = activeAffordable && (activeLeft === null || activeLeft > 0);

    const rightPage = activeEntry && activeItem ? (
        <div className="h-full flex flex-col justify-between space-y-3">
            <div className="space-y-3">
                {/* Greeting Bubble */}
                <div className="p-2.5 rounded-xl bg-amber-100 border border-[#d6c7a7] text-xs book-text flex items-center gap-2">
                    <span className="text-xl">👵</span>
                    <span className="italic">"ສະບາຍດີຫຼານ! ມື້ນີ້ມີວັດສະດຸຫຍັງມາແລກກັບແມ່ເຖົ້າບໍ່?"</span>
                </div>

                {/* Large Item Banner */}
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-amber-950/10 border border-[#d6c7a7]">
                    <div className="p-2 rounded-xl bg-[#2b1810] border-2 border-[#ca8a04] shadow flex-shrink-0">
                        <ItemIcon iconImage={activeItem.iconImage} icon={activeItem.icon || '📦'} size={52} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="book-heading text-lg font-bold truncate">
                            {activeItem.name}
                        </h3>
                        <p className="text-xs book-subheading">{activeItem.nameEn}</p>
                        <p className="text-xs book-text-muted mt-1">
                            ມີໃນກະເປົາ {entities.backpack.getItemCount(activeEntry.itemId)} ອັນ
                            {activeLeft !== null && ` · ໂຄຕ້າເຫຼືອມື້ນີ້ ${activeLeft}`}
                        </p>
                    </div>
                </div>

                {/* Lore / Description */}
                {activeItem.description && (
                    <p className="book-text text-xs italic px-1">
                        "{activeItem.description}"
                    </p>
                )}

                <div className="book-filigree-divider" />

                {/* Barter Cost Checklist */}
                <div className="space-y-1.5">
                    <span className="book-subheading text-xs uppercase tracking-wide block">
                        📦 ວັດສະດຸທີ່ຕ້ອງໃຊ້ແລກ (Required Materials):
                    </span>
                    <div className="space-y-1.5">
                        {activeEntry.price.map(ing => {
                            const ingItem = getItem(ing.itemId);
                            const count = entities.backpack.getItemCount(ing.itemId);
                            const ok = count >= ing.count;

                            return (
                                <div
                                    key={ing.itemId}
                                    className={`book-ingredient-row ${ok ? 'book-ingredient-ok' : 'book-ingredient-missing'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ItemIcon iconImage={ingItem?.iconImage} icon={ingItem?.icon} size={20} />
                                        <span className="font-medium text-xs">{ingItem?.name || ing.itemId}</span>
                                    </div>
                                    <span className="font-mono font-bold text-xs">
                                        {count} / {ing.count} {ok ? '✅' : '❌'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Giant Barter Button */}
            <div className="pt-2">
                <button
                    onClick={() => handleBuy(activeEntry)}
                    disabled={!activeCanBuy}
                    className="book-btn-craft w-full"
                >
                    <span>🌿</span>
                    <span>
                        {activeLeft !== null && activeLeft <= 0
                            ? 'ຂາຍໝົດມື້ນີ້'
                            : activeAffordable
                                ? 'ແລກປ່ຽນສິນຄ້າ (Barter)'
                                : 'ວັດສະດຸໃນກະເປົາບໍ່ພໍ'}
                    </span>
                </button>
            </div>
        </div>
    ) : (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center book-text-muted">
            <span className="text-4xl mb-2">🌿</span>
            <p className="text-sm font-bold">ເລືອກສິນຄ້າຈາກໜ້າຊ້າຍ</p>
        </div>
    );

    return (
        <BookFrame
            isOpen={isOpen}
            onClose={onClose}
            title="ຮ້ານແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy's Shop)"
            icon="🌿"
            subtitle="ແລກວັດຖຸດິບທີ່ເຈົ້າເກັບມາ ເອົາເມັດ ຢາ ແລະ ຂອງໃຊ້ (ບໍ່ໃຊ້ເຄຣດິດ)"
            tabs={bookTabs}
            activeTab={tab}
            onTabChange={t => {
                setTab(t as Tab);
                setMessage(null);
            }}
            leftPage={leftPage}
            rightPage={rightPage}
            dataTestId="shop-modal"
            footer={
                <div className="flex items-center justify-between w-full font-mono text-xs text-[#eedec2]">
                    <span>🎒 ກະເປົາ: {entities.backpack.usedSlotsCount} / {entities.backpack.maxSlots} ຊ່ອງ</span>
                    <span>🌅 ມື້ທີ {dayCount + 1} ຂອງເກມ</span>
                </div>
            }
        />
    );
};

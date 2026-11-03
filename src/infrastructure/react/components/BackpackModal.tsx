import React, { useEffect, useState, useCallback } from 'react';
import { BackpackSlot } from '../../../domain/entities/Backpack';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { equipWeaponUseCase } from '../../../application/EquipWeaponUseCase';
import { discardItemUseCase } from '../../../application/DiscardItemUseCase';
import { ItemIcon } from './ItemIcon';
import { DurabilityBar } from './DurabilityBar';
import { ARMOR_SLOTS, ARMOR_SLOT_LABEL, ArmorSlot } from '../../../domain/entities/Armor';
import { equipArmorUseCase, unequipArmorUseCase } from '../../../application/ArmorUseCases';
import { drinkPotionUseCase, potionEffectOf } from '../../../application/DrinkPotionUseCase';
import { armorContext } from '../../composition';
import { BookFrame, BookTabItem } from './book/BookFrame';

interface BackpackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUseItem?: (itemId: string) => void;
    onOpenBooks?: () => void;
}

type FilterCategory = 'all' | 'gear' | 'material' | 'consumable';

export const BackpackModal: React.FC<BackpackModalProps> = ({ isOpen, onClose, onUseItem, onOpenBooks }) => {
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [, setRevision] = useState(0);

    const allSlots = entities.backpack.getAllSlots();
    const getItem = useCallback((id: string) => entities.itemCatalog.get(id), []);

    useEffect(() => {
        setNotice(null);
    }, [selectedSlotIndex, isOpen]);

    // Auto-select first non-empty slot on open
    useEffect(() => {
        if (isOpen) {
            const firstOccupied = allSlots.findIndex(s => s !== null);
            setSelectedSlotIndex(firstOccupied !== -1 ? firstOccupied : 0);
            setShowDiscardConfirm(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const selectedSlot: BackpackSlot | null = allSlots[selectedSlotIndex] || null;
    const selectedItemDef = selectedSlot ? getItem(selectedSlot.itemId) : null;
    const selectedWear = selectedSlot ? entities.backpack.getSlotDurability(selectedSlot.slotIndex) : null;

    // Filter check helper
    const matchesFilter = useCallback((slot: BackpackSlot | null): boolean => {
        if (!slot) return activeFilter === 'all';
        const def = getItem(slot.itemId);
        if (!def) return activeFilter === 'all';

        switch (activeFilter) {
            case 'gear':
                return def.category === 'weapon' || def.category === 'tool' || def.category === 'armor';
            case 'material':
                return def.category === 'material';
            case 'consumable':
                return def.category === 'consumable';
            case 'all':
            default:
                return true;
        }
    }, [activeFilter, getItem]);

    const handleUseSelectedItem = useCallback(() => {
        if (!selectedSlot || !selectedItemDef) return;
        setNotice(null);

        if (selectedItemDef.category === 'armor') {
            const result = equipArmorUseCase(selectedSlot.itemId, entities.backpack, armorContext);
            if (!result.success) return;

            soundManager.playPowerUp();
            setRevision(r => r + 1);
        } else if (selectedItemDef.category === 'consumable') {
            const result = drinkPotionUseCase(selectedItemDef, entities.backpack, entities.health, entities.effects);

            if (!result.success) {
                soundManager.playHurt();
                setNotice(
                    result.reason === 'already_full'
                        ? '❤️ ຫົວໃຈເຕັມແລ້ວ ບໍ່ຈຳເປັນຕ້ອງໃຊ້'
                        : result.reason === 'not_a_potion'
                            ? 'ສິ່ງນີ້ໃຊ້ຕອນສ້ອມປະຕູ ບໍ່ແມ່ນດື່ມ'
                            : 'ໃຊ້ບໍ່ໄດ້ຕອນນີ້'
                );
                return;
            }

            soundManager.playPowerUp();
            onUseItem?.(selectedSlot.itemId);
            EventBus.emit('backpack-item-used', selectedSlot.itemId);
            setRevision(r => r + 1);
        } else if (selectedItemDef.category === 'weapon') {
            const result = equipWeaponUseCase(entities.equipment, entities.backpack, selectedSlot.itemId);
            if (!result.success) return;

            EventBus.emit('weapon-changed', selectedSlot.itemId);
            soundManager.playSelect();
            setRevision(r => r + 1);
        }
    }, [selectedSlot, selectedItemDef, onUseItem]);

    const handleUnequip = (slot: ArmorSlot) => {
        const result = unequipArmorUseCase(slot, entities.backpack, armorContext);
        if (result.success) {
            soundManager.playSelect();
            setNotice(null);
            setRevision(r => r + 1);
        } else {
            soundManager.playHurt();
            setNotice(result.reason === 'backpack_full' ? '⚠️ ກະເປົາເຕັມ ຖອດບໍ່ໄດ້' : null);
        }
    };

    /** Chooses the Potion that R drinks. */
    const handleSetQuickSlot = () => {
        if (!selectedSlot) return;
        entities.quickSlotItemId = selectedSlot.itemId;
        soundManager.playSelect();
        EventBus.emit('backpack-changed');
        setRevision(r => r + 1);
    };

    const handleDiscardSelected = (discardAll = false) => {
        if (!selectedSlot || !selectedItemDef) return;

        const result = discardItemUseCase(
            entities.backpack,
            selectedSlot.slotIndex,
            selectedItemDef.category,
            discardAll ? 'all' : 1
        );
        if (!result.success) return;

        soundManager.playSelect();
        setShowDiscardConfirm(false);
        setRevision(r => r + 1);
    };

    const handleSortBackpack = () => {
        entities.backpack.sortSlots();
        soundManager.playCoin();
        setSelectedSlotIndex(0);
        setRevision(r => r + 1);
    };

    // Keyboard & Gamepad focus navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (showDiscardConfirm) {
                if (e.key === 'Escape') setShowDiscardConfirm(false);
                return;
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev + 1) % 20);
                soundManager.playSelect();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev - 1 + 20) % 20);
                soundManager.playSelect();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev + 5) % 20);
                soundManager.playSelect();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev - 5 + 20) % 20);
                soundManager.playSelect();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleUseSelectedItem();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showDiscardConfirm, handleUseSelectedItem]);

    if (!isOpen) return null;

    const capacityPercentage = Math.round((entities.backpack.usedSlotsCount / entities.backpack.maxSlots) * 100);

    const isCurrentlyEquipped = Boolean(selectedItemDef && (
        (selectedItemDef.category === 'weapon' && entities.equipment.equippedWeaponId === selectedItemDef.id) ||
        (selectedItemDef.category === 'armor' && selectedItemDef.slot && entities.equipment.getArmor(selectedItemDef.slot)?.itemId === selectedItemDef.id)
    ));

    const weaponDamage = selectedItemDef && selectedItemDef.category === 'weapon'
        ? entities.equipment.getWeaponDamage(selectedItemDef.id)
        : 0;

    const weaponUpgradeLevel = selectedItemDef && selectedItemDef.category === 'weapon'
        ? entities.equipment.getUpgradeLevel(selectedItemDef.id)
        : 0;

    const tabs: BookTabItem[] = [
        { id: 'all', label: `ທັງໝົດ (${entities.backpack.usedSlotsCount})` },
        { id: 'gear', label: '⚔️ ອຸປະກອນ' },
        { id: 'material', label: '📦 ວັດສະດຸ' },
        { id: 'consumable', label: '🧪 ຢາຊົມໃຊ້' },
    ];

    // Left Page: Hero Avatar, Stats & Equipped Armor (UnderMine style)
    const leftPage = (
        <div className="h-full flex flex-col justify-between space-y-3">
            <div className="space-y-3">
                {/* Hero Header & Capacity Gauge */}
                <div className="flex items-center justify-between pb-2 border-b border-[#d6c7a7]">
                    <div>
                        <h3 className="book-heading text-lg font-bold">🧙‍♂️ ນັກຜະຈົນໄພ</h3>
                        <p className="text-xs book-subheading">Level {entities.heroLevel.level} Adventurer</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-900/20 text-[#78350f] border border-[#d6c7a7]">
                            {entities.backpack.usedSlotsCount} / {entities.backpack.maxSlots} ຊ່ອງ
                        </span>
                        <div className="gw-gauge w-28 bg-[#2b1810] rounded-full h-2 mt-1.5 overflow-hidden border border-[#78350f]">
                            <div
                                data-testid="backpack-capacity-fill"
                                style={{
                                    width: `${capacityPercentage}%`,
                                    height: '100%',
                                    transition: 'width 0.3s',
                                    backgroundColor: capacityPercentage >= 90 ? '#dc2626' : capacityPercentage >= 70 ? '#d97706' : '#16a34a',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Hero Stats Table (UnderMine style) */}
                <div className="book-card p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">❤️ ພະລັງຊີວິດ (Health):</span>
                        <span className="font-mono font-bold text-rose-800">{entities.health.current} / {entities.health.max}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">⚔️ ພະລັງໂຈມຕີ (Swing DMG):</span>
                        <span className="font-mono font-bold text-amber-900">{entities.equipment.currentAttackPower} DMG</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">🛡️ ຫົວໃຈເກາະປ້ອງກັນ (Armor):</span>
                        <span className="font-mono font-bold text-sky-800">+{entities.health.armor}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">🎓 ເຄຣດິດຄວາມຮູ້ (Credit):</span>
                        <span className="font-mono font-bold text-indigo-900">{entities.wallet.balance}</span>
                    </div>
                </div>

                <div className="book-filigree-divider" />

                {/* Equipped Armor Panel (UnderMine style 3 slots) */}
                <div className="space-y-1.5">
                    <span className="book-subheading text-xs uppercase tracking-wide block">
                        🛡️ ຊຸດເກາະທີ່ສວມໃສ່ (Equipped Armor):
                    </span>
                    <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                        data-testid="armor-panel"
                    >
                        {ARMOR_SLOTS.map(slot => {
                            const worn = entities.equipment.getArmor(slot);
                            const wornDef = worn ? getItem(worn.itemId) : null;
                            const max = worn ? entities.itemCatalog.maxDurabilityOf(worn.itemId) : undefined;
                            const current = worn && max !== undefined ? Math.min(max, worn.durability ?? max) : 0;

                            return (
                                <div
                                    key={slot}
                                    data-testid={`armor-slot-${slot}`}
                                    data-item={worn?.itemId ?? ''}
                                    className="book-slot p-2 flex flex-col items-center justify-between"
                                    style={{ minHeight: 104 }}
                                >
                                    <span className="text-[10px] uppercase tracking-wide text-amber-200/80 font-bold">
                                        {ARMOR_SLOT_LABEL[slot]}
                                    </span>
                                    {worn && wornDef ? (
                                        <>
                                            <ItemIcon iconImage={wornDef.iconImage} icon={wornDef.icon} size={28} />
                                            {max !== undefined && (
                                                <DurabilityBar
                                                    reading={{
                                                        current,
                                                        max,
                                                        state: current <= 0 ? 'broken' : current <= max * 0.2 ? 'low' : 'ok',
                                                    }}
                                                    compact
                                                />
                                            )}
                                            <button
                                                data-testid={`unequip-${slot}`}
                                                onClick={() => handleUnequip(slot)}
                                                className="min-h-[44px] text-[10px] px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-600 transition flex items-center justify-center"
                                            >
                                                ຖອດ
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-amber-700/60 text-2xl font-light">＋</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Equipped Weapon Badge */}
                <div className="space-y-1.5">
                    <span className="book-subheading text-xs uppercase tracking-wide block">
                        ⚔️ ອາວຸດປະຈຳກາຍ (Equipped Weapon):
                    </span>
                    <div className="book-card p-2.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-[#2b1810] border border-[#78350f]">
                                <ItemIcon
                                    iconImage={getItem(entities.equipment.equippedWeaponId)?.iconImage}
                                    icon={getItem(entities.equipment.equippedWeaponId)?.icon || '⚔️'}
                                    size={28}
                                />
                            </div>
                            <div>
                                <h4 className="book-heading text-xs font-bold">
                                    {getItem(entities.equipment.equippedWeaponId)?.name || 'ໝັດເປົ່າ (Unarmed)'}
                                </h4>
                                <p className="text-[10px] book-text-muted">
                                    ATK {entities.equipment.currentAttackPower} DMG · Tier {getItem(entities.equipment.equippedWeaponId)?.tier ?? 0}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                            ✓ ພ້ອມສູ້
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions at bottom of left page */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#d6c7a7]">
                {onOpenBooks && (
                    <button
                        onClick={() => {
                            soundManager.playSelect();
                            onClose();
                            onOpenBooks();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-xs border border-amber-500/50 transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        title="ເປີດຊັ້ນປຶ້ມຕຳລາສ່ວນຕົວ"
                    >
                        <span>📚</span>
                        <span>ຊັ້ນປຶ້ມ ({Object.values(entities.books).filter(b => b.isUnlocked).length})</span>
                    </button>
                )}
                <button
                    onClick={handleSortBackpack}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs border border-stone-400 transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    title="ຈັດລຽງໄອເທັມຕາມໝວດໝູ່"
                >
                    <span>🔄</span>
                    <span>ຈັດລຽງ (Sort)</span>
                </button>
            </div>
        </div>
    );

    // Right Page: Backpack Slots Grid & Item Inspector (UnderMine style)
    const rightPage = (
        <div className="h-full flex flex-col justify-between space-y-3">
            <div className="space-y-3">
                {/* Slot Grid Header */}
                <div className="flex items-center justify-between pb-1 border-b border-[#d6c7a7]">
                    <span className="book-subheading text-xs uppercase tracking-wide">
                        🎒 ຊ່ອງເກັບເຄື່ອງ (20 Slots)
                    </span>
                    <span className="text-[11px] text-[#78350f]">ກົດເລືອກ ຫຼື ໃຊ້ປຸ່ມລູກສອນ</span>
                </div>

                {/* 20 Slots Grid (5 cols x 4 rows) with Dark Wood Inset Tiles */}
                <div className="gw-slotgrid grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {allSlots.map((slot, index) => {
                        const itemDef = slot ? getItem(slot.itemId) : null;
                        const isSelected = selectedSlotIndex === index;
                        const isEquipped = itemDef && itemDef.category === 'weapon' && entities.equipment.equippedWeaponId === itemDef.id;
                        const isFilteredOut = !matchesFilter(slot);
                        const wear = slot ? entities.backpack.getSlotDurability(index) : null;

                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    setSelectedSlotIndex(index);
                                    setShowDiscardConfirm(false);
                                    soundManager.playSelect();
                                }}
                                style={{ aspectRatio: '1', minHeight: 52, opacity: isFilteredOut ? 0.3 : 1 }}
                                className={`book-slot ${isSelected ? 'book-slot-selected' : ''}`}
                            >
                                {/* Equipped Badge */}
                                {isEquipped && (
                                    <span className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 shadow">
                                        E
                                    </span>
                                )}

                                {wear?.state === 'broken' && (
                                    <span
                                        data-testid="broken-badge"
                                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-rose-300 shadow"
                                    >
                                        ພັງ
                                    </span>
                                )}

                                {slot && itemDef ? (
                                    <>
                                        <ItemIcon iconImage={itemDef.iconImage} icon={itemDef.icon} size={26} />
                                        <span className="text-[10px] font-medium text-amber-100 truncate w-full text-center leading-tight mt-0.5 px-0.5">
                                            {itemDef.name}
                                        </span>
                                        {wear && (
                                            <span className="absolute bottom-1 right-1" style={{ left: 4 }}>
                                                <DurabilityBar reading={wear} compact />
                                            </span>
                                        )}
                                        {slot.count > 1 && (
                                            <span className="absolute bottom-1 right-1 bg-black/80 text-amber-300 font-mono text-[9px] font-bold px-1 rounded border border-amber-500/40">
                                                x{slot.count}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[10px] text-amber-800/40 font-mono font-bold">
                                        {index + 1}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="book-filigree-divider" />

                {/* Selected Item Inspector */}
                {selectedSlot && selectedItemDef ? (
                    <div className="book-card p-3 rounded-xl space-y-2.5">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-[#2b1810] border-2 border-[#ca8a04] shadow flex-shrink-0">
                                <ItemIcon iconImage={selectedItemDef.iconImage} icon={selectedItemDef.icon} size={36} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="book-heading text-sm font-bold truncate">
                                        {selectedItemDef.name}
                                    </h4>
                                    {isCurrentlyEquipped && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                            ✓ ຕິດຕັ້ງແລ້ວ
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] book-subheading">{selectedItemDef.nameEn}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedItemDef.category === 'weapon' && (
                                        <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                                            ⚔️ ອາວຸດ (ATK {weaponDamage} DMG)
                                        </span>
                                    )}
                                    {selectedItemDef.category === 'armor' && (
                                        <span className="text-[10px] font-bold text-sky-900 bg-sky-200/80 px-2 py-0.5 rounded">
                                            🛡️ ເກາະ (+{selectedItemDef.armorHearts} ຫົວໃຈ)
                                        </span>
                                    )}
                                    {selectedItemDef.category === 'consumable' && (
                                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">
                                            🧪 ຢາຊົມໃຊ້
                                        </span>
                                    )}
                                    {selectedItemDef.category === 'material' && (
                                        <span className="text-[10px] font-bold text-stone-800 bg-stone-200 px-2 py-0.5 rounded">
                                            📦 ວັດສະດຸ (ຊ້ອນໄດ້ {selectedItemDef.maxStack})
                                        </span>
                                    )}
                                    {weaponUpgradeLevel > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                            +{weaponUpgradeLevel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedWear && (
                            <div className="space-y-1 pt-1" data-testid="durability-detail">
                                <div className="flex justify-between items-center text-xs book-text-muted">
                                    <span>🛠️ ຄວາມທົນທານ:</span>
                                </div>
                                <DurabilityBar reading={selectedWear} />
                            </div>
                        )}

                        {selectedItemDef.description && (
                            <p className="book-text text-xs italic bg-white/40 p-2 rounded-lg border border-[#d6c7a7]/60">
                                "{selectedItemDef.description}"
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="p-4 text-center book-text-muted text-xs">
                        <span className="text-2xl block mb-1">📦</span>
                        <span>ເລືອກໄອເທັມເພື່ອເບິ່ງລາຍລະອຽດ ຫຼື ໃຊ້ງານ</span>
                    </div>
                )}
            </div>

            {/* Action Buttons for Selected Item */}
            {selectedSlot && selectedItemDef && (
                <div className="space-y-1.5 pt-1 border-t border-[#d6c7a7]">
                    {notice && (
                        <p role="status" className="text-xs text-amber-800 font-bold text-center">{notice}</p>
                    )}

                    {selectedItemDef.category === 'consumable' && (
                        <button
                            onClick={handleUseSelectedItem}
                            className="book-btn-craft w-full"
                        >
                            <span>🧪</span>
                            <span>ດື່ມ / ໃຊ້ງານ (Use Item) [Enter]</span>
                        </button>
                    )}

                    {selectedItemDef.category === 'consumable' && potionEffectOf(selectedItemDef) !== null && (
                        <button
                            data-testid="set-quick-slot"
                            onClick={handleSetQuickSlot}
                            disabled={entities.quickSlotItemId === selectedSlot.itemId}
                            className={`w-full py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                                entities.quickSlotItemId === selectedSlot.itemId
                                    ? 'bg-stone-300 text-stone-500 cursor-default'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 shadow-sm'
                            }`}
                        >
                            <span>⚡</span>
                            <span>{entities.quickSlotItemId === selectedSlot.itemId ? 'ຢູ່ຊ່ອງດ່ວນແລ້ວ [R]' : 'ຕັ້ງເປັນຊ່ອງດ່ວນ (ກົດ R ເພື່ອດື່ມ)'}</span>
                        </button>
                    )}

                    {selectedItemDef.category === 'armor' && (
                        <button
                            data-testid="equip-armor"
                            onClick={handleUseSelectedItem}
                            className="book-btn-craft w-full"
                        >
                            <span>🛡️</span>
                            <span>ສວມໃສ່ (Wear) [Enter]</span>
                        </button>
                    )}

                    {selectedItemDef.category === 'weapon' && (
                        <button
                            onClick={handleUseSelectedItem}
                            disabled={isCurrentlyEquipped}
                            className={`book-btn-craft w-full ${isCurrentlyEquipped ? 'opacity-60 cursor-default' : ''}`}
                        >
                            <span>⚔️</span>
                            <span>
                                {isCurrentlyEquipped ? 'ກຳລັງຕິດຕັ້ງຢູ່ (Equipped)' : 'ຕິດຕັ້ງອາວຸດນີ້ (Equip) [Enter]'}
                            </span>
                        </button>
                    )}

                    {selectedItemDef.category === 'material' && (
                        <>
                            {!showDiscardConfirm ? (
                                <button
                                    onClick={() => setShowDiscardConfirm(true)}
                                    className="w-full py-2 rounded-xl bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-800 border border-stone-300 hover:border-rose-300 font-medium text-xs transition flex items-center justify-center gap-1.5"
                                >
                                    <span>🗑️</span>
                                    <span>ຖິ້ມວັດສະດຸເພື່ອໃຫ້ກະເປົາວ່າງ...</span>
                                </button>
                            ) : (
                                <div className="bg-rose-100/90 border border-rose-400 p-2.5 rounded-xl text-center space-y-2">
                                    <p className="text-xs text-rose-900 font-bold">
                                        ແນ່ໃຈບໍ່ວ່າຕ້ອງການຖິ້ມ {selectedItemDef.name}?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDiscardSelected(false)}
                                            className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition"
                                        >
                                            ຖິ້ມ 1 ອັນ
                                        </button>
                                        <button
                                            onClick={() => handleDiscardSelected(true)}
                                            className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition"
                                        >
                                            ຖິ້ມໝົດ ({selectedSlot.count})
                                        </button>
                                        <button
                                            onClick={() => setShowDiscardConfirm(false)}
                                            className="px-3 py-1.5 bg-stone-300 hover:bg-stone-400 text-stone-800 text-xs rounded-lg transition"
                                        >
                                            ຍົກເລີກ
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <BookFrame
            isOpen={isOpen}
            onClose={onClose}
            title="ກະເປົາເດີນທາງ (Backpack)"
            icon="🎒"
            subtitle="ກວດສອບອຸປະກອນ, ວັດສະດຸ ແລະ ສະຖິຕິຕົວລະຄອນ"
            tabs={tabs}
            activeTab={activeFilter}
            onTabChange={id => setActiveFilter(id as FilterCategory)}
            leftPage={leftPage}
            rightPage={rightPage}
            maxWidth="max-w-5xl"
            footer={
                <div className="flex items-center justify-between w-full font-mono text-xs text-[#eedec2]">
                    <span className="flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>ເສຍຊີວິດໃນດ່ານຈະສູນເສຍວັດສະດຸ 50% (ເຄື່ອງມື ແລະ ອາວຸດຈະບໍ່ເສຍຫາຍ)</span>
                    </span>
                    <span className="font-bold text-amber-200">
                        🎓 ເຄຣດິດ: {entities.wallet.balance}
                    </span>
                </div>
            }
        />
    );
};

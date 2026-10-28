import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { BackpackSlot } from '../../../domain/entities/Backpack';
import { ItemData, loadItemsData } from '../../dataLoader';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';

interface BackpackModalProps
{
    isOpen: boolean;
    onClose: () => void;
    onUseItem?: (itemId: string) => void;
    onOpenBooks?: () => void;
}

type FilterCategory = 'all' | 'gear' | 'material' | 'consumable';

export const BackpackModal: React.FC<BackpackModalProps> = ({ isOpen, onClose, onUseItem, onOpenBooks }) =>
{
    const [items, setItems] = useState<ItemData[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [, setRevision] = useState(0);

    useEffect(() =>
    {
        loadItemsData().then(setItems).catch(console.error);
    }, []);

    const allSlots = entities.backpack.getAllSlots();
    const getItem = useCallback((id: string) => items.find(i => i.id === id), [items]);

    // Auto-select first non-empty slot on open
    useEffect(() =>
    {
        if (isOpen)
        {
            const firstOccupied = allSlots.findIndex(s => s !== null);
            setSelectedSlotIndex(firstOccupied !== -1 ? firstOccupied : 0);
            setShowDiscardConfirm(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const selectedSlot: BackpackSlot | null = allSlots[selectedSlotIndex] || null;
    const selectedItemDef = selectedSlot ? getItem(selectedSlot.itemId) : null;

    // Filter check helper
    const matchesFilter = useCallback((slot: BackpackSlot | null): boolean =>
    {
        if (!slot) return activeFilter === 'all';
        const def = getItem(slot.itemId);
        if (!def) return activeFilter === 'all';

        switch (activeFilter)
        {
            case 'gear':
                return def.category === 'weapon' || def.category === 'tool';
            case 'material':
                return def.category === 'material';
            case 'consumable':
                return def.category === 'consumable';
            case 'all':
            default:
                return true;
        }
    }, [activeFilter, getItem]);

    const handleUseSelectedItem = useCallback(() =>
    {
        if (!selectedSlot || !selectedItemDef) return;

        if (selectedItemDef.category === 'consumable')
        {
            entities.backpack.removeItem(selectedSlot.itemId, 1);
            soundManager.playPowerUp();
            if (onUseItem)
            {
                onUseItem(selectedSlot.itemId);
            }
            EventBus.emit('backpack-item-used', selectedSlot.itemId);
            setRevision(r => r + 1);
        }
        else if (selectedItemDef.category === 'weapon')
        {
            entities.equipment.equipWeapon(selectedSlot.itemId);
            EventBus.emit('weapon-changed', selectedSlot.itemId);
            soundManager.playSelect();
            setRevision(r => r + 1);
        }
    }, [selectedSlot, selectedItemDef, onUseItem]);

    const handleDiscardSelected = (discardAll = false) =>
    {
        if (!selectedSlot || !selectedItemDef) return;

        // Never discard tools or weapons
        if (selectedItemDef.category === 'tool' || selectedItemDef.category === 'weapon')
        {
            return;
        }

        if (discardAll || selectedSlot.count <= 1)
        {
            entities.backpack.removeSlot(selectedSlot.slotIndex);
        }
        else
        {
            selectedSlot.count -= 1;
        }

        soundManager.playSelect();
        setShowDiscardConfirm(false);
        setRevision(r => r + 1);
    };

    const handleSortBackpack = () =>
    {
        entities.backpack.sortSlots();
        soundManager.playCoin();
        setSelectedSlotIndex(0);
        setRevision(r => r + 1);
    };

    // Keyboard & Gamepad focus navigation (Skill Rule 4)
    useEffect(() =>
    {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (showDiscardConfirm)
            {
                if (e.key === 'Escape') setShowDiscardConfirm(false);
                return;
            }

            if (e.key === 'ArrowRight')
            {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev + 1) % 20);
                soundManager.playSelect();
            }
            else if (e.key === 'ArrowLeft')
            {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev - 1 + 20) % 20);
                soundManager.playSelect();
            }
            else if (e.key === 'ArrowDown')
            {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev + 5) % 20);
                soundManager.playSelect();
            }
            else if (e.key === 'ArrowUp')
            {
                e.preventDefault();
                setSelectedSlotIndex(prev => (prev - 5 + 20) % 20);
                soundManager.playSelect();
            }
            else if (e.key === 'Enter' || e.key === ' ')
            {
                if (selectedSlot && selectedItemDef)
                {
                    e.preventDefault();
                    handleUseSelectedItem();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedSlot, selectedItemDef, handleUseSelectedItem, showDiscardConfirm]);

    const capacityPercentage = useMemo(() =>
    {
        return Math.round((entities.backpack.usedSlotsCount / entities.backpack.maxSlots) * 100);
    }, [allSlots]);

    if (!isOpen) return null;

    const isCurrentlyEquipped = selectedItemDef && selectedItemDef.category === 'weapon'
        ? entities.equipment.equippedWeaponId === selectedItemDef.id
        : false;

    const weaponDamage = selectedItemDef && selectedItemDef.category === 'weapon'
        ? entities.equipment.getWeaponDamage(selectedItemDef.id)
        : null;

    const weaponUpgradeLevel = selectedItemDef && selectedItemDef.category === 'weapon'
        ? entities.equipment.getUpgradeLevel(selectedItemDef.id)
        : 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-fade-in">
            <div className="relative w-full max-w-4xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header with Title and Capacity Gauge */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/30 bg-slate-950/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl animate-pulse">🎒</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-cyan-300">ກະເປົາເດີນທາງ (Backpack)</h2>
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                                    {entities.backpack.usedSlotsCount} / {entities.backpack.maxSlots} ຊ່ອງ
                                </span>
                            </div>
                            <div className="w-36 sm:w-48 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-700">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        capacityPercentage >= 90
                                            ? 'bg-rose-500'
                                            : capacityPercentage >= 70
                                                ? 'bg-amber-400'
                                                : 'bg-cyan-400'
                                    }`}
                                    style={{ width: `${capacityPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                        title="ປິດ (Escape)"
                    >
                        ✕
                    </button>
                </div>

                {/* Filter Toolbar & Sort Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        <button
                            onClick={() => { setActiveFilter('all'); soundManager.playSelect(); }}
                            className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                activeFilter === 'all'
                                    ? 'bg-cyan-600 text-white font-bold shadow'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            ທັງໝົດ ({entities.backpack.usedSlotsCount})
                        </button>
                        <button
                            onClick={() => { setActiveFilter('gear'); soundManager.playSelect(); }}
                            className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                activeFilter === 'gear'
                                    ? 'bg-amber-600 text-white font-bold shadow'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            ⚔️ ອຸປະກອນ
                        </button>
                        <button
                            onClick={() => { setActiveFilter('material'); soundManager.playSelect(); }}
                            className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                activeFilter === 'material'
                                    ? 'bg-indigo-600 text-white font-bold shadow'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            📦 ວັດສະດຸ
                        </button>
                        <button
                            onClick={() => { setActiveFilter('consumable'); soundManager.playSelect(); }}
                            className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                activeFilter === 'consumable'
                                    ? 'bg-emerald-600 text-white font-bold shadow'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            🧪 ຢາຊົມໃຊ້
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {onOpenBooks && (
                            <button
                                onClick={() =>
                                {
                                    soundManager.playSelect();
                                    onClose();
                                    onOpenBooks();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-cyan-500 text-amber-300 hover:text-white font-bold border border-amber-500/40 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                title="ເປີດຊັ້ນປຶ້ມຕຳລາສ່ວນຕົວ (ບໍ່ກິນຊ່ອງກະເປົາ)"
                            >
                                <span>📚</span>
                                <span>ຊັ້ນປຶ້ມ ({Object.values(entities.books).filter(b => b.isUnlocked).length})</span>
                            </button>
                        )}

                        <button
                            onClick={handleSortBackpack}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="ຈັດລຽງໄອເທັມຕາມໝວດໝູ່"
                        >
                            <span>🔄</span>
                            <span>ຈັດລຽງ (Sort)</span>
                        </button>
                    </div>
                </div>

                {/* 2-Pane Body: Left Grid (60%), Right Inspector (40%) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-5 overflow-y-auto flex-1">

                    {/* Left Pane: 20-Slots Grid (7 Cols on desktop) */}
                    <div className="md:col-span-7 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                            {allSlots.map((slot, index) =>
                            {
                                const itemDef = slot ? getItem(slot.itemId) : null;
                                const isSelected = selectedSlotIndex === index;
                                const isEquipped = itemDef && itemDef.category === 'weapon' && entities.equipment.equippedWeaponId === itemDef.id;
                                const isFilteredOut = !matchesFilter(slot);

                                // Category Accent Colors
                                let categoryStyle = 'border-slate-800 bg-slate-900/40 hover:border-slate-700';
                                if (slot && itemDef)
                                {
                                    if (itemDef.category === 'weapon')
                                    {
                                        categoryStyle = 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400';
                                    }
                                    else if (itemDef.category === 'tool')
                                    {
                                        categoryStyle = 'border-sky-500/50 bg-sky-950/20 hover:border-sky-400';
                                    }
                                    else if (itemDef.category === 'consumable')
                                    {
                                        categoryStyle = 'border-emerald-500/50 bg-emerald-950/20 hover:border-emerald-400';
                                    }
                                    else
                                    {
                                        categoryStyle = 'border-slate-700 bg-slate-800/70 hover:border-indigo-400';
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() =>
                                        {
                                            setSelectedSlotIndex(index);
                                            setShowDiscardConfirm(false);
                                            soundManager.playSelect();
                                        }}
                                        className={`relative aspect-square min-h-[58px] sm:min-h-[64px] rounded-xl border-2 flex flex-col items-center justify-center p-1.5 transition-all outline-none ${categoryStyle} ${
                                            isSelected
                                                ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 border-cyan-400 bg-cyan-950/50 shadow-lg shadow-cyan-500/30 scale-105 z-10'
                                                : ''
                                        } ${isFilteredOut ? 'opacity-30' : 'opacity-100'}`}
                                    >
                                        {/* Equipped Badge */}
                                        {isEquipped && (
                                            <span className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 shadow">
                                                E
                                            </span>
                                        )}

                                        {slot && itemDef ? (
                                            <>
                                                <span className="text-2xl sm:text-3xl filter drop-shadow">
                                                    {itemDef.icon}
                                                </span>
                                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-200 truncate w-full text-center leading-tight mt-1">
                                                    {itemDef.name}
                                                </span>
                                                {slot.count > 1 && (
                                                    <span className="absolute bottom-1 right-1.5 bg-slate-950/90 text-cyan-300 font-mono text-[9px] sm:text-[10px] font-bold px-1 rounded border border-cyan-500/40">
                                                        x{slot.count}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-slate-700 font-mono">
                                                {index + 1}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span>🎮 ນຳທາງ: ປຸ່ມລູກສອນ | [Enter]: ໃຊ້ / ຕິດຕັ້ງ</span>
                            <span>ຄລິກຊ່ອງເພື່ອເລືອກ</span>
                        </div>
                    </div>

                    {/* Right Pane: Selected Item Inspector (5 Cols on desktop) */}
                    <div className="md:col-span-5 bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
                        {selectedSlot && selectedItemDef ? (
                            <div className="space-y-4">
                                {/* Header with Large Icon and Category Badge */}
                                <div className="flex items-start gap-3.5 pb-3 border-b border-slate-800">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-cyan-500/40 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
                                        {selectedItemDef.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-white text-base truncate">
                                                {selectedItemDef.name}
                                            </h3>
                                            {isCurrentlyEquipped && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                                    ✓ ຕິດຕັ້ງແລ້ວ
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">{selectedItemDef.nameEn}</p>
                                        
                                        {/* Category Pill */}
                                        <div className="mt-1">
                                            {selectedItemDef.category === 'weapon' && (
                                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                                    ⚔️ ອາວຸດ (Weapon)
                                                </span>
                                            )}
                                            {selectedItemDef.category === 'tool' && (
                                                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                                                    🛠️ ເຄື່ອງມື (Tool)
                                                </span>
                                            )}
                                            {selectedItemDef.category === 'consumable' && (
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                                    🧪 ຢາຊົມໃຊ້ (Consumable)
                                                </span>
                                            )}
                                            {selectedItemDef.category === 'material' && (
                                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                                    📦 ວັດສະດຸ (Material)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Stats Card */}
                                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                                    {selectedItemDef.category === 'weapon' && (
                                        <>
                                            <div className="flex justify-between items-center text-amber-300 font-bold">
                                                <span>⚔️ ພະລັງໂຈມຕີ (Attack):</span>
                                                <span className="text-sm font-mono">{weaponDamage} DMG</span>
                                            </div>
                                            <div className="flex justify-between items-center text-slate-400">
                                                <span>ລະດັບອາວຸດ (Tier):</span>
                                                <span className="text-white font-medium">Tier {selectedItemDef.tier ?? 1}</span>
                                            </div>
                                            {weaponUpgradeLevel > 0 && (
                                                <div className="flex justify-between items-center text-emerald-400">
                                                    <span>ອັບເກຣດທີ່ Forge:</span>
                                                    <span className="font-bold">+{weaponUpgradeLevel}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {selectedItemDef.category === 'consumable' && (
                                        <div className="flex justify-between items-center text-emerald-300 font-bold">
                                            <span>💚 ປະສິດທິພາບ:</span>
                                            <span>ຟື້ນຟູພະລັງຊີວິດ +1 ❤️</span>
                                        </div>
                                    )}

                                    {selectedItemDef.category === 'tool' && (
                                        <div className="flex justify-between items-center text-sky-300 font-bold">
                                            <span>🛠️ ໜ້າທີ່ຫຼັກ:</span>
                                            <span>
                                                {selectedItemDef.toolType === 'axe'
                                                    ? 'ຕັດຕົ້ນໄມ້ (Wood)'
                                                    : selectedItemDef.toolType === 'pickaxe'
                                                        ? 'ຂຸດສາຍແຮ່ເຫຼັກ (Iron)'
                                                        : 'ສ້ອມແປງປະຕູ (Broken Gate)'}
                                            </span>
                                        </div>
                                    )}

                                    {selectedItemDef.category === 'material' && (
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>📦 ຈຳນວນສູງສຸດຕໍ່ຊ່ອງ:</span>
                                            <span className="text-cyan-300 font-mono font-bold">{selectedItemDef.maxStack} ອັນ</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
                                        <span>ຈຳນວນໃນຊ່ອງນີ້:</span>
                                        <span className="text-white font-mono font-bold">{selectedSlot.count}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span>ຈຳນວນທັງໝົດໃນກະເປົາ:</span>
                                        <span className="text-cyan-300 font-mono font-bold">
                                            {entities.backpack.getItemCount(selectedSlot.itemId)}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                                    {selectedItemDef.description}
                                </p>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-2">
                                    {selectedItemDef.category === 'consumable' && (
                                        <button
                                            onClick={handleUseSelectedItem}
                                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
                                        >
                                            <span>🧪</span>
                                            <span>ດື່ມ / ໃຊ້ງານ (Use Item) [Enter]</span>
                                        </button>
                                    )}

                                    {selectedItemDef.category === 'weapon' && (
                                        <button
                                            onClick={handleUseSelectedItem}
                                            disabled={isCurrentlyEquipped}
                                            className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                                                isCurrentlyEquipped
                                                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                                                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white active:scale-98'
                                            }`}
                                        >
                                            <span>⚔️</span>
                                            <span>
                                                {isCurrentlyEquipped ? 'ກຳລັງຕິດຕັ້ງຢູ່ (Equipped)' : 'ຕິດຕັ້ງອາວຸດນີ້ (Equip) [Enter]'}
                                            </span>
                                        </button>
                                    )}

                                    {/* Safe Discard for Materials */}
                                    {selectedItemDef.category === 'material' && (
                                        <>
                                            {!showDiscardConfirm ? (
                                                <button
                                                    onClick={() => setShowDiscardConfirm(true)}
                                                    className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 font-medium text-xs transition flex items-center justify-center gap-1.5"
                                                >
                                                    <span>🗑️</span>
                                                    <span>ຖິ້ມວັດສະດຸເພື່ອໃຫ້ກະເປົາວ່າງ...</span>
                                                </button>
                                            ) : (
                                                <div className="bg-rose-950/40 border border-rose-500/50 p-2.5 rounded-xl text-center space-y-2 animate-fade-in">
                                                    <p className="text-xs text-rose-300 font-bold">
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
                                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                                                        >
                                                            ຍົກເລີກ
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Empty Slot Selected */
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                                <span className="text-5xl opacity-30">📦</span>
                                <h4 className="font-bold text-slate-400 text-sm">ຊ່ອງນີ້ຍັງວ່າງເປົ່າ</h4>
                                <p className="text-xs text-slate-500 max-w-[200px]">
                                    ອອກສຳຫຼວດດ່ານເພື່ອຕັດໄມ້, ຂຸດແຮ່ ຫຼື ສ້າງອຸປະກອນໃໝ່ທີ່ໂຮງຊ່າງ
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Warning & Credit Counter */}
                <div className="px-5 py-3 border-t border-slate-700/60 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-amber-400/90 flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>ເສຍຊີວິດໃນດ່ານຈະສູນເສຍວັດສະດຸ 50% (ເຄື່ອງມື ແລະ ອາວຸດຈະບໍ່ເສຍຫາຍ)</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono font-bold text-cyan-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        <span>🎓 ເຄຣດິດຄວາມຮູ້:</span>
                        <span className="text-white">{entities.wallet.balance}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

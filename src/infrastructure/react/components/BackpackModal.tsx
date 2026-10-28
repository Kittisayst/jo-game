import React, { useEffect, useState } from 'react';
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
}

export const BackpackModal: React.FC<BackpackModalProps> = ({ isOpen, onClose, onUseItem }) =>
{
    const [items, setItems] = useState<ItemData[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
    const [, setRevision] = useState(0);

    useEffect(() =>
    {
        loadItemsData().then(setItems).catch(console.error);
    }, []);

    if (!isOpen) return null;

    const allSlots = entities.backpack.getAllSlots();
    const getItem = (id: string) => items.find(i => i.id === id);

    const selectedSlot: BackpackSlot | null = selectedSlotIndex !== null ? (allSlots[selectedSlotIndex] || null) : null;
    const selectedItemDef = selectedSlot ? getItem(selectedSlot.itemId) : null;

    const handleUseSelectedItem = () =>
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
            soundManager.playSelect();
            setRevision(r => r + 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🎒</span>
                        <div>
                            <h2 className="text-xl font-bold text-cyan-300">ກະເປົາເດີນທາງ (Backpack)</h2>
                            <p className="text-xs text-slate-400">
                                ພື້ນທີ່ບັນຈຸ: {entities.backpack.usedSlotsCount} / {entities.backpack.maxSlots} ຊ່ອງ
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* 20 Slots Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {allSlots.map((slot, index) =>
                        {
                            const itemDef = slot ? getItem(slot.itemId) : null;
                            const isSelected = selectedSlotIndex === index;

                            return (
                                <button
                                    key={index}
                                    onClick={() =>
                                    {
                                        setSelectedSlotIndex(index);
                                        soundManager.playSelect();
                                    }}
                                    className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition group ${
                                        isSelected
                                            ? 'border-cyan-400 bg-cyan-950/40 shadow-md shadow-cyan-500/20'
                                            : slot
                                                ? 'border-slate-700/80 bg-slate-800/80 hover:border-slate-600'
                                                : 'border-dashed border-slate-800 bg-slate-900/40 hover:border-slate-700'
                                    }`}
                                >
                                    {slot && itemDef ? (
                                        <>
                                            <span className="text-3xl group-hover:scale-110 transition transform">
                                                {itemDef.icon}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-200 truncate w-full text-center mt-1">
                                                {itemDef.name}
                                            </span>
                                            {slot.count > 1 && (
                                                <span className="absolute bottom-1 right-1.5 bg-slate-900/90 text-cyan-300 font-mono text-[10px] font-bold px-1 rounded border border-cyan-500/30">
                                                    x{slot.count}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-xs text-slate-600 font-mono">
                                            {index + 1}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected Item Details */}
                    {selectedSlot && selectedItemDef ? (
                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{selectedItemDef.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-white text-base">{selectedItemDef.name}</h4>
                                        <p className="text-xs text-slate-400">{selectedItemDef.nameEn}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono bg-cyan-950/40 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30">
                                    ຈຳນວນ: {selectedSlot.count}
                                </span>
                            </div>

                            <p className="text-xs text-slate-300">{selectedItemDef.description}</p>

                            <div className="pt-2 flex gap-3">
                                {selectedItemDef.category === 'consumable' && (
                                    <button
                                        onClick={handleUseSelectedItem}
                                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                                    >
                                        ດື່ມ / ໃຊ້ງານ (Use)
                                    </button>
                                )}
                                {selectedItemDef.category === 'weapon' && (
                                    <button
                                        onClick={handleUseSelectedItem}
                                        className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition"
                                    >
                                        {entities.equipment.equippedWeaponId === selectedItemDef.id ? 'ກຳລັງຕິດຕັ້ງຢູ່ ✓' : 'ຕິດຕັ້ງອາວຸດນີ້'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-xs text-slate-500 py-2">
                            ຄລິກໃສ່ຊ່ອງໄອເທັມເພື່ອເບິ່ງລາຍລະອຽດ
                        </div>
                    )}
                </div>

                {/* Footer warning */}
                <div className="px-6 py-3 border-t border-slate-700/60 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-amber-400/90">
                        ⚠️ ຖ້າເສຍຊີວິດໃນດ່ານ ຈະສູນເສຍວັດສະດຸ 50% (ແຕ່ເຄື່ອງມື ແລະ ອາວຸດຈະບໍ່ເສຍຫາຍ)
                    </span>
                    <span>🎓 ເຄຣດິດ: {entities.wallet.balance}</span>
                </div>
            </div>
        </div>
    );
};


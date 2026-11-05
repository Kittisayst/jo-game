import React, { useState } from 'react';
import { transferItemUseCase } from '../../../application/TransferItemUseCase';
import type { Backpack } from '../../../domain/entities/Backpack';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { ItemIcon } from './ItemIcon';
import { BookFrame } from './book/BookFrame';

interface StorageModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Something moved between the Backpack and the chest (so the HUD and the save are refreshed). */
    onChanged: () => void;
}

/**
 * StorageModal: Village Storage Chest converted to Fantasy Adventurer Journal / Ledger UI
 * Left Page: Hero's Backpack slots (20 slots)
 * Right Page: Village Secure Storage Chest slots (40 slots)
 */
export const StorageModal: React.FC<StorageModalProps> = ({ isOpen, onClose, onChanged }) => {
    const [, setRevision] = useState(0);
    const [notice, setNotice] = useState<string | null>(null);

    if (!isOpen) return null;

    const { backpack, storage, itemCatalog } = entities;

    const move = (from: Backpack, to: Backpack, slotIndex: number, toName: string) => {
        const result = transferItemUseCase(from, to, slotIndex);
        if (!result.success) {
            soundManager.playHurt();
            setNotice(result.reason === 'destination_full' ? `⚠️ ${toName}ເຕັມ` : null);
            return;
        }
        soundManager.playSelect();
        setNotice(null);
        setRevision(r => r + 1);
        onChanged();
    };

    const renderSlots = (container: Backpack, other: Backpack, otherName: string, id: 'backpack' | 'chest', cols = 5) => {
        const slots = container.getAllSlots();
        return (
            <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
                {slots.map((slot, index) => {
                    const item = slot ? itemCatalog.get(slot.itemId) : null;
                    return (
                        <button
                            key={index}
                            type="button"
                            data-testid={`storage-${id}-slot-${index}`}
                            data-item={slot?.itemId ?? ''}
                            disabled={!slot}
                            onClick={() => move(container, other, index, otherName)}
                            title={item ? `${item.name} (ກົດເພື່ອຍ້າຍໄປ${otherName})` : ''}
                            style={{ aspectRatio: '1', minHeight: 44, minWidth: 44 }}
                            className={`book-slot relative rounded-xl border flex items-center justify-center transition ${slot
                                ? 'border-[#854d0e] hover:border-amber-400 cursor-pointer shadow-sm'
                                : 'border-[#4a2e18]/40 cursor-default opacity-60'
                                }`}
                        >
                            {slot && item && (
                                <>
                                    <ItemIcon iconImage={item.iconImage} icon={item.icon} size={24} />
                                    {slot.count > 1 && (
                                        <span
                                            className="absolute text-[10px] font-mono font-bold text-amber-200 drop-shadow"
                                            style={{ bottom: 2, right: 4 }}
                                        >
                                            x{slot.count}
                                        </span>
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <BookFrame
            isOpen={isOpen}
            onClose={onClose}
            title="ຫີບເກັບຂອງ (Storage Chest)"
            icon="📦"
            subtitle="ຂອງໃນຫີບບໍ່ເສຍເມື່ອຕາຍ · ກົດຊ່ອງເພື່ອຍ້າຍຂ້າມໄປອີກຝັ່ງ"
            maxWidth="max-w-4xl"
            dataTestId="storage-modal"
            windowTestId="storage-window"
            className="storage-book-window"
            leftPage={
                <div className="flex flex-col h-full space-y-3 book-page-turn">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d4c5a9]">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🎒</span>
                            <div>
                                <h3 className="font-bold text-sm text-amber-950">ກະເປົາ (Backpack)</h3>
                                <p className="text-[11px] text-amber-800/70">ໄອເທັມທີ່ພົກຕິດໂຕ</p>
                            </div>
                        </div>
                        <span
                            className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300"
                            data-testid="storage-backpack-count"
                        >
                            {backpack.usedSlotsCount}/{backpack.maxSlots}
                        </span>
                    </div>

                    {notice && (
                        <p role="status" className="text-xs text-amber-900 bg-amber-100 p-1.5 rounded-lg border border-amber-300">
                            {notice}
                        </p>
                    )}

                    <div className="flex-1 overflow-y-auto pr-1">
                        {renderSlots(backpack, storage, 'ຫີບ', 'backpack', 4)}
                    </div>

                    <div className="p-2 rounded-lg bg-[#fffdfa]/60 border border-[#d4c5a9] text-[11px] text-amber-900/80 flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>ເສຍຊີວິດໃນດ່ານຈະສູນເສຍວັດສະດຸໃນກະເປົາ 50%</span>
                    </div>
                </div>
            }
            rightPage={
                <div className="flex flex-col h-full space-y-3 book-page-turn">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d4c5a9]">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📦</span>
                            <div>
                                <h3 className="font-bold text-sm text-amber-950">ຫີບເກັບເຄື່ອງ (Chest)</h3>
                                <p className="text-[11px] text-amber-800/70">ຄັງເກັບເຄື່ອງຖາວອນ</p>
                            </div>
                        </div>
                        <span
                            className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300"
                            data-testid="storage-chest-count"
                        >
                            {storage.usedSlotsCount}/{storage.maxSlots}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1">
                        {renderSlots(storage, backpack, 'ກະເປົາ', 'chest', 5)}
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-100/60 border border-emerald-300 text-[11px] text-emerald-900 flex items-center gap-1.5">
                        <span>🔒</span>
                        <span>ປອດໄພ 100%: ໄອເທັມໃນຫີບຈະບໍ່ມີວັນສູນເສຍ</span>
                    </div>
                </div>
            }
            tabExtra={
                <span className="font-mono text-xs text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    🎒 {backpack.usedSlotsCount}/{backpack.maxSlots} · 📦 {storage.usedSlotsCount}/{storage.maxSlots}
                </span>
            }
        />
    );
};

import React, { useState } from 'react';
import { transferItemUseCase } from '../../../application/TransferItemUseCase';
import type { Backpack } from '../../../domain/entities/Backpack';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { ItemIcon } from './ItemIcon';

interface StorageModalProps
{
    isOpen: boolean;
    onClose: () => void;
    /** Something moved between the Backpack and the chest (so the HUD and the save are refreshed). */
    onChanged: () => void;
}

/** The Storage chest of the Village Hub: 40 slots, two panes (Backpack | chest), click a slot to move it across. */
export const StorageModal: React.FC<StorageModalProps> = ({ isOpen, onClose, onChanged }) =>
{
    const [, setRevision] = useState(0);
    const [notice, setNotice] = useState<string | null>(null);

    if (!isOpen) return null;

    const { backpack, storage, itemCatalog } = entities;

    const move = (from: Backpack, to: Backpack, slotIndex: number, toName: string) =>
    {
        const result = transferItemUseCase(from, to, slotIndex);
        if (!result.success)
        {
            soundManager.playHurt();
            setNotice(result.reason === 'destination_full' ? `⚠️ ${toName}ເຕັມ` : null);
            return;
        }
        soundManager.playSelect();
        setNotice(null);
        setRevision(r => r + 1);
        onChanged();
    };

    const pane = (title: string, container: Backpack, other: Backpack, otherName: string, id: 'backpack' | 'chest') => (
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-200 text-sm">{title}</h3>
                <span className="text-xs text-slate-400" data-testid={`storage-${id}-count`}>{container.usedSlotsCount}/{container.maxSlots}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
                {container.getAllSlots().map((slot, index) =>
                {
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
                            style={{ aspectRatio: '1', minHeight: 44 }}
                            className={`relative rounded-lg border flex items-center justify-center ${
                                slot ? 'bg-slate-800/80 border-slate-600 hover:border-cyan-400' : 'bg-slate-900/40 border-slate-800'
                            }`}
                        >
                            {slot && item && (
                                <>
                                    <ItemIcon iconImage={item.iconImage} icon={item.icon} size={24} />
                                    {slot.count > 1 && (
                                        <span className="absolute text-[10px] font-mono font-bold text-cyan-300" style={{ bottom: 2, right: 4 }}>{slot.count}</span>
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-4xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" data-testid="storage-modal">
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📦</span>
                        <div>
                            <h2 className="text-xl font-bold text-amber-300">ຫີບເກັບຂອງ (Storage)</h2>
                            <p className="text-xs text-slate-400">ຂອງໃນຫີບບໍ່ເສຍເມື່ອຕາຍ. ກົດຊ່ອງເພື່ອຍ້າຍຂ້າມໄປອີກຝັ່ງ.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="skin-close-btn" aria-label="Close">✕</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-3">
                    {notice && <p role="status" className="text-xs text-amber-300">{notice}</p>}
                    <div className="flex flex-col md:flex-row gap-4">
                        {pane('🎒 ກະເປົາ', backpack, storage, 'ຫີບ', 'backpack')}
                        {pane('📦 ຫີບ', storage, backpack, 'ກະເປົາ', 'chest')}
                    </div>
                </div>
            </div>
        </div>
    );
};

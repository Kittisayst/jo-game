import React, { useState } from 'react';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { CraftingStatus } from './CraftingStatus';
import { RecipeGrid } from './RecipeGrid';
import { RepairList } from './RepairList';
import { ToolUpgradePanel } from './ToolUpgradePanel';
import { WeaponUpgradePanel } from './WeaponUpgradePanel';

export type SmithyTab = 'tools' | 'weapons' | 'upgrade' | 'repair';

interface SmithyModalProps
{
    isOpen: boolean;
    tab: SmithyTab;
    onTabChange: (tab: SmithyTab) => void;
    onClose: () => void;
}

const TABS: { id: SmithyTab; icon: string; label: string }[] = [
    { id: 'tools', icon: '🔨', label: 'ເຄື່ອງມື & ຢາ' },
    { id: 'weapons', icon: '🗡️', label: 'ອາວຸດ & ເກາະ' },
    { id: 'upgrade', icon: '✨', label: 'ອັບເກຣດ' },
    { id: 'repair', icon: '🛠️', label: 'ສ້ອມແປງ' },
];

/**
 * The Smithy: the Workshop (tools, potions) and the Forge (weapons, armor, Portal blocks) in one building and
 * one window. The Forge side stays locked until the Textbook 1 exam is passed.
 */
export const SmithyModal: React.FC<SmithyModalProps> = ({ isOpen, tab, onTabChange, onClose }) =>
{
    const [, setRevision] = useState(0);
    if (!isOpen) return null;

    const refresh = () => setRevision(r => r + 1);
    const isForgeUnlocked = entities.forgeUnlocked || entities.books['book-ch1']?.examPassed;
    const forgeLocked = !isForgeUnlocked && tab === 'weapons';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-orange-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚒️</span>
                        <div>
                            <h2 className="text-xl font-bold text-orange-300">ໂຮງຊ່າງ & ໂຮງຕີເຫຼັກ (Smithy)</h2>
                            <p className="text-xs text-slate-400">ສ້າງເຄື່ອງມື ຫຼອມອາວຸດ ອັບເກຣດ ແລະ ສ້ອມແປງ ໃນບ່ອນດຽວ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex gap-4 px-6 pt-3 border-b border-slate-700/60 bg-slate-900/40 overflow-x-auto">
                    {TABS.map(({ id, icon, label }) => (
                        <button
                            key={id}
                            type="button"
                            data-testid={`smithy-tab-${id}`}
                            onClick={() => { soundManager.playSelect(); onTabChange(id); }}
                            className={`pb-2.5 font-bold text-sm transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                                tab === id ? 'border-orange-400 text-orange-300' : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>{icon}</span>
                            <span>{label}</span>
                            {id === 'weapons' && !isForgeUnlocked && <span>🔒</span>}
                        </button>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <CraftingStatus onCollected={refresh} />

                    {forgeLocked ? (
                        <div className="p-8 text-center space-y-3" data-testid="smithy-forge-locked">
                            <span className="text-5xl">🔒</span>
                            <h3 className="text-xl font-bold text-slate-200">ເຕົາຫຼອມຍັງບໍ່ເປີດ</h3>
                            <p className="text-slate-400 max-w-md mx-auto text-sm">
                                ຊ່າງຕີເຫຼັກຕ້ອງການນັກຮົບທີ່ມີພື້ນຖານຄວາມຮູ້! ສອບເສັງຜ່ານ <span className="text-amber-400 font-bold">ບົດທີ 1</span> ທີ່ສະຖາບັນກ່ອນ ຈຶ່ງຈະຫຼອມອາວຸດ ແລະ ອັບເກຣດອາວຸດໄດ້. ເຄື່ອງມື, ການອັບເກຣດເຄື່ອງມື ແລະການສ້ອມແປງໃຊ້ໄດ້ເລີຍ.
                            </p>
                        </div>
                    ) : tab === 'tools' ? (
                        <RecipeGrid building="workshop" onChanged={refresh} />
                    ) : tab === 'weapons' ? (
                        <RecipeGrid building="forge" onChanged={refresh} />
                    ) : tab === 'upgrade' ? (
                        <div className="space-y-6">
                            <section className="space-y-3">
                                <h3 className="font-bold text-emerald-300 text-base flex items-center gap-2"><span>⬆️</span><span>ອັບເກຣດເຄື່ອງມື (Tools)</span></h3>
                                <ToolUpgradePanel onChanged={refresh} />
                            </section>
                            <section className="space-y-3">
                                <h3 className="font-bold text-orange-300 text-base flex items-center gap-2"><span>✨</span><span>ອັບເກຣດຂັ້ນອາວຸດ (Weapons +1..+3)</span></h3>
                                {isForgeUnlocked ? (
                                    <WeaponUpgradePanel onChanged={refresh} />
                                ) : (
                                    <p className="text-sm text-slate-400" data-testid="smithy-forge-locked">🔒 ສອບເສັງບົດທີ 1 ກ່ອນ ຈຶ່ງຈະອັບເກຣດອາວຸດໄດ້</p>
                                )}
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <section className="space-y-3" data-testid="workshop-repairs">
                                <h3 className="font-bold text-emerald-300 text-base flex items-center gap-2"><span>🛠️</span><span>ສ້ອມແປງເຄື່ອງມື (Tools)</span></h3>
                                <RepairList building="workshop" />
                            </section>
                            <section className="space-y-3" data-testid="forge-repairs">
                                <h3 className="font-bold text-orange-300 text-base flex items-center gap-2"><span>⚔️</span><span>ສ້ອມແປງອາວຸດ & ເກາະ (Weapons)</span></h3>
                                <RepairList building="forge" />
                            </section>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-slate-700/60 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                    <span>🎒 ກະເປົາ: {entities.backpack.usedSlotsCount} / {entities.backpack.maxSlots} ຊ່ອງ · ⚔️ ATK {entities.equipment.currentAttackPower}</span>
                    <span>🎓 ເຄຣດິດ: {entities.wallet.balance}</span>
                </div>
            </div>
        </div>
    );
};

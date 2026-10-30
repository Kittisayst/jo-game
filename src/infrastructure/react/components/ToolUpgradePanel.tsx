import React, { useState } from 'react';
import { ToolUpgradeRecipe, toolStrikeWeight, upgradeToolUseCase } from '../../../application/UpgradeToolUseCase';
import { MAX_TOOL_LEVEL } from '../../../domain/entities/ToolUpgrades';
import { soundManager } from '../../audio/SoundManager';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { EventBus } from '../../EventBus';
import { ItemIcon } from './ItemIcon';

/** How many Strikes a node of `strikes` Strikes takes with a tool whose Strike counts `weight`. */
const strikesNeeded = (strikes: number, weight: number): number => Math.ceil(strikes / weight - 1e-9);

/**
 * The Workshop's upgrade tab: each axe and pickaxe the hero carries goes from +0 to +3 for Materials (never
 * Credit). An upgraded tool counts for more of a Strike, so a tree falls in fewer Strikes.
 */
export const ToolUpgradePanel: React.FC<{ onChanged?: () => void }> = ({ onChanged }) =>
{
    const [, setRevision] = useState(0);
    const [notice, setNotice] = useState<string | null>(null);
    const recipes = getGameContent().recipes.filter((r): r is ToolUpgradeRecipe => 'targetToolId' in r);
    const tools = [...new Set(recipes.map(r => r.targetToolId))].filter(id => entities.backpack.getItemCount(id) > 0);
    const getItem = (id: string) => entities.itemCatalog.get(id);

    const upgrade = (toolId: string) =>
    {
        const result = upgradeToolUseCase(toolId, recipes, entities.toolUpgrades, entities.backpack);
        if (!result.success)
        {
            soundManager.playHurt();
            setNotice(result.reason === 'insufficient_ingredients' ? '⚠️ ວັດຖຸດິບບໍ່ພໍ' : null);
            return;
        }
        soundManager.playPowerUp();
        setNotice(null);
        EventBus.emit('backpack-changed');
        setRevision(r => r + 1);
        onChanged?.();
    };

    if (tools.length === 0)
    {
        return <p className="text-sm text-slate-400" data-testid="tool-upgrade-empty">ຍັງບໍ່ມີຂວານ ຫຼືຈົກໃນກະເປົາ. ສ້າງໄດ້ທີ່ແຖບ "ສ້າງ".</p>;
    }

    return (
        <div className="space-y-4" data-testid="tool-upgrade-panel">
            <p className="text-sm text-slate-300">
                ອັບເກຣດຂວານ ແລະຈົກ ໃຫ້ຕັດ/ຂຸດໄວຂຶ້ນ (ໃຊ້ວັດຖຸດິບ ບໍ່ໃຊ້ Credit). ເຄື່ອງມືຊະນິດດຽວກັນທຸກອັນໄດ້ລະດັບເທົ່າກັນ.
            </p>
            {notice && <p role="status" className="text-xs text-amber-300">{notice}</p>}

            {tools.map(toolId =>
            {
                const item = getItem(toolId);
                const level = entities.toolUpgrades.getLevel(toolId);
                const weight = toolStrikeWeight(entities.toolUpgrades, recipes, toolId);
                const next = recipes.find(r => r.targetToolId === toolId && r.targetLevel === level + 1);
                const canPay = next?.ingredients.every(ing => entities.backpack.getItemCount(ing.itemId) >= ing.count) ?? false;

                return (
                    <div
                        key={toolId}
                        data-testid={`tool-${toolId}`}
                        data-level={level}
                        className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-4 space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <ItemIcon iconImage={item?.iconImage} icon={item?.icon} size={32} />
                            <div className="flex-1">
                                <div className="font-bold text-white">{item?.name ?? toolId} <span className="text-emerald-300">+{level}</span></div>
                                <div className="text-xs text-slate-400">
                                    ແຮງຕໍ່ການຕີ ×{weight} · ຕົ້ນໄມ້/ຫີນ 3 ເທື່ອ → {strikesNeeded(3, weight)} ເທື່ອ · ເສັ້ນແຮ່ 4 ເທື່ອ → {strikesNeeded(4, weight)} ເທື່ອ
                                </div>
                            </div>
                        </div>

                        {next ? (
                            <>
                                <div className="flex flex-wrap gap-1.5 text-xs">
                                    {next.ingredients.map(ing =>
                                    {
                                        const have = entities.backpack.getItemCount(ing.itemId);
                                        const ok = have >= ing.count;
                                        const ingItem = getItem(ing.itemId);
                                        return (
                                            <span
                                                key={ing.itemId}
                                                className={`px-2 py-1 rounded-md border flex items-center gap-1 font-mono ${ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}
                                            >
                                                <ItemIcon iconImage={ingItem?.iconImage} icon={ingItem?.icon} size={14} />
                                                <span>{ingItem?.name ?? ing.itemId}: {have}/{ing.count}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    data-testid={`upgrade-${toolId}`}
                                    disabled={!canPay}
                                    onClick={() => upgrade(toolId)}
                                    className={`w-full py-2 rounded-lg font-bold text-sm transition ${canPay ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {canPay ? `ອັບເກຣດເປັນ +${level + 1} (ແຮງ ×${next.strikeWeight})` : 'ວັດຖຸດິບບໍ່ພໍ'}
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-amber-300 font-bold">⭐ ລະດັບສູງສຸດແລ້ວ (+{MAX_TOOL_LEVEL})</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

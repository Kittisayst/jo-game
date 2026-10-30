import React, { useState } from 'react';
import { equipSkillUseCase, upgradeSkillUseCase } from '../../../application/SkillUseCases';
import { MAX_SKILL_RANK } from '../../../domain/entities/SkillProgression';
import { soundManager } from '../../audio/SoundManager';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { effectAtRank, SkillDefinition, SkillEffect } from '../../content/SkillCatalog';
import { EventBus } from '../../EventBus';
import { ItemIcon } from './ItemIcon';

const KEYS = ['K', 'L'] as const;

/** What changes between two ranks of a skill, as short Lao phrases (only the numbers that differ). */
function describeChange (from: SkillEffect, to: SkillEffect, fromCooldownMs: number, toCooldownMs: number): string[]
{
    const parts: string[] = [];
    if (fromCooldownMs !== toCooldownMs) parts.push(`ລໍຖ້າໃຊ້ຊ້ຳ ${(fromCooldownMs / 1000).toFixed(1)} → ${(toCooldownMs / 1000).toFixed(1)} ວິ`);
    if (from.damageMultiplier !== to.damageMultiplier) parts.push(`ແຮງ ×${from.damageMultiplier} → ×${to.damageMultiplier}`);
    if (from.type === 'wave' && to.type === 'wave' && from.pierce !== to.pierce) parts.push(`ທະລຸ ${from.pierce} → ${to.pierce} ໂຕ`);
    if (from.type === 'area' && to.type === 'area')
    {
        if (from.radiusPx !== to.radiusPx) parts.push(`ວົງ ${from.radiusPx} → ${to.radiusPx} px`);
        if (from.stunMs !== to.stunMs) parts.push(`ມຶນ ${(from.stunMs / 1000).toFixed(1)} → ${(to.stunMs / 1000).toFixed(1)} ວິ`);
    }
    if (from.type === 'chain' && to.type === 'chain')
    {
        if (from.jumps !== to.jumps) parts.push(`ກະໂດດ ${from.jumps} → ${to.jumps} ໂຕ`);
        if (from.stunMs !== to.stunMs) parts.push(`ມຶນ ${(from.stunMs / 1000).toFixed(1)} → ${(to.stunMs / 1000).toFixed(1)} ວິ`);
    }
    return parts;
}

/**
 * The hero's skills in the Academy: the Dash and the air dash, and the active skills (one for each Realm,
 * learned by passing the exam of its Textbook) with their rank (1 to 3, raised for Credit and Materials) and
 * the two slots, K and L, to put them on.
 */
export const SkillsPanel: React.FC<{ onChanged?: () => void }> = ({ onChanged }) =>
{
    const [, setRevision] = useState(0);
    const [notice, setNotice] = useState<string | null>(null);
    const { dash, active, unlocks } = getGameContent().skills;
    const { realms, books } = getGameContent();
    const airDash = entities.movement.has('air-dash');
    const airDashAfter = unlocks.find(u => u.ability === 'air-dash')?.afterBossStage;
    const getItem = (id: string) => entities.itemCatalog.get(id);

    const equip = (slot: number, skillId: string | null) =>
    {
        if (equipSkillUseCase(entities.skills, slot, skillId))
        {
            soundManager.playSelect();
            setRevision(r => r + 1);
        }
        else
        {
            soundManager.playHurt();
        }
    };

    const upgrade = (skill: SkillDefinition) =>
    {
        const result = upgradeSkillUseCase(skill.id, active, entities.skills, entities.backpack, entities.wallet);
        if (!result.success)
        {
            soundManager.playHurt();
            setNotice(result.reason === 'insufficient_credit' ? '⚠️ Credit ບໍ່ພໍ' : result.reason === 'insufficient_ingredients' ? '⚠️ ວັດຖຸດິບບໍ່ພໍ' : null);
            return;
        }
        soundManager.playPowerUp();
        setNotice(null);
        EventBus.emit('backpack-changed');
        setRevision(r => r + 1);
        onChanged?.();
    };

    return (
        <div className="space-y-4" data-testid="skills-panel">
            <p className="text-sm text-slate-300">
                ສອບຜ່ານຕຳລາຂອງມິຕິ ເພື່ອໄດ້ສະກິວຂອງມິຕິນັ້ນ. ໃສ່ໄດ້ 2 ຊ່ອງ: ກົດ <b>K</b> ຫຼື <b>L</b> ໃນເກມ (ໃຊ້ແລ້ວຕ້ອງລໍເວລາ). ອັບເກຣດໄດ້ເຖິງລະດັບ {MAX_SKILL_RANK} ດ້ວຍ Credit ແລະວັດຖຸດິບ.
            </p>
            {notice && <p role="status" className="text-xs text-amber-300">{notice}</p>}

            <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 flex items-start gap-3">
                <span className="text-2xl">💨</span>
                <div className="space-y-1">
                    <div className="font-bold text-white">ພຸ່ງຫຼົບ (Dash) <span className="text-xs text-emerald-300">ມີແລ້ວ · ກົດ Shift</span></div>
                    <p className="text-sm text-slate-300">ພຸ່ງໄປໄວ ແລະຕອນພຸ່ງ ບໍ່ມີຫຍັງຕີໂດນ. ພຸ່ງໄດ້ທຸກໆ {(dash.cooldownMs / 1000).toFixed(1)} ວິ.</p>
                    <p className="text-sm" data-testid="air-dash-status" data-state={airDash ? 'learned' : 'locked'}>
                        {airDash
                            ? <span className="text-emerald-300">✅ ພຸ່ງກາງອາກາດ: ພຸ່ງໄດ້ 1 ເທື່ອຕໍ່ການໂດດ</span>
                            : <span className="text-amber-300">🔒 ພຸ່ງກາງອາກາດ: ປົດລັອກເມື່ອຊະນະ Boss ດ່ານ {airDashAfter}</span>}
                    </p>
                </div>
            </div>

            {active.map(skill =>
            {
                const rank = entities.skills.rankOf(skill.id);
                const learned = rank > 0;
                const realm = realms.find(r => r.number === skill.realm);
                const book = books.find(b => b.id === realm?.bookId);
                const slot = entities.skills.equipped.indexOf(skill.id);
                const nextCost = learned && rank < MAX_SKILL_RANK ? skill.upgrades[rank - 1] : undefined;
                const canPay = nextCost
                    ? entities.wallet.canAfford(nextCost.credit) && nextCost.ingredients.every(ing => entities.backpack.getItemCount(ing.itemId) >= ing.count)
                    : false;
                const changes = nextCost
                    ? describeChange(effectAtRank(skill, rank), effectAtRank(skill, rank + 1), skill.rankCooldowns[rank - 1], skill.rankCooldowns[rank])
                    : [];

                return (
                    <div
                        key={skill.id}
                        data-testid={`skill-${skill.id}`}
                        data-state={learned ? 'learned' : 'locked'}
                        data-rank={rank}
                        className={`rounded-xl border p-4 space-y-2 ${learned ? 'bg-slate-800/70 border-sky-500/40' : 'bg-slate-900/50 border-slate-700/60 opacity-70'}`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">{learned ? skill.icon : '🔒'}</span>
                            <div className="flex-1 space-y-1">
                                <div className="font-bold text-white">
                                    {skill.name}
                                    {learned && <span className="ml-2 text-amber-300" data-testid={`rank-${skill.id}`}>{'★'.repeat(rank)}{'☆'.repeat(MAX_SKILL_RANK - rank)}</span>}
                                </div>
                                <p className="text-sm text-slate-300">{skill.description}</p>
                                <p className="text-xs text-slate-400">💡 {skill.concept}</p>
                                <p className="text-xs text-slate-400">
                                    ລໍຖ້າໃຊ້ຊ້ຳ {((learned ? skill.rankCooldowns[rank - 1] : skill.cooldownMs) / 1000).toFixed(1)} ວິ · ມິຕິ {skill.realm}
                                </p>
                            </div>
                        </div>

                        {learned ? (
                            <>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <span className="text-xs text-slate-400">ໃສ່ຊ່ອງ:</span>
                                    {KEYS.map((key, i) => (
                                        <button
                                            key={key}
                                            type="button"
                                            data-testid={`equip-${skill.id}-${key}`}
                                            onClick={() => equip(i, slot === i ? null : skill.id)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold border ${slot === i ? 'bg-sky-600 text-white border-sky-300' : 'bg-slate-800 text-slate-200 border-slate-600'}`}
                                        >
                                            {key}{slot === i ? ' ✓' : ''}
                                        </button>
                                    ))}
                                </div>

                                {nextCost ? (
                                    <div className="space-y-2 pt-2 border-t border-slate-700/60">
                                        <div className="text-xs text-slate-300">ອັບເກຣດເປັນລະດັບ {rank + 1}: {changes.join(' · ')}</div>
                                        <div className="flex flex-wrap gap-1.5 text-xs">
                                            {nextCost.credit > 0 && (
                                                <span className={`px-2 py-1 rounded-md border font-mono ${entities.wallet.canAfford(nextCost.credit) ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                                                    🎓 Credit: {entities.wallet.balance}/{nextCost.credit}
                                                </span>
                                            )}
                                            {nextCost.ingredients.map(ing =>
                                            {
                                                const have = entities.backpack.getItemCount(ing.itemId);
                                                const item = getItem(ing.itemId);
                                                return (
                                                    <span
                                                        key={ing.itemId}
                                                        className={`px-2 py-1 rounded-md border flex items-center gap-1 font-mono ${have >= ing.count ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}
                                                    >
                                                        <ItemIcon iconImage={item?.iconImage} icon={item?.icon} size={14} />
                                                        <span>{item?.name ?? ing.itemId}: {have}/{ing.count}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <button
                                            type="button"
                                            data-testid={`upgrade-skill-${skill.id}`}
                                            disabled={!canPay}
                                            onClick={() => upgrade(skill)}
                                            className={`w-full py-2 rounded-lg font-bold text-sm transition ${canPay ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                        >
                                            {canPay ? `ອັບເກຣດເປັນລະດັບ ${rank + 1}` : 'Credit ຫຼືວັດຖຸດິບບໍ່ພໍ'}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-amber-300 font-bold pt-1">⭐ ລະດັບສູງສຸດແລ້ວ</p>
                                )}
                            </>
                        ) : (
                            <p className="text-xs text-amber-300">
                                🔒 ປົດລັອກເມື່ອສອບຜ່ານ {book ? `ຕຳລາບົດ ${skill.realm}: ${book.title}` : `ຕຳລາຂອງມິຕິ ${skill.realm}`}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

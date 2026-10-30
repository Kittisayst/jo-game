import React, { useState } from 'react';
import { equipSkillUseCase } from '../../../application/SkillUseCases';
import { soundManager } from '../../audio/SoundManager';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';

const KEYS = ['K', 'L'] as const;

/**
 * The hero's skills in the Academy: the Dash that is always there, and the active skills (one for each Realm,
 * learned by passing the exam of its Textbook) with the two slots, K and L, to put them on.
 */
export const SkillsPanel: React.FC = () =>
{
    const [, setRevision] = useState(0);
    const { dash, active } = getGameContent().skills;
    const { realms, books } = getGameContent();

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

    return (
        <div className="space-y-4" data-testid="skills-panel">
            <p className="text-sm text-slate-300">
                ສອບຜ່ານຕຳລາຂອງມິຕິ ເພື່ອໄດ້ສະກິວຂອງມິຕິນັ້ນ. ໃສ່ໄດ້ 2 ຊ່ອງ: ກົດ <b>K</b> ຫຼື <b>L</b> ໃນເກມ (ໃຊ້ແລ້ວຕ້ອງລໍເວລາ).
            </p>

            <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 flex items-start gap-3">
                <span className="text-2xl">💨</span>
                <div className="space-y-1">
                    <div className="font-bold text-white">ພຸ່ງຫຼົບ (Dash) <span className="text-xs text-emerald-300">ມີແລ້ວ · ກົດ Shift</span></div>
                    <p className="text-sm text-slate-300">ພຸ່ງໄປໄວ ແລະຕອນພຸ່ງ ບໍ່ມີຫຍັງຕີໂດນ. ພຸ່ງໄດ້ທຸກໆ {(dash.cooldownMs / 1000).toFixed(1)} ວິ.</p>
                </div>
            </div>

            {active.map(skill =>
            {
                const learned = entities.skills.isUnlocked(skill.id);
                const realm = realms.find(r => r.number === skill.realm);
                const book = books.find(b => b.id === realm?.bookId);
                const slot = entities.skills.equipped.indexOf(skill.id);

                return (
                    <div
                        key={skill.id}
                        data-testid={`skill-${skill.id}`}
                        data-state={learned ? 'learned' : 'locked'}
                        className={`rounded-xl border p-4 space-y-2 ${learned ? 'bg-slate-800/70 border-sky-500/40' : 'bg-slate-900/50 border-slate-700/60 opacity-70'}`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">{learned ? skill.icon : '🔒'}</span>
                            <div className="flex-1 space-y-1">
                                <div className="font-bold text-white">{skill.name}</div>
                                <p className="text-sm text-slate-300">{skill.description}</p>
                                <p className="text-xs text-slate-400">💡 {skill.concept}</p>
                                <p className="text-xs text-slate-400">ລໍຖ້າໃຊ້ຊ້ຳ {(skill.cooldownMs / 1000).toFixed(0)} ວິ · ມິຕິ {skill.realm}</p>
                            </div>
                        </div>

                        {learned ? (
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

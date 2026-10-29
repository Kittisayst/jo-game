import { StageProgression } from '../../../domain/entities/StageProgression';
import { BOSS_STAGE_IN_REALM, MINIBOSS_STAGE_IN_REALM, STAGES_PER_REALM } from '../../../domain/entities/StageNumber';
import { soundManager } from '../../audio/SoundManager';
import { getGameContent } from '../../content/ContentCatalog';
import { isStageReady, StageDefinition } from '../../phaser/stages/StageDefinition';

export interface StageMapModalProps
{
    currentLevel: string;
    stageProgression: StageProgression;
    onClose: () => void;
    onSelectStage: (stageKey: string) => void;
}

type CellState = 'placeholder' | 'locked' | 'open' | 'cleared';

function describe (stage: StageDefinition, state: CellState): string
{
    if (state === 'placeholder') return `${stage.name} · ກຳລັງສ້າງ`;
    if (state === 'locked') return `${stage.name} · 🔒 ຕ້ອງຜ່ານດ່ານກ່ອນໜ້າ`;
    if (state === 'cleared') return `${stage.name} · ⭐ ຜ່ານແລ້ວ`;
    return `${stage.name} · ▶️ ພ້ອມຫຼິ້ນ`;
}

/** The map of all 100 Stages, ten rows (Realms) of ten. Stages that are not built yet are grey. */
export function StageMapModal ({
    currentLevel,
    stageProgression,
    onClose,
    onSelectStage,
}: StageMapModalProps)
{
    const { realms, stages } = getGameContent();

    const stateOf = (stage: StageDefinition): CellState =>
    {
        if (!isStageReady(stage)) return 'placeholder';
        if (stageProgression.isStageCompleted(stage.id)) return 'cleared';
        return stageProgression.isStageUnlocked(stage.id) ? 'open' : 'locked';
    };

    const handleSelect = (stageKey: string, state: CellState) =>
    {
        if (state === 'placeholder' || state === 'locked')
        {
            soundManager.playHurt();
            return;
        }

        soundManager.playCoin();
        onSelectStage(stageKey);
    };

    return (
        <div className="stage-map-overlay" onClick={onClose}>
            <div className="stage-map-card" onClick={e => e.stopPropagation()}>
                <div className="stage-map-header">
                    <div className="stage-map-title-group">
                        <span className="stage-map-icon">🗺️</span>
                        <div>
                            <h2>ແຜນທີ່ 100 ດ່ານ (World Map)</h2>
                            <p className="stage-map-subtitle">10 ມິຕິ × 10 ດ່ານ. ເລືອກດ່ານທີ່ເປີດແລ້ວ ເພື່ອເດີນທາງໄປ ຫຼື ຫຼິ້ນຊ້ຳ</p>
                        </div>
                    </div>
                    <button
                        className="skin-close-btn"
                        onClick={onClose}
                        type="button"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="realm-map">
                    <button
                        className={`realm-village-btn ${currentLevel === 'village' ? 'is-current' : ''}`}
                        type="button"
                        onClick={() => handleSelect('village', 'open')}
                    >
                        🏡 ໝູ່ບ້ານ (Village Hub)
                    </button>

                    {realms.map(realm =>
                    {
                        const realmStages = stages.filter(stage => stage.realm === realm.number);
                        const builtCount = realmStages.filter(isStageReady).length;

                        return (
                            <section
                                key={realm.number}
                                className="realm-row"
                                style={{ ['--realm-color' as string]: realm.color }}
                                aria-label={`ມິຕິ ${realm.number}: ${realm.name}`}
                            >
                                <header className="realm-row-header">
                                    <span className="realm-row-icon">{realm.icon}</span>
                                    <span className="realm-row-name">ມິຕິ {realm.number}: {realm.name}</span>
                                    <span className="realm-row-subject">{realm.subject}</span>
                                    <span className="realm-row-count">{builtCount}/{STAGES_PER_REALM} ດ່ານ</span>
                                </header>

                                <div className="realm-cells">
                                    {realmStages.map(stage =>
                                    {
                                        const state = stateOf(stage);
                                        const position = ((stage.number - 1) % STAGES_PER_REALM) + 1;
                                        const mark = position === BOSS_STAGE_IN_REALM
                                            ? '👑'
                                            : position === MINIBOSS_STAGE_IN_REALM ? '⚔️' : '';
                                        const isCurrent = currentLevel === stage.id;

                                        return (
                                            <button
                                                key={stage.id}
                                                type="button"
                                                className={`realm-cell cell-${state} ${isCurrent ? 'is-current' : ''}`}
                                                title={describe(stage, state)}
                                                aria-label={describe(stage, state)}
                                                aria-disabled={state === 'placeholder' || state === 'locked'}
                                                onClick={() => handleSelect(stage.id, state)}
                                            >
                                                <span className="realm-cell-number">{stage.number}</span>
                                                <span className="realm-cell-mark">
                                                    {state === 'locked' ? '🔒' : state === 'cleared' ? '⭐' : mark}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="stage-map-footer">
                    <span>💡 ຜ່ານແຕ່ລະດ່ານເພື່ອເປີດດ່ານຕໍ່ໄປ. ດ່ານສີເທົາ "ກຳລັງສ້າງ" ຍັງເຂົ້າບໍ່ໄດ້. ⚔️ = Mini-boss (ດ່ານ 5), 👑 = Boss (ດ່ານ 10).</span>
                </div>
            </div>
        </div>
    );
}

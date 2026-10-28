import { useState, useEffect } from 'react';
import { saveManager, SaveSlotId, SlotMetadata } from '../../storage/SaveManager';

export interface SettingsModalProps
{
    isMuted: boolean;
    isMusicMuted: boolean;
    onClose: () => void;
    onToggleMute: () => void;
    onToggleMusic: () => void;
    onClearAllData: () => void;
    onSaveGame?: (slotId: SaveSlotId) => void;
    onLoadGame?: (slotId: SaveSlotId) => void;
    onImportGame?: (saveString: string, targetSlot: SaveSlotId) => boolean;
}

export function SettingsModal ({
    isMuted,
    isMusicMuted,
    onClose,
    onToggleMute,
    onToggleMusic,
    onClearAllData,
    onSaveGame,
    onLoadGame,
    onImportGame,
}: SettingsModalProps)
{
    const [selectedSlot, setSelectedSlot] = useState<SaveSlotId>(() => saveManager.getActiveSlot());
    const [slotsList, setSlotsList] = useState<SlotMetadata[]>(() => saveManager.listSlots());
    const [isExportImportOpen, setIsExportImportOpen] = useState(false);
    const [importInput, setImportInput] = useState('');
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const refreshSlots = () =>
    {
        setSlotsList(saveManager.listSlots());
    };

    const showToast = (text: string, type: 'success' | 'error' = 'success') =>
    {
        setToast({ text, type });
    };

    useEffect(() =>
    {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    const activeSlotId = saveManager.getActiveSlot();
    const currentMeta = slotsList.find(s => s.slotId === selectedSlot) ?? {
        slotId: selectedSlot,
        label: selectedSlot,
        exists: false,
        timestamp: null,
        highScore: 0,
        completedStagesCount: 0,
        activeSkinId: 'cyber-blue',
    };

    const handleSave = () =>
    {
        if (selectedSlot === 'autosave') return;
        if (onSaveGame)
        {
            onSaveGame(selectedSlot);
            refreshSlots();
            showToast(`✓ ບັນທຶກໃສ່ ${currentMeta.label} ສຳເລັດ!`);
        }
    };

    const handleLoad = () =>
    {
        if (!currentMeta.exists) return;
        if (onLoadGame)
        {
            onLoadGame(selectedSlot);
            refreshSlots();
            showToast(`✓ ໂຫຼດຂໍ້ມູນ ${currentMeta.label} ສຳເລັດ!`);
        }
    };

    const handleClearSlot = () =>
    {
        if (!currentMeta.exists) return;
        if (typeof window !== 'undefined' && window.confirm(`ທ່ານຕ້ອງການລຶບຂໍ້ມູນ Save ຂອງ ${currentMeta.label} ແທ້ບໍ?`))
        {
            saveManager.clearSlot(selectedSlot);
            refreshSlots();
            showToast(`✓ ລຶບ ${currentMeta.label} ສຳເລັດ!`);
        }
    };

    const handleCopyExport = () =>
    {
        const code = saveManager.exportSlotToString(selectedSlot);
        if (navigator?.clipboard?.writeText)
        {
            navigator.clipboard.writeText(code).then(() =>
            {
                showToast('✓ ຄັດລອກລະຫັດ Save ແລ້ວ!');
            }).catch(() =>
            {
                showToast('❌ ບໍ່ສາມາດຄັດລອກໄດ້', 'error');
            });
        }
    };

    const handleImport = () =>
    {
        if (!importInput.trim())
        {
            showToast('❌ ກະລຸນາວາງລະຫັດ Save ກ່ອນ', 'error');
            return;
        }

        const success = onImportGame
            ? onImportGame(importInput.trim(), selectedSlot)
            : saveManager.importSlotFromString(importInput.trim(), selectedSlot);

        if (success)
        {
            refreshSlots();
            setImportInput('');
            showToast(`✓ ນຳເຂົ້າຂໍ້ມູນໃສ່ ${currentMeta.label} ສຳເລັດ!`);
        }
        else
        {
            showToast('❌ ລະຫັດ Save ບໍ່ຖືກຕ້ອງ ຫຼື ເສຍຫາຍ', 'error');
        }
    };

    const formatTimestamp = (ts: number | null) =>
    {
        if (!ts) return 'ບໍ່ມີຂໍ້ມູນ (Empty)';
        const date = new Date(ts);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="skin-modal-overlay" onClick={onClose}>
            <div className="settings-modal-card" onClick={e => e.stopPropagation()}>
                <div className="skin-modal-header">
                    <h2>⚙️ ຕັ້ງຄ່າ & ບັນທຶກເກມ (Settings & Save)</h2>
                    <button
                        aria-label="Close"
                        className="skin-close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {toast && (
                    <div className={`save-toast-banner ${toast.type}`}>
                        {toast.text}
                    </div>
                )}

                {/* Section 1: Audio Preferences */}
                <div className="settings-section">
                    <div className="settings-section-title">🔊 Audio Preferences</div>
                    <div className="settings-toggle-row">
                        <span className="settings-row-label">
                            {isMuted ? '🔇' : '🔊'} Master Sound (SFX)
                        </span>
                        <button
                            className={`settings-switch-btn ${isMuted ? 'off' : 'on'}`}
                            onClick={onToggleMute}
                            type="button"
                        >
                            {isMuted ? 'OFF' : 'ON'}
                        </button>
                    </div>
                    <div className="settings-toggle-row">
                        <span className="settings-row-label">
                            {isMusicMuted ? '🔇' : '🎵'} 8-Bit Chiptune Music (BGM)
                        </span>
                        <button
                            className={`settings-switch-btn ${isMusicMuted ? 'off' : 'on'}`}
                            onClick={onToggleMusic}
                            type="button"
                        >
                            {isMusicMuted ? 'OFF' : 'ON'}
                        </button>
                    </div>
                </div>

                {/* Section 2: Save Slots & Data Persistence */}
                <div className="settings-section">
                    <div className="settings-section-title">
                        💾 ລະບົບ Save Game (Multi-Slot & Cloud Export)
                    </div>

                    {/* Slot selection tabs */}
                    <div className="save-slots-tabs">
                        {slotsList.map(slot =>
                        {
                            const isSelected = selectedSlot === slot.slotId;
                            const isActive = activeSlotId === slot.slotId;

                            return (
                                <button
                                    key={slot.slotId}
                                    className={`save-slot-tab ${isSelected ? 'selected' : ''} ${isActive ? 'active-slot' : ''}`}
                                    onClick={() => setSelectedSlot(slot.slotId)}
                                    type="button"
                                >
                                    <span className="slot-tab-name">{slot.label}</span>
                                    <span className="slot-tab-status">
                                        {slot.exists ? '● ມີຂໍ້ມູນ' : '○ ວ່າງ'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected Slot Metadata Card */}
                    <div className="save-slot-card">
                        <div className="slot-card-header">
                            <div>
                                <span className="slot-card-title">{currentMeta.label}</span>
                                {activeSlotId === currentMeta.slotId && (
                                    <span className="slot-current-badge">ຊ່ອງຫຼິ້ນຕອນນີ້ (Active)</span>
                                )}
                            </div>
                            <span className={`slot-exist-badge ${currentMeta.exists ? 'has-data' : 'empty'}`}>
                                {currentMeta.exists ? 'ບັນທຶກແລ້ວ' : 'ຊ່ອງວ່າງ'}
                            </span>
                        </div>

                        <div className="slot-card-details">
                            <div className="slot-detail-item">
                                <span className="slot-detail-lbl">🏆 ຄະແນນສູງສຸດ:</span>
                                <span className="slot-detail-val">{currentMeta.highScore.toLocaleString()} pts</span>
                            </div>
                            <div className="slot-detail-item">
                                <span className="slot-detail-lbl">🗺️ ດ່ານທີ່ຜ່ານ:</span>
                                <span className="slot-detail-val">{currentMeta.completedStagesCount} / 3 ດ່ານ</span>
                            </div>
                            <div className="slot-detail-item">
                                <span className="slot-detail-lbl">🕒 ບັນທຶກເມື່ອ:</span>
                                <span className="slot-detail-val">{formatTimestamp(currentMeta.timestamp)}</span>
                            </div>
                        </div>

                        {/* Slot Actions */}
                        <div className="slot-actions-row">
                            {selectedSlot !== 'autosave' && (
                                <button
                                    className="menu-action-btn primary save-btn-sm"
                                    onClick={handleSave}
                                    title="ບັນທຶກເກມຕອນນີ້ໃສ່ຊ່ອງນີ້"
                                    type="button"
                                >
                                    💾 ບັນທຶກເກມ (Save)
                                </button>
                            )}

                            <button
                                className="menu-action-btn secondary save-btn-sm"
                                disabled={!currentMeta.exists}
                                onClick={handleLoad}
                                style={{ opacity: currentMeta.exists ? 1 : 0.4 }}
                                title="ໂຫຼດຂໍ້ມູນຈາກຊ່ອງນີ້"
                                type="button"
                            >
                                📂 ໂຫຼດເກມ (Load)
                            </button>

                            {selectedSlot !== 'autosave' && (
                                <button
                                    className="menu-action-btn danger save-btn-sm"
                                    disabled={!currentMeta.exists}
                                    onClick={handleClearSlot}
                                    style={{ opacity: currentMeta.exists ? 1 : 0.4 }}
                                    title="ລຶບ Save ຊ່ອງນີ້"
                                    type="button"
                                >
                                    🗑️ ລຶບ
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Export / Import Toggle Section */}
                    <div className="export-import-accordion">
                        <button
                            className="export-import-toggle-btn"
                            onClick={() => setIsExportImportOpen(!isExportImportOpen)}
                            type="button"
                        >
                            <span>📋 ສົ່ງອອກ / ນຳເຂົ້າ Save (Export / Import Code)</span>
                            <span>{isExportImportOpen ? '▲' : '▼'}</span>
                        </button>

                        {isExportImportOpen && (
                            <div className="export-import-panel">
                                <div className="export-box">
                                    <label className="export-label">
                                        ລະຫັດ Save ປະຈຸບັນ ({currentMeta.label}):
                                    </label>
                                    <div className="export-input-row">
                                        <input
                                            readOnly
                                            className="export-input"
                                            value={saveManager.exportSlotToString(selectedSlot)}
                                        />
                                        <button
                                            className="menu-action-btn secondary save-btn-sm"
                                            onClick={handleCopyExport}
                                            type="button"
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>

                                <div className="import-box">
                                    <label className="export-label">
                                        ວາງລະຫັດ Save ເພື່ອນຳເຂົ້າໃສ່ ({currentMeta.label}):
                                    </label>
                                    <div className="export-input-row">
                                        <input
                                            className="export-input"
                                            onChange={e => setImportInput(e.target.value)}
                                            placeholder="Paste base64 save code here..."
                                            value={importInput}
                                        />
                                        <button
                                            className="menu-action-btn primary save-btn-sm"
                                            onClick={handleImport}
                                            type="button"
                                        >
                                            📥 ນຳເຂົ້າ (Import)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Controls Guide */}
                <div className="settings-section">
                    <div className="settings-section-title">🎮 Controls Guide</div>
                    <div className="controls-guide-grid">
                        <div className="control-item">
                            <span className="control-key">⬅️ ➡️ / A D</span>
                            <span>Move Left/Right</span>
                        </div>
                        <div className="control-item">
                            <span className="control-key">⬆️ / W / Space</span>
                            <span>Jump / Double Jump</span>
                        </div>
                        <div className="control-item">
                            <span className="control-key">M</span>
                            <span>Mute Audio</span>
                        </div>
                        <div className="control-item">
                            <span className="control-key">B</span>
                            <span>Toggle BGM</span>
                        </div>
                    </div>
                </div>

                {/* Section 4: Data Management (Reset) */}
                <div className="settings-section">
                    <div className="settings-section-title">⚠️ Data Management</div>
                    <button
                        className="menu-action-btn secondary"
                        onClick={onClearAllData}
                        style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        type="button"
                    >
                        🗑️ ລ້າງຄະແນນ & ຂໍ້ມູນທັງໝົດ (Reset All Data)
                    </button>
                </div>
            </div>
        </div>
    );
}

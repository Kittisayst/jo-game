import React, { useState } from 'react';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { AVAILABLE_PETS, PetDefinition } from '../../../domain/entities/Pet';
import { buyPetUseCase, equipPetUseCase, dismissPetUseCase } from '../../../application/PetUseCases';
import { autoSaveGame } from '../../saveSnapshot';
import { EventBus } from '../../EventBus';

interface PetShopModalProps
{
    isOpen: boolean;
    onClose: () => void;
}

export const PetShopModal: React.FC<PetShopModalProps> = ({ isOpen, onClose }) =>
{
    const [, setRevision] = useState(0);

    if (!isOpen) return null;

    const petManager = entities.petManager;
    const wallet = entities.wallet;

    const handleBuy = (pet: PetDefinition) =>
    {
        const result = buyPetUseCase(petManager, pet.id, wallet);
        if (result.success)
        {
            soundManager.playPowerUp();
            if (pet.soundType === 'dog') soundManager.playPetDog();
            else soundManager.playChickenCluck();

            setRevision(r => r + 1);
            autoSaveGame();
            EventBus.emit('pet-changed', pet.id);
        }
        else
        {
            soundManager.playHurt();
        }
    };

    const handleEquip = (pet: PetDefinition) =>
    {
        const success = equipPetUseCase(petManager, pet.id);
        if (success)
        {
            soundManager.playCoin();
            if (pet.soundType === 'dog') soundManager.playPetDog();
            else soundManager.playChickenCluck();

            setRevision(r => r + 1);
            autoSaveGame();
            EventBus.emit('pet-changed', pet.id);
        }
    };

    const handleDismiss = () =>
    {
        dismissPetUseCase(petManager);
        soundManager.playHurt();
        setRevision(r => r + 1);
        autoSaveGame();
        EventBus.emit('pet-changed', null);
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
        }}>
            <div
                className="modal-container pet-shop-modal"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#1e293b',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '560px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.25)',
                    overflow: 'hidden',
                    color: '#f8fafc',
                    fontFamily: '"Noto Sans Lao", system-ui, sans-serif',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#0f172a',
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🐾</span> ຮ້ານສັດລ້ຽງ & ຄູ່ຫູ (Pet Companion Shop)
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                            ຊື້ສັດລ້ຽງ ແລະ ກົດນຳໃຊ້ ເພື່ອໃຫ້ຕິດຕາມ Hero ໄປຜະຈົນໄພ
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: '#0284c725',
                            border: '1px solid #38bdf8',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#38bdf8',
                        }}>
                            🪙 {wallet.balance} Credit
                        </div>
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={onClose}
                            style={{
                                background: '#334155',
                                border: 'none',
                                color: '#cbd5e1',
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Pet List */}
                <div style={{
                    padding: '16px 20px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    {AVAILABLE_PETS.map(pet =>
                    {
                        const isOwned = petManager.isOwned(pet.id);
                        const isActive = petManager.isActive(pet.id);
                        const canAfford = wallet.balance >= pet.price;

                        return (
                            <div
                                key={pet.id}
                                style={{
                                    background: isActive ? '#451a0340' : '#0f172a',
                                    border: `1.5px solid ${isActive ? '#f59e0b' : isOwned ? '#38bdf8' : '#334155'}`,
                                    borderRadius: '10px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '14px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                    <div style={{
                                        fontSize: '2.2rem',
                                        width: '54px',
                                        height: '54px',
                                        background: '#1e293b',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #475569',
                                        flexShrink: 0,
                                    }}>
                                        {pet.icon}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>
                                                {pet.name}
                                            </span>
                                            {isActive && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    background: '#eab30825',
                                                    color: '#facc15',
                                                    border: '1px solid #facc15',
                                                    padding: '1px 8px',
                                                    borderRadius: '4px',
                                                    fontWeight: 600,
                                                }}>
                                                    ✨ ກຳລັງຕິດຕາມ
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                                            {pet.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    {!isOwned ? (
                                        <button
                                            type="button"
                                            disabled={!canAfford}
                                            onClick={() => handleBuy(pet)}
                                            style={{
                                                background: canAfford ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#334155',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: canAfford ? '#ffffff' : '#64748b',
                                                padding: '8px 14px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            🪙 ຊື້ ({pet.price} C)
                                        </button>
                                    ) : isActive ? (
                                        <button
                                            type="button"
                                            onClick={handleDismiss}
                                            style={{
                                                background: '#475569',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#f1f5f9',
                                                padding: '8px 14px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            🏠 ພັກຜ່ອນ
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleEquip(pet)}
                                            style={{
                                                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#ffffff',
                                                padding: '8px 14px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            🐾 ນຳໃຊ້ (ຕິດຕາມ)
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

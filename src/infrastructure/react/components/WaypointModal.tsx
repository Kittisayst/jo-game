import React from 'react';
import { returnToVillageUseCase } from '../../../application/ReturnToVillageUseCase';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';

interface WaypointModalProps
{
    isOpen: boolean;
    onClose: () => void;
    waypointName?: string;
    onReturnConfirmed?: () => void;
}

export const WaypointModal: React.FC<WaypointModalProps> = ({
    isOpen,
    onClose,
    waypointName = 'ຈຸດວາບປອດໄພ',
    onReturnConfirmed,
}) =>
{
    if (!isOpen) return null;

    const handleReturn = () =>
    {
        returnToVillageUseCase('safe_waypoint', entities.backpack);
        soundManager.playPowerUp();
        onClose();
        if (onReturnConfirmed)
        {
            onReturnConfirmed();
        }
        else
        {
            EventBus.emit('change-level', 'village');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/50 shadow-2xl p-6 space-y-4 text-center">
                <span className="text-5xl animate-bounce">🌀</span>
                <h3 className="text-xl font-bold text-cyan-300">{waypointName}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                    ທ່ານກຳລັງຢືນຢູ່ຈຸດວາບປອດໄພ! ການວາບກັບຄືນໝູ່ບ້ານຈາກຈຸດນີ້ຈະ{' '}
                    <span className="text-emerald-400 font-bold">ຮັກສາວັດສະດຸທັງໝົດ 100%</span>{' '}
                    ແລະ ຟື້ນຟູພະລັງຊີວິດເຕັມທັນທີ.
                </p>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                    🎒 ວັດສະດຸໃນກະເປົາປັດຈຸບັນ: {entities.backpack.usedSlotsCount} / 20 ຊ່ອງ
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
                    >
                        ສຳຫຼວດຕໍ່ໄປ
                    </button>
                    <button
                        onClick={handleReturn}
                        className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-600/30"
                    >
                        ວາບກັບໝູ່ບ້ານ
                    </button>
                </div>
            </div>
        </div>
    );
};


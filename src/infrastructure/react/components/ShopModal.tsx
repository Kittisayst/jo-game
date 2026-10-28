import React, { useState } from 'react';
import { WEAPON_CATALOG, WeaponDefinition } from '../../../domain/entities/Weapon';
import { UPGRADE_CATALOG, UpgradeDefinition } from '../../../domain/entities/Upgrade';
import { ITEM_CATALOG, ItemDefinition } from '../../../domain/entities/Inventory';
import { purchaseWeaponUseCase } from '../../../application/PurchaseWeaponUseCase';
import { purchaseUpgradeUseCase } from '../../../application/PurchaseUpgradeUseCase';
import { purchaseItemUseCase } from '../../../application/PurchaseItemUseCase';
import { equipWeaponUseCase } from '../../../application/EquipWeaponUseCase';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';

export interface ShopModalProps
{
    walletBalance: number;
    equippedWeaponId: string;
    onClose: () => void;
    onUpdateWallet: (balance: number) => void;
    onUpdateWeapon: (weaponId: string) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
    walletBalance,
    equippedWeaponId,
    onClose,
    onUpdateWallet,
    onUpdateWeapon,
}) =>
{
    const [activeTab, setActiveTab] = useState<'weapons' | 'upgrades' | 'items'>('weapons');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) =>
    {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const handleBuyWeapon = (weapon: WeaponDefinition) =>
    {
        const success = purchaseWeaponUseCase(entities.wallet, entities.weaponLoadout, weapon.id);
        if (success)
        {
            soundManager.playBuy();
            onUpdateWallet(entities.wallet.balance);
            onUpdateWeapon(entities.weaponLoadout.equippedId);
            showToast(`🎉 ໄດ້ຮັບອາວຸດ: ${weapon.name}!`);
        }
        else
        {
            soundManager.playHurt();
            showToast('❌ ບໍ່ສາມາດຊື້ໄດ້ (ຫຼຽນບໍ່ພໍ ຫຼື ມີແລ້ວ)');
        }
    };

    const handleEquipWeapon = (weaponId: string) =>
    {
        const success = equipWeaponUseCase(entities.weaponLoadout, weaponId);
        if (success)
        {
            soundManager.playSelect();
            onUpdateWeapon(weaponId);
            showToast(`⚔️ ຕິດຕັ້ງອາວຸດຮຽບຮ້ອຍ!`);
        }
    };

    const handleBuyUpgrade = (upgrade: UpgradeDefinition) =>
    {
        const success = purchaseUpgradeUseCase(entities.wallet, entities.upgradeTree, upgrade.id);
        if (success)
        {
            soundManager.playBuy();
            onUpdateWallet(entities.wallet.balance);
            showToast(`⬆️ ອັບເກຣດ ${upgrade.name} ສຳເລັດ!`);
        }
        else
        {
            soundManager.playHurt();
            showToast('❌ ບໍ່ສາມາດອັບເກຣດໄດ້ (ຫຼຽນບໍ່ພໍ ຫຼື ເຕັມແລ້ວ)');
        }
    };

    const handleBuyItem = (item: ItemDefinition) =>
    {
        const success = purchaseItemUseCase(entities.wallet, entities.inventory, item.id);
        if (success)
        {
            soundManager.playBuy();
            onUpdateWallet(entities.wallet.balance);
            showToast(`🧪 ຊື້ ${item.name} ສຳເລັດ!`);
        }
        else
        {
            soundManager.playHurt();
            showToast('❌ ບໍ່ສາມາດຊື້ໄດ້ (ຫຼຽນບໍ່ພໍ ຫຼື ກະເປົາເຕັມ)');
        }
    };

    return (
        <div className="shop-modal-overlay" role="dialog" aria-modal="true">
            <div className="shop-modal-card">
                {/* Header */}
                <div className="shop-header">
                    <div className="shop-title-container">
                        <h2 className="shop-title">🛒 CYBER SHOP</h2>
                        <span className="shop-subtitle">ຮ້ານຄ້າໄຊເບີ • ອັບເກຣດອາວຸດ, ພະລັງ, ແລະ ໄອເທັມ</span>
                    </div>

                    <div className="shop-header-right">
                        <div className="wallet-badge" title="ຍອດເງິນຫຼຽນຄົງເຫຼືອ">
                            <span className="wallet-icon">🪙</span>
                            <span className="wallet-amount">{walletBalance}</span>
                        </div>
                        <button
                            className="shop-close-btn"
                            onClick={onClose}
                            title="ປິດຮ້ານຄ້າ (Esc)"
                            type="button"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Toast alert */}
                {toastMessage && (
                    <div className="shop-toast-banner animate-fade-in">
                        {toastMessage}
                    </div>
                )}

                {/* Tabs */}
                <div className="shop-tabs">
                    <button
                        autoFocus
                        className={`shop-tab-btn ${activeTab === 'weapons' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('weapons')}
                        type="button"
                    >
                        ⚔️ ອາວຸດ (Weapons)
                    </button>
                    <button
                        className={`shop-tab-btn ${activeTab === 'upgrades' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('upgrades')}
                        type="button"
                    >
                        ⬆️ ອັບເກຣດ (Upgrades)
                    </button>
                    <button
                        className={`shop-tab-btn ${activeTab === 'items' ? 'is-active' : ''}`}
                        onClick={() => setActiveTab('items')}
                        type="button"
                    >
                        🧪 ໄອເທັມ (Items)
                    </button>
                </div>

                {/* Tab Content */}
                <div className="shop-content-panel">
                    {/* Weapons Tab */}
                    {activeTab === 'weapons' && (
                        <div className="shop-grid">
                            {WEAPON_CATALOG.map((weapon) =>
                            {
                                const isOwned = entities.weaponLoadout.hasWeapon(weapon.id);
                                const isEquipped = equippedWeaponId === weapon.id;
                                const canAfford = walletBalance >= weapon.price;

                                return (
                                    <div
                                        key={weapon.id}
                                        className={`shop-item-card ${isEquipped ? 'is-equipped' : ''}`}
                                    >
                                        <div className="shop-item-icon">{weapon.icon}</div>
                                        <div className="shop-item-info">
                                            <h3 className="shop-item-name">{weapon.name}</h3>
                                            <p className="shop-item-desc">{weapon.description}</p>
                                            <div className="shop-item-stats">
                                                <span>⚔️ ພະລັງ: {weapon.baseDamage} DMG</span>
                                                <span>⏱️ ຄູລດາວ: {weapon.cooldownMs}ms</span>
                                                <span>🎯 ໄລຍະ: {weapon.range}px</span>
                                            </div>
                                        </div>

                                        <div className="shop-item-action">
                                            {isOwned ? (
                                                <button
                                                    className={`shop-btn ${isEquipped ? 'btn-equipped' : 'btn-equip'}`}
                                                    disabled={isEquipped}
                                                    onClick={() => handleEquipWeapon(weapon.id)}
                                                    type="button"
                                                >
                                                    {isEquipped ? '✓ ຕິດຕັ້ງແລ້ວ' : 'ຕິດຕັ້ງ (Equip)'}
                                                </button>
                                            ) : (
                                                <button
                                                    className={`shop-btn btn-buy ${!canAfford ? 'btn-disabled' : ''}`}
                                                    disabled={!canAfford}
                                                    onClick={() => handleBuyWeapon(weapon)}
                                                    type="button"
                                                >
                                                    🪙 {weapon.price} (ຊື້)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Upgrades Tab */}
                    {activeTab === 'upgrades' && (
                        <div className="shop-grid">
                            {UPGRADE_CATALOG.map((def) =>
                            {
                                const currentLevel = entities.upgradeTree.getLevel(def.id);
                                const isMaxLevel = currentLevel >= def.maxLevel;
                                const nextCost = entities.upgradeTree.getNextCost(def.id);
                                const canAfford = nextCost !== null && walletBalance >= nextCost;

                                return (
                                    <div key={def.id} className="shop-item-card">
                                        <div className="shop-item-icon">{def.icon}</div>
                                        <div className="shop-item-info">
                                            <div className="shop-item-header-row">
                                                <h3 className="shop-item-name">{def.name}</h3>
                                                <span className="shop-level-pill">
                                                    Lv {currentLevel} / {def.maxLevel}
                                                </span>
                                            </div>
                                            <p className="shop-item-desc">{def.description}</p>
                                            <div className="shop-progress-bar">
                                                <div
                                                    className="shop-progress-fill"
                                                    style={{ width: `${(currentLevel / def.maxLevel) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="shop-item-action">
                                            {isMaxLevel ? (
                                                <button className="shop-btn btn-maxed" disabled type="button">
                                                    ⭐ ເຕັມແລ້ວ (MAX)
                                                </button>
                                            ) : (
                                                <button
                                                    className={`shop-btn btn-buy ${!canAfford ? 'btn-disabled' : ''}`}
                                                    disabled={!canAfford}
                                                    onClick={() => handleBuyUpgrade(def)}
                                                    type="button"
                                                >
                                                    🪙 {nextCost} (ອັບເກຣດ)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Items Tab */}
                    {activeTab === 'items' && (
                        <div className="shop-grid">
                            {ITEM_CATALOG.map((item) =>
                            {
                                const currentCount = entities.inventory.getCount(item.id);
                                const isFull = currentCount >= item.maxStack;
                                const canAfford = walletBalance >= item.price;

                                return (
                                    <div key={item.id} className="shop-item-card">
                                        <div className="shop-item-icon">{item.icon}</div>
                                        <div className="shop-item-info">
                                            <div className="shop-item-header-row">
                                                <h3 className="shop-item-name">{item.name}</h3>
                                                <span className="shop-level-pill">
                                                    ມີ: {currentCount} / {item.maxStack}
                                                </span>
                                            </div>
                                            <p className="shop-item-desc">{item.description}</p>
                                            <div className="shop-item-stats">
                                                <span>⚡ ປຸ່ມລັດ: [1 - 3] ໃນເກມ</span>
                                            </div>
                                        </div>

                                        <div className="shop-item-action">
                                            {isFull ? (
                                                <button className="shop-btn btn-maxed" disabled type="button">
                                                    📦 ເຕັມແລ້ວ
                                                </button>
                                            ) : (
                                                <button
                                                    className={`shop-btn btn-buy ${!canAfford ? 'btn-disabled' : ''}`}
                                                    disabled={!canAfford}
                                                    onClick={() => handleBuyItem(item)}
                                                    type="button"
                                                >
                                                    🪙 {item.price} (ຊື້)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Controls Info */}
                <div className="shop-footer">
                    <span>💡 ຄຳແນະນຳ: ຫຼຽນທີ່ເກັບໄດ້ໃນດ່ານຈະຖືກໂອນເຂົ້າກະເປົາເມື່ອຜ່ານດ່ານ!</span>
                </div>
            </div>
        </div>
    );
};

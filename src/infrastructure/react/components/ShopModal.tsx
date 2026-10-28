import React, { useState } from 'react';
import { UPGRADE_CATALOG, UpgradeDefinition } from '../../../domain/entities/Upgrade';
import { ITEM_CATALOG, ItemDefinition } from '../../../domain/entities/Inventory';
import { purchaseUpgradeUseCase } from '../../../application/PurchaseUpgradeUseCase';
import { purchaseItemUseCase } from '../../../application/PurchaseItemUseCase';
import { STARTER_BOOK_CREDIT_RESERVE } from '../../../domain/entities/SaveData';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';

export interface ShopModalProps
{
    walletBalance: number;
    onClose: () => void;
    onUpdateWallet: (balance: number) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
    walletBalance,
    onClose,
    onUpdateWallet,
}) =>
{
    const [activeTab, setActiveTab] = useState<'upgrades' | 'items'>('upgrades');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) =>
    {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const wouldBreakStarterBookReserve = (cost: number): boolean =>
    {
        if (entities.books['book-ch1']?.isUnlocked) return false;
        return entities.wallet.balance - cost < STARTER_BOOK_CREDIT_RESERVE;
    };

    const handleBuyUpgrade = (upgrade: UpgradeDefinition) =>
    {
        const nextCost = entities.upgradeTree.getNextCost(upgrade.id);
        if (nextCost !== null && wouldBreakStarterBookReserve(nextCost))
        {
            soundManager.playHurt();
            showToast(`📚 ກະລຸນາສະຫງວນ ${STARTER_BOOK_CREDIT_RESERVE} Credit ໄວ້ຊື້ປຶ້ມຕຳລາບົດທີ 1 ທີ່ຫໍສະໝຸດກ່ອນ!`);
            return;
        }
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
        if (wouldBreakStarterBookReserve(item.price))
        {
            soundManager.playHurt();
            showToast(`📚 ກະລຸນາສະຫງວນ ${STARTER_BOOK_CREDIT_RESERVE} Credit ໄວ້ຊື້ປຶ້ມຕຳລາບົດທີ 1 ທີ່ຫໍສະໝຸດກ່ອນ!`);
            return;
        }
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
                        className={`shop-tab-btn ${activeTab === 'upgrades' ? 'is-active' : ''}`}
                        autoFocus
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

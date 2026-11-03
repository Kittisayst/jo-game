import React, { useState, useMemo } from 'react';
import { entities } from '../../composition';
import { CraftingStatus } from './CraftingStatus';
import { RecipeListView, RecipeInspectorView } from './RecipeGrid';
import { RepairList } from './RepairList';
import { ToolUpgradePanel } from './ToolUpgradePanel';
import { WeaponUpgradePanel } from './WeaponUpgradePanel';
import { BookFrame, BookTabItem } from './book/BookFrame';
import { getGameContent } from '../../content/ContentCatalog';
import type { RecipeDefinition } from '../../../application/CraftRecipeUseCase';

export type SmithyTab = 'tools' | 'weapons' | 'upgrade' | 'repair';

interface SmithyModalProps {
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
 * Styled as an authentic adventurer's crafting journal (Minecraft Legends open-book style).
 */
export const SmithyModal: React.FC<SmithyModalProps> = ({ isOpen, tab, onTabChange, onClose }) => {
    const [, setRevision] = useState(0);

    const workshopRecipes = useMemo<RecipeDefinition[]>(() => getGameContent().recipes.filter(
        (r): r is RecipeDefinition => r.building === 'workshop' && 'resultItemId' in r
    ), []);

    const forgeRecipes = useMemo<RecipeDefinition[]>(() => getGameContent().recipes.filter(
        (r): r is RecipeDefinition => r.building === 'forge' && 'resultItemId' in r
    ), []);

    const [selectedWorkshopRecipeId, setSelectedWorkshopRecipeId] = useState<string | null>(workshopRecipes[0]?.id || null);
    const [selectedForgeRecipeId, setSelectedForgeRecipeId] = useState<string | null>(forgeRecipes[0]?.id || null);

    if (!isOpen) return null;

    const refresh = () => setRevision(r => r + 1);
    const isForgeUnlocked = entities.forgeUnlocked || entities.books['book-ch1']?.examPassed;
    const forgeLocked = !isForgeUnlocked && tab === 'weapons';

    const bookTabs: BookTabItem[] = TABS.map(t => ({
        id: t.id,
        label: t.label,
        icon: t.icon,
        testId: `smithy-tab-${t.id}`,
        badge: t.id === 'weapons' && !isForgeUnlocked ? '🔒' : undefined,
    }));

    // Choose Left and Right pages based on current tab
    let leftPageContent: React.ReactNode = null;
    let rightPageContent: React.ReactNode = null;

    if (tab === 'tools') {
        const activeRecipe = workshopRecipes.find(r => r.id === (selectedWorkshopRecipeId || workshopRecipes[0]?.id)) || workshopRecipes[0] || null;
        leftPageContent = (
            <div className="space-y-3">
                <CraftingStatus onCollected={refresh} />
                <RecipeListView
                    building="workshop"
                    selectedRecipeId={selectedWorkshopRecipeId || workshopRecipes[0]?.id || null}
                    onSelectRecipe={setSelectedWorkshopRecipeId}
                    onChanged={refresh}
                />
            </div>
        );
        rightPageContent = (
            <RecipeInspectorView
                building="workshop"
                recipe={activeRecipe}
                onChanged={refresh}
            />
        );
    } else if (tab === 'weapons') {
        if (forgeLocked) {
            leftPageContent = (
                <div className="p-6 text-center space-y-4 my-auto" data-testid="smithy-forge-locked">
                    <span className="text-6xl">🔒</span>
                    <h3 className="text-xl font-bold book-heading">ເຕົາຫຼອມຍັງບໍ່ເປີດ</h3>
                    <p className="book-text text-sm max-w-xs mx-auto">
                        ຊ່າງຕີເຫຼັກຕ້ອງການນັກຮົບທີ່ມີພື້ນຖານຄວາມຮູ້! ສອບເສັງຜ່ານ <span className="text-[#b45309] font-bold">ບົດທີ 1</span> ທີ່ສະຖາບັນກ່ອນ ຈຶ່ງຈະຫຼອມອາວຸດ ແລະ ອັບເກຣດອາວຸດໄດ້. ເຄື່ອງມື, ການອັບເກຣດເຄື່ອງມື ແລະການສ້ອມແປງໃຊ້ໄດ້ເລີຍ.
                    </p>
                </div>
            );
            rightPageContent = (
                <div className="p-6 text-center space-y-4 my-auto">
                    <span className="text-5xl">📖</span>
                    <h3 className="text-lg font-bold book-heading">ຕຳລາບົດທີ 1: ພື້ນຖານການຫຼອມ</h3>
                    <p className="book-text text-sm">
                        ໄປທີ່ສະຖາບັນ (Academy) ເພື່ອຮຽນຮູ້ ແລະ ເຮັດບົດສອບເສັງ
                    </p>
                </div>
            );
        } else {
            const activeRecipe = forgeRecipes.find(r => r.id === (selectedForgeRecipeId || forgeRecipes[0]?.id)) || forgeRecipes[0] || null;
            leftPageContent = (
                <div className="space-y-3">
                    <CraftingStatus onCollected={refresh} />
                    <RecipeListView
                        building="forge"
                        selectedRecipeId={selectedForgeRecipeId || forgeRecipes[0]?.id || null}
                        onSelectRecipe={setSelectedForgeRecipeId}
                        onChanged={refresh}
                    />
                </div>
            );
            rightPageContent = (
                <RecipeInspectorView
                    building="forge"
                    recipe={activeRecipe}
                    onChanged={refresh}
                />
            );
        }
    } else if (tab === 'upgrade') {
        leftPageContent = (
            <div className="space-y-3">
                <h3 className="font-bold book-heading text-base flex items-center gap-2">
                    <span>⬆️</span><span>ອັບເກຣດເຄື່ອງມື (Tools)</span>
                </h3>
                <div className="book-filigree-divider" />
                <ToolUpgradePanel onChanged={refresh} />
            </div>
        );
        rightPageContent = (
            <div className="space-y-3">
                <h3 className="font-bold book-heading text-base flex items-center gap-2">
                    <span>✨</span><span>ອັບເກຣດຂັ້ນອາວຸດ (Weapons +1..+3)</span>
                </h3>
                <div className="book-filigree-divider" />
                {isForgeUnlocked ? (
                    <WeaponUpgradePanel onChanged={refresh} />
                ) : (
                    <div className="p-6 text-center space-y-2 book-text" data-testid="smithy-forge-locked">
                        <span className="text-3xl">🔒</span>
                        <p className="text-sm font-bold">ສອບເສັງບົດທີ 1 ກ່ອນ ຈຶ່ງຈະອັບເກຣດອາວຸດໄດ້</p>
                    </div>
                )}
            </div>
        );
    } else {
        leftPageContent = (
            <div className="space-y-3" data-testid="workshop-repairs">
                <h3 className="font-bold book-heading text-base flex items-center gap-2">
                    <span>🛠️</span><span>ສ້ອມແປງເຄື່ອງມື (Tools)</span>
                </h3>
                <div className="book-filigree-divider" />
                <RepairList building="workshop" />
            </div>
        );
        rightPageContent = (
            <div className="space-y-3" data-testid="forge-repairs">
                <h3 className="font-bold book-heading text-base flex items-center gap-2">
                    <span>⚔️</span><span>ສ້ອມແປງອາວຸດ & ເກາະ (Weapons)</span>
                </h3>
                <div className="book-filigree-divider" />
                <RepairList building="forge" />
            </div>
        );
    }

    return (
        <BookFrame
            isOpen={isOpen}
            onClose={onClose}
            title="ໂຮງຊ່າງ & ໂຮງຕີເຫຼັກ (Smithy)"
            icon="⚒️"
            subtitle="ສ້າງເຄື່ອງມື ຫຼອມອາວຸດ ອັບເກຣດ ແລະ ສ້ອມແປງ ໃນບ່ອນດຽວ"
            tabs={bookTabs}
            activeTab={tab}
            onTabChange={t => onTabChange(t as SmithyTab)}
            leftPage={leftPageContent}
            rightPage={rightPageContent}
            footer={
                <div className="flex items-center justify-between w-full font-mono text-xs text-[#eedec2]">
                    <span>🎒 ກະເປົາ: {entities.backpack.usedSlotsCount} / {entities.backpack.maxSlots} ຊ່ອງ · ⚔️ ATK {entities.equipment.currentAttackPower}</span>
                    <span>🎓 ເຄຣດິດ: {entities.wallet.balance}</span>
                </div>
            }
        />
    );
};

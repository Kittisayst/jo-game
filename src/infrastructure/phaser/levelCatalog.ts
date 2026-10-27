export interface LevelCatalogItem
{
    key: string;
    name: string;
    shortTitle: string;
    hudLabel: string;
    description: string;
    assetPath: string;
    isBoss: boolean;
}

export const LEVEL_CATALOG: LevelCatalogItem[] = [
    {
        key: 'village',
        name: '🏡 ໝູ່ບ້ານເລີ່ມຕົ້ນ (Starter Village)',
        shortTitle: 'Village 🏡',
        hudLabel: 'ໝູ່ບ້ານ (Village)',
        description: 'ໝູ່ບ້ານສະຫງົບສຸກ, ເກັບຫຼຽນ, ຊອກຫາປະຕູໄປ Level 1',
        assetPath: 'assets/levels/village.json',
        isBoss: false,
    },
    {
        key: 'level-1',
        name: 'ດ່ານ 1: Green Plains',
        shortTitle: 'Level 1',
        hudLabel: 'Level 1',
        description: 'ທົ່ງຫຍ້າຂຽວ, ເກັບຫຼຽນ, ຢຽບ Slime',
        assetPath: 'assets/levels/level-1.json',
        isBoss: false,
    },
    {
        key: 'level-2',
        name: 'ດ່ານ 2: Sky Islands',
        shortTitle: 'Level 2',
        hudLabel: 'Level 2',
        description: 'ພື້ນເລື່ອນ Hover, ດົງໜາມ Spikes, Power-ups',
        assetPath: 'assets/levels/level-2.json',
        isBoss: false,
    },
    {
        key: 'level-3',
        name: 'ດ່ານ 3: King Slime Boss Arena 👑',
        shortTitle: 'Level 3 👑',
        hudLabel: 'Level 3 (👑 Boss)',
        description: 'ສູ້ Boss ຍັກ King Slime, ແຖບເລືອດ Boss HP',
        assetPath: 'assets/levels/level-3.json',
        isBoss: true,
    },
];

export function getLevelItem (key: string): LevelCatalogItem | undefined
{
    return LEVEL_CATALOG.find(item => item.key === key);
}

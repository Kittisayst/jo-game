export interface LevelCatalogItem
{
    key: string;
    name: string;
    shortTitle: string;
    hudLabel: string;
    description: string;
    assetPath: string;
    isBoss: boolean;
    order: number;
    prerequisite?: string;
    badgeIcon: string;
    tag: string;
}

export const LEVEL_CATALOG: LevelCatalogItem[] = [
    {
        key: 'village',
        name: '🏡 ໝູ່ບ້ານແຫ່ງປັນຍາ (Knowledge Village)',
        shortTitle: 'Village 🏡',
        hudLabel: 'ໝູ່ບ້ານ',
        description: 'ສູນກາງການຮຽນຮູ້: ຫໍສະໝຸດ, ສະຖາບັນ, ໂຮງຊ່າງ, ໂຮງຕີເຫຼັກ ແລະ ປະຕູມິຕິ',
        assetPath: 'assets/levels/village.json',
        isBoss: false,
        order: 0,
        badgeIcon: '🏡',
        tag: 'Peaceful Hub',
    },
    {
        key: 'stage-ch1',
        name: 'ບົດທີ 1: ປ່າແຫ່ງຄວາມຮູ້ & ຖ້ຳສາຍແຮ່',
        shortTitle: 'Chapter 1 🌲',
        hudLabel: 'ບົດທີ 1',
        description: '4 ເຂດສຳຫຼວດ: ປ່າໄມ້, ຖ້ຳສາຍແຮ່, ປະຕູຫັກພັງ, ແລະ ລານປະລອງບອສໃຫຍ່',
        assetPath: 'assets/levels/stage-ch1.json',
        isBoss: true,
        order: 1,
        badgeIcon: '🌲',
        tag: 'Chapter 1',
    },
];

export function getLevelItem (key: string): LevelCatalogItem | undefined
{
    return LEVEL_CATALOG.find(item => item.key === key);
}

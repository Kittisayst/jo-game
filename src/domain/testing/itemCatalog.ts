import itemsJson from '../../../public/data/items.json';
import { ItemCatalog, ItemDefinition } from '../entities/ItemCatalog';

/** The real `items.json` as a catalog, so tests exercise the same data the game ships with. */
export function createTestItemCatalog (): ItemCatalog
{
    return new ItemCatalog(itemsJson as ItemDefinition[]);
}

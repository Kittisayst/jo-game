import { describe, expect, it } from 'vitest';
import { Inventory } from '../domain/entities/Inventory';
import { useItemUseCase } from './UseItemUseCase';

describe('UseItemUseCase', () =>
{
    it('successfully consumes item and returns definition', () =>
    {
        const inv = new Inventory({ 'heal-potion': 1 });
        const result = useItemUseCase(inv, 'heal-potion');

        expect(result.success).toBe(true);
        expect(result.item?.id).toBe('heal-potion');
        expect(inv.getItemCount('heal-potion')).toBe(0);
    });

    it('fails when item is not in inventory', () =>
    {
        const inv = new Inventory();
        const result = useItemUseCase(inv, 'heal-potion');

        expect(result.success).toBe(false);
        expect(result.item).toBeUndefined();
    });
});

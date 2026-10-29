import { describe, expect, it } from 'vitest';
import { ResourceNode } from './ResourceNode';

describe('ResourceNode', () =>
{
    it('starts untouched and needs the given number of Strikes', () =>
    {
        const node = new ResourceNode(3);

        expect(node.strikesNeeded).toBe(3);
        expect(node.strikesTaken).toBe(0);
        expect(node.isDepleted).toBe(false);
    });

    it('is depleted only when the last Strike lands', () =>
    {
        const node = new ResourceNode(3);

        node.registerStrike();
        node.registerStrike();
        expect(node.strikesTaken).toBe(2);
        expect(node.isDepleted).toBe(false);

        node.registerStrike();
        expect(node.strikesTaken).toBe(3);
        expect(node.isDepleted).toBe(true);
    });

    it('does not count Strikes beyond the last one', () =>
    {
        const node = new ResourceNode(1);

        node.registerStrike();
        node.registerStrike();

        expect(node.strikesTaken).toBe(1);
    });

    it('rejects a node that needs no Strikes or a fraction of one', () =>
    {
        expect(() => new ResourceNode(0)).toThrow();
        expect(() => new ResourceNode(-2)).toThrow();
        expect(() => new ResourceNode(1.5)).toThrow();
    });
});

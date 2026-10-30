import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { DomainEvents } from '../domain/DomainEvents';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import { RealmProgression } from '../domain/entities/RealmProgression';
import { StageProgression } from '../domain/entities/StageProgression';
import { placePortalBlockUseCase, REALM_OPENED_EVENT, RealmPortal } from './PlacePortalBlockUseCase';

const realms: RealmPortal[] = [
    { number: 1, blockItem: 'portal-block-green' },
    { number: 2, blockItem: 'portal-block-blue' },
    { number: 3, blockItem: 'portal-block-yellow' },
];

const catalog = new ItemCatalog([
    { id: 'portal-block-green', name: '', nameEn: '', description: '', category: 'material', maxStack: 10, icon: '', story: true },
    { id: 'portal-block-blue', name: '', nameEn: '', description: '', category: 'material', maxStack: 10, icon: '', story: true },
]);

const setup = () => ({
    backpack: new Backpack([], catalog),
    realmProgression: new RealmProgression(),
    stageProgression: new StageProgression(),
});
const place = (realm: number, s: ReturnType<typeof setup>) =>
    placePortalBlockUseCase(realm, realms, s.backpack, s.realmProgression, s.stageProgression);

describe('placePortalBlockUseCase', () =>
{
    it('opens the next Realm with the block of the Realm before it, and uses the block up', () =>
    {
        const s = setup();
        s.backpack.addItem('portal-block-green', 1);

        expect(place(2, s)).toEqual({ success: true, realm: 2, unlockedStageId: null });

        expect(s.realmProgression.isRealmOpen(2)).toBe(true);
        expect(s.backpack.getItemCount('portal-block-green')).toBe(0);
    });

    it('opens the first Stage of the Realm at once when the last Stage of the Realm before was already cleared', () =>
    {
        const s = setup();
        s.backpack.addItem('portal-block-green', 1);
        s.stageProgression.completeStage('stage-010');

        expect(place(2, s)).toMatchObject({ success: true, unlockedStageId: 'stage-011' });
        expect(s.stageProgression.isStageUnlocked('stage-011')).toBe(true);
    });

    it('leaves the first Stage closed while the last Stage of the Realm before is not cleared', () =>
    {
        const s = setup();
        s.backpack.addItem('portal-block-green', 1);
        place(2, s);

        expect(s.stageProgression.isStageUnlocked('stage-011')).toBe(false);
    });

    it('refuses without the right block and takes nothing', () =>
    {
        const s = setup();
        s.backpack.addItem('portal-block-blue', 1);

        expect(place(2, s)).toEqual({ success: false, reason: 'no_block' });
        expect(s.backpack.getItemCount('portal-block-blue')).toBe(1);
        expect(s.realmProgression.isRealmOpen(2)).toBe(false);
    });

    it('refuses a Realm that is already open, that skips one, or that does not exist', () =>
    {
        const s = setup();
        s.backpack.addItem('portal-block-blue', 1);
        s.backpack.addItem('portal-block-green', 1);

        expect(place(3, s)).toEqual({ success: false, reason: 'previous_realm_closed' });
        place(2, s);
        expect(place(2, s)).toEqual({ success: false, reason: 'already_open' });
        expect(place(1, s)).toEqual({ success: false, reason: 'no_such_realm' });
        expect(place(11, s)).toEqual({ success: false, reason: 'no_such_realm' });
        expect(s.backpack.getItemCount('portal-block-blue')).toBe(1);
    });

    it('announces the Realm that opened', () =>
    {
        const s = setup();
        s.backpack.addItem('portal-block-green', 1);
        const heard: unknown[] = [];
        const listener = (payload: unknown) => heard.push(payload);
        DomainEvents.on(REALM_OPENED_EVENT, listener);

        place(2, s);
        DomainEvents.off(REALM_OPENED_EVENT, listener);

        expect(heard).toEqual([{ realm: 2 }]);
    });

    it('keeps the blocks and shards when the hero dies, being story Materials', () =>
    {
        const s = setup();
        s.backpack.addItem('portal-block-green', 1);
        s.backpack.addItem('portal-block-blue', 1);

        const lost = s.backpack.applyRetreatPenalty().lost;

        expect(lost).toEqual([]);
        expect(s.backpack.getItemCount('portal-block-green')).toBe(1);
    });
});

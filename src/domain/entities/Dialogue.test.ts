import { describe, expect, it } from 'vitest';
import { DialogueGraph, DialogueState } from './Dialogue';

describe('DialogueState Entity', () =>
{
    const mockGraph: DialogueGraph = {
        id: 'test_graph',
        title: 'Test Conversation',
        startNodeId: 'node_1',
        nodes: {
            node_1: {
                id: 'node_1',
                speaker: 'Elder',
                avatar: '👴',
                line: 'Hello adventurer!',
                next: 'node_2',
            },
            node_2: {
                id: 'node_2',
                speaker: 'Elder',
                avatar: '👴',
                line: 'Will you help us?',
                choices: [
                    { text: 'Yes, absolutely!', to: 'node_yes', set: { agreed: true } },
                    { text: 'Not right now.', to: 'node_no' },
                ],
            },
            node_yes: {
                id: 'node_yes',
                speaker: 'Elder',
                avatar: '👴',
                line: 'Thank you!',
                end: true,
            },
            node_no: {
                id: 'node_no',
                speaker: 'Elder',
                avatar: '👴',
                line: 'Come back when ready.',
                end: true,
            },
        },
    };

    it('starts dialogue at startNodeId', () =>
    {
        const state = new DialogueState();
        expect(state.isOpen).toBe(false);

        state.start(mockGraph);
        expect(state.isOpen).toBe(true);
        expect(state.getCurrentNode()?.id).toBe('node_1');
        expect(state.getCurrentNode()?.line).toBe('Hello adventurer!');
    });

    it('advances linear node to next node', () =>
    {
        const state = new DialogueState();
        state.start(mockGraph);

        const next = state.advance();
        expect(next?.id).toBe('node_2');
        expect(state.getCurrentNode()?.id).toBe('node_2');
    });

    it('handles branching choices and variable mutations', () =>
    {
        const state = new DialogueState();
        state.start(mockGraph);
        state.advance(); // to node_2

        const choices = state.getAvailableChoices();
        expect(choices).toHaveLength(2);
        expect(choices[0].text).toBe('Yes, absolutely!');

        const chosenNode = state.choose(0);
        expect(chosenNode?.id).toBe('node_yes');
        expect(state.getVariable('agreed')).toBe(true);
    });

    it('closes dialogue when ending node is reached or closed', () =>
    {
        const state = new DialogueState();
        state.start(mockGraph);
        state.advance(); // to node_2
        state.choose(1); // to node_no (end: true)

        expect(state.getCurrentNode()?.id).toBe('node_no');
        state.advance(); // advance from end closes
        expect(state.isOpen).toBe(false);
        expect(state.getCurrentNode()).toBeNull();
    });

    it('hands out the action of the picked choice once', () =>
    {
        const state = new DialogueState();
        state.start({
            id: 'g',
            title: 'g',
            startNodeId: 'a',
            nodes: {
                a: {
                    id: 'a', speaker: 's', avatar: 'x', line: 'l',
                    choices: [
                        { text: 'go', to: 'end', action: 'do-it' },
                        { text: 'skip', to: 'end' },
                    ],
                },
            },
        });

        state.choose(0);
        expect(state.takeAction()).toBe('do-it');
        expect(state.takeAction()).toBeNull();
    });
});

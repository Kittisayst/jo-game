export interface DialogueChoice
{
    text: string;
    to: string;
    if?: string;
    set?: Record<string, unknown>;
    /** Something the game should do when this choice is picked (e.g. `open-skin-shop`). */
    action?: string;
}

export interface DialogueNode
{
    id: string;
    speaker: string;
    avatar: string;
    line: string;
    choices?: DialogueChoice[];
    next?: string;
    end?: boolean;
}

export interface DialogueGraph
{
    id: string;
    title: string;
    startNodeId: string;
    nodes: Record<string, DialogueNode>;
}

export class DialogueState
{
    private currentGraph: DialogueGraph | null = null;
    private currentNodeId: string | null = null;
    private variables: Record<string, unknown> = {};
    private isDialogueOpen = false;
    private pendingAction: string | null = null;

    constructor (initialVariables: Record<string, unknown> = {})
    {
        this.variables = { ...initialVariables };
    }

    start (graph: DialogueGraph): void
    {
        this.currentGraph = graph;
        this.currentNodeId = graph.startNodeId;
        this.isDialogueOpen = true;
    }

    get isOpen (): boolean
    {
        return this.isDialogueOpen;
    }

    getCurrentNode (): DialogueNode | null
    {
        if (!this.isDialogueOpen || !this.currentGraph || !this.currentNodeId)
        {
            return null;
        }
        return this.currentGraph.nodes[this.currentNodeId] ?? null;
    }

    getAvailableChoices (): DialogueChoice[]
    {
        const node = this.getCurrentNode();
        if (!node || !node.choices) return [];

        return node.choices.filter(choice =>
        {
            if (!choice.if) return true;
            return Boolean(this.variables[choice.if]);
        });
    }

    choose (choiceIndex: number): DialogueNode | null
    {
        const choices = this.getAvailableChoices();
        if (choiceIndex < 0 || choiceIndex >= choices.length)
        {
            return this.getCurrentNode();
        }

        const selected = choices[choiceIndex];
        if (selected.set)
        {
            Object.assign(this.variables, selected.set);
        }
        this.pendingAction = selected.action ?? null;

        return this.goToNode(selected.to);
    }

    advance (): DialogueNode | null
    {
        const node = this.getCurrentNode();
        if (!node) return null;

        if (node.end || (!node.next && (!node.choices || node.choices.length === 0)))
        {
            this.close();
            return null;
        }

        if (node.next)
        {
            return this.goToNode(node.next);
        }

        return node;
    }

    close (): void
    {
        this.isDialogueOpen = false;
        this.currentNodeId = null;
        this.currentGraph = null;
    }

    /** The action attached to the last choice, returned once and then cleared. */
    takeAction (): string | null
    {
        const action = this.pendingAction;
        this.pendingAction = null;
        return action;
    }

    getVariable (key: string): unknown
    {
        return this.variables[key];
    }

    setVariable (key: string, value: unknown): void
    {
        this.variables[key] = value;
    }

    private goToNode (nodeId: string): DialogueNode | null
    {
        if (!this.currentGraph) return null;

        if (nodeId === 'end' || !this.currentGraph.nodes[nodeId])
        {
            this.close();
            return null;
        }

        this.currentNodeId = nodeId;
        const nextNode = this.currentGraph.nodes[nodeId];
        if (nextNode.end)
        {
            // Reached terminal node
            return nextNode;
        }
        return nextNode;
    }
}

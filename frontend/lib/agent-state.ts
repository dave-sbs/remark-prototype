export type AgentState = {
    threadId: string
    productCatalogContext: string | null
    discoveredPainPoints: string[]
    discoveredBudgetRange: string | null
    productsDiscussed: string[]
}

const threadStates = new Map<string, AgentState>()

export function getThreadState(threadId: string): AgentState {
    if (!threadStates.has(threadId)) {
        threadStates.set(threadId, {
            threadId,
            productCatalogContext: null,
            discoveredPainPoints: [],
            discoveredBudgetRange: null,
            productsDiscussed: []
        })
    }
    return threadStates.get(threadId)!
}

export function updateThreadState(threadId: string, updates: Partial<AgentState>) {
    const state = getThreadState(threadId)
    threadStates.set(threadId, { ...state, ...updates })
}


export type AgentState = {
    threadId: string
    productCatalogContext: string | null
}

const threadStates = new Map<string, AgentState>()

export function getThreadState(threadId: string): AgentState {
    if (!threadStates.has(threadId)) {
        threadStates.set(threadId, {
            threadId,
            productCatalogContext: null,
        })
    }
    return threadStates.get(threadId)!
}

export function updateThreadState(threadId: string, updates: Partial<AgentState>) {
    const state = getThreadState(threadId)
    threadStates.set(threadId, { ...state, ...updates })
}


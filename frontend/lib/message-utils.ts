export function extractMessageContent(message: any): string {
    return message.parts
        ?.map((part: any) => (part.type === 'text' ? part.text : ''))
        .join('') || message.content || '';
}

export function extractToolCalls(message: any): any[] | null {
    if (!message.parts) return null;

    const toolCallParts = message.parts.filter(
        (part: any) => part.type === 'tool-call'
    );

    if (toolCallParts.length === 0) return null;

    return toolCallParts.map((part: any) => ({
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
    }));
}

export function extractToolResults(message: any): any[] | null {
    if (!message.parts) return null;

    const toolResultParts = message.parts.filter(
        (part: any) => part.type === 'tool-result'
    );

    if (toolResultParts.length === 0) return null;

    return toolResultParts.map((part: any) => ({
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        result: part.result,
    }));
}


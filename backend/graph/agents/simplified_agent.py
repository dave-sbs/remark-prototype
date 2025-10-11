"""
Simplified Sales Agent Implementation

Single conversational agent that:
1. Pre-loads product catalog on first message
2. Uses minimal tools strategically
3. Focuses on discovering pain points and budget
4. Guides customers to purchase decisions

Architecture: Context-first approach with strategic tool usage
"""

# State Management Imports
import os
import asyncio
from typing import Optional, List
from dotenv import load_dotenv

# LangGraph Imports
from langgraph.graph import StateGraph, START, END, MessagesState

# LangChain Imports
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage

# Prompt
from graph.prompts import sales_agent_prompt

# Tool Imports from simplified toolkit
from graph.search_tools.simplified_toolkit import (
    get_product_catalog,
    get_product_details,
    get_all_base_prices,
    get_product_unique_features
)

# =========== STATE DEFINITIONS ===========

class SalesAgentState(MessagesState):
    """
    State for the sales agent conversation.

    Tracks conversation context and product catalog loading.
    """
    # Product catalog loaded on first message
    product_catalog_context: Optional[str] = None
    # Track conversation for analytics (optional)
    discovered_pain_points: List[str] = []
    discovered_budget_range: Optional[str] = None
    products_discussed: List[str] = []


# =========== CONFIGURATION ===========

load_dotenv()

# Main conversational model with tools
model = init_chat_model(
    model="openai:gpt-4.1-mini",
    temperature=0.7,  # Slightly higher for natural conversation
    api_key=os.getenv("OPENAI_API_KEY")
)

# Available tools
tools = [
    get_product_catalog,
    get_product_details,
    get_all_base_prices,
    get_product_unique_features
]

tools_by_name = {tool.name: tool for tool in tools}
model_with_tools = model.bind_tools(tools)


# =========== HELPER FUNCTIONS ===========

async def execute_single_tool_async(tool_call: dict) -> str:
    """Execute a single tool call asynchronously."""
    tool = tools_by_name.get(tool_call["name"])
    if not tool:
        return f"Tool {tool_call['name']} not found"

    try:
        # Try async invoke first, fallback to sync in thread
        if hasattr(tool, 'ainvoke'):
            result = await tool.ainvoke(tool_call["args"])
        else:
            # Run sync tool in executor to avoid blocking
            result = await asyncio.to_thread(tool.invoke, tool_call["args"])
        return str(result)
    except Exception as e:
        return f"Error executing {tool_call['name']}: {str(e)}"


async def execute_tools_parallel(tool_calls: List[dict]) -> List[ToolMessage]:
    """Execute multiple tool calls in parallel."""
    tasks = [execute_single_tool_async(tc) for tc in tool_calls]
    observations = await asyncio.gather(*tasks)

    return [
        ToolMessage(
            content=observation,
            name=tool_call["name"],
            tool_call_id=tool_call["id"]
        )
        for observation, tool_call in zip(observations, tool_calls)
    ]


# =========== WORKFLOW NODES ===========
async def sales_agent_node(state: SalesAgentState):
    """
    Main sales agent that handles all conversation.

    On first message: Automatically load product catalog
    On all messages:
      1. Check if catalog loaded, load if not
      2. Analyze user input with catalog context
      3. Let LLM decide if additional tools needed
      4. Execute tools if necessary (parallel)
      5. Generate strategic response
    """
    messages = state["messages"]
    catalog_context = state.get("product_catalog_context")

    # First message: Load product catalog automatically
    if catalog_context is None:
        try:
            catalog = await get_product_catalog.ainvoke({})
            catalog_context = f"\n\n# PRODUCT CATALOG (Your Context)\n\n{catalog}\n\n---\n\n"
        except Exception as e:
            catalog_context = f"\n\n# PRODUCT CATALOG\n\nError loading catalog: {str(e)}\n\n---\n\n"

    # Build system message with catalog context
    system_message = SystemMessage(
        content=catalog_context + sales_agent_prompt
    )

    # Get LLM response (may include tool calls) - USE ASYNC
    response = await model_with_tools.ainvoke([system_message] + messages)

    # If LLM wants to call tools, execute them
    if response.tool_calls:
        # Execute tools in parallel
        tool_messages = await execute_tools_parallel(response.tool_calls)

        # Get final response with tool results - USE ASYNC
        final_response = await model_with_tools.ainvoke([
            system_message,
            *messages,
            response,
            *tool_messages
        ])

        return {
            "messages": [response] + tool_messages + [final_response],
            "product_catalog_context": catalog_context
        }

    # No tool calls needed, return direct response
    return {
        "messages": [response],
        "product_catalog_context": catalog_context
    }


# =========== GRAPH DEFINITION ===========

"""Create and compile the sales agent graph."""
builder = StateGraph(SalesAgentState)

# Single node - the sales agent handles everything
builder.add_node("sales_agent", sales_agent_node)

builder.add_edge(START, "sales_agent")
builder.add_edge("sales_agent", END)

sales_agent = builder.compile()
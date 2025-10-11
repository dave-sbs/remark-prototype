"""
Retrieval Agent Implementation

This agent is responsible for retrieving the most relevant information from the database to answer the user's query.

Uses iterative LangGraph pattern where the LLM can make multiple rounds of tool calls,
executing them in PARALLEL using asyncio to gather information efficiently.

Architecture:
- LLM call: Analyzes research brief and makes tool calls with arguments
- Should continue: Checks if LLM made tool calls or has enough information
- Tool execution (PARALLEL): All tools execute simultaneously using asyncio.gather()
- Loop back: After tool execution, LLM can decide to call more tools or finish
- Compress research: Synthesizes all findings into a comprehensive summary

Performance:
- Multiple tools run concurrently, not sequentially
- Example: 3 tools that each take 1s will complete in ~1s total, not 3s
- Can iterate multiple times until the query is fully answered
"""

# State Management Imports
import os
import operator
import asyncio
from typing_extensions import Optional, Annotated, List, Dict, Any
from pydantic import BaseModel, Field
from typing_extensions import Literal
from dotenv import load_dotenv

# Chat Imports
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage, filter_messages
from langgraph.graph import StateGraph, START, END

# Utils Imports
from graph.utils import get_today_str

# Prompts Imports
from graph.prompts import compress_research_results_prompt, research_agent_prompt, retrieval_agent_prompt

# State Imports
from graph.agents.router_agent import AgentState

# Tool Imports
from graph.search_tools.semantic_queries import (
    semantic_product_search,
    find_best_use_case,
    find_popular_configuration,
    compare_products_with_framework,
    expanded_semantic_search
)
from graph.search_tools.structured_queries import (
    search_products_by_price,
    get_product_details,
    get_chair_configuration_price,
    get_size_recommendation_for_user,
    list_all_products,
    get_sustainable_options
)

# =========== STATE DEFINITIONS ===========

class RetrievalState(AgentState):
    """Extended state for retrieval agent with tool execution messages."""
    retrieval_messages: Annotated[List[Any], operator.add] = []

# =========== CONFIGURATION ===========
load_dotenv()

# Set up tools and model binding
tools = [   
    semantic_product_search, 
    find_best_use_case, 
    find_popular_configuration, 
    compare_products_with_framework,  
    search_products_by_price, 
    get_product_details, 
    get_chair_configuration_price, 
    get_size_recommendation_for_user, 
    list_all_products, 
    get_sustainable_options
]
tools_by_name = {tool.name: tool for tool in tools}

model = init_chat_model(
    model="openai:gpt-4.1-mini",
    temperature=0.0,
    api_key=os.getenv("OPENAI_API_KEY")
)

model_with_tools = model.bind_tools(tools)

# Compression model for summarizing retrieval results
compress_model = init_chat_model(
    model="openai:gpt-4.1",
    max_tokens=32000,
    api_key=os.getenv("OPENAI_API_KEY")
)


# =========== WORKFLOW NODES ===========
def llm_call(state: RetrievalState):
    """
    Analyze research brief and make tool calls with arguments.
    
    The LLM analyzes the research brief and decides which tools to call
    with what arguments to gather the necessary information.
    
    This function handles iterative retrieval - if retrieval_messages exist,
    it continues the conversation loop, otherwise it starts fresh.
    """
    research_brief = state.get("research_brief", "")
    retrieval_messages = state.get("retrieval_messages", [])
    
    # If this is the first call, start with the research brief
    if not retrieval_messages:
        messages = [
            SystemMessage(content=retrieval_agent_prompt),
            HumanMessage(content=f"Research Brief: {research_brief}")
        ]
    else:
        # Continue the conversation with existing messages
        messages = [SystemMessage(content=retrieval_agent_prompt)] + retrieval_messages
    
    # Get LLM response with tool calls
    response = model_with_tools.invoke(messages)
    
    return {
        "retrieval_messages": [response]
    }

async def execute_single_tool(tool_call: dict) -> str:
    """
    Execute a single tool call asynchronously.
    
    Args:
        tool_call: Tool call dict with 'name' and 'args'
    
    Returns:
        String result of the tool execution
    """
    tool = tools_by_name.get(tool_call["name"])
    if not tool:
        return f"Tool {tool_call['name']} not found"
    
    try:
        # Run the tool in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: tool.invoke(tool_call["args"]))
        return str(result)
    except Exception as e:
        return f"Error executing {tool_call['name']}: {str(e)}"

async def execute_tools_parallel_async(tool_calls: List[dict]) -> List[str]:
    """
    Execute all tool calls in parallel using asyncio.
    
    Args:
        tool_calls: List of tool call dicts
    
    Returns:
        List of string results in the same order as tool_calls
    """
    # Create tasks for all tool calls
    tasks = [execute_single_tool(tool_call) for tool_call in tool_calls]
    
    # Execute all tasks concurrently and gather results
    observations = await asyncio.gather(*tasks)
    
    return list(observations)

def tool_node(state: RetrievalState):
    """
    Execute all tool calls from the LLM response IN PARALLEL.
    
    This implements a fan-out/fan-in pattern where all tools execute
    simultaneously, then results are collected and merged.
    """
    last_message = state["retrieval_messages"][-1]
    tool_calls = last_message.tool_calls
    
    if not tool_calls:
        return {
            "retrieval_messages": [],
            "retrieval_results": ["No tools were called for this query."]
        }
    
    # Execute all tool calls in parallel
    observations = asyncio.run(execute_tools_parallel_async(tool_calls))
    
    # Create tool message outputs
    tool_outputs = [
        ToolMessage(
            content=observation,
            name=tool_call["name"],
            tool_call_id=tool_call["id"]
        ) for observation, tool_call in zip(observations, tool_calls)
    ]
    
    # Format results for retrieval_results
    retrieval_results = [
        f"## {tool_call['name']}\n\n{observation}"
        for tool_call, observation in zip(tool_calls, observations)
    ]
    
    return {
        "retrieval_messages": tool_outputs,
        "retrieval_results": retrieval_results
    }

def compress_research(state: RetrievalState) -> dict:
    """
    Compress retrieval findings into a concise summary.
    
    Takes all the retrieval messages and tool outputs and creates
    a compressed summary for the user's query.
    """
    research_brief = state.get("research_brief", "")

    compress_human_message = f"""Based on the research brief and all the tool results gathered, please provide a comprehensive summary that answers the user's query.

    Research Brief: {research_brief}

    Analyze all the information from the tool calls above and synthesize it into a clear, actionable response that is no more than one paragraph."""
    
    messages = [SystemMessage(content=compress_research_results_prompt)] + state.get("retrieval_messages", []) + [HumanMessage(content=compress_human_message)]
    response = compress_model.invoke(messages)
    
    # Extract raw notes from tool and AI messages
    raw_notes = [
        str(m.content) for m in filter_messages(
            state["retrieval_messages"], 
            include_types=["tool", "ai"]
        )
    ]
    
    return {
        "final_report": str(response.content),
    }

# =========== ROUTING LOGIC ===========

def should_continue(state: RetrievalState) -> Literal["tool_node", "compress_research"]:
    """
    Determine whether to continue retrieval or compress results.
    
    Checks if the LLM made tool calls. If yes, execute them and continue
    the retrieval loop. If no, the agent has decided it has enough information
    and we should compress the research findings.
    
    Returns:
        "tool_node": Continue to tool execution
        "compress_research": Stop and compress research findings
    """
    messages = state["retrieval_messages"]
    last_message = messages[-1]
    
    # If the LLM makes a tool call, continue to tool execution
    if last_message.tool_calls:
        return "tool_node"
    # Otherwise, we have enough information to compress
    return "compress_research"

# =========== GRAPH DEFINITION ===========

retrieval_agent_builder = StateGraph(RetrievalState)

# Add nodes to the graph
retrieval_agent_builder.add_node("llm_call", llm_call)
retrieval_agent_builder.add_node("tool_node", tool_node)
retrieval_agent_builder.add_node("compress_research", compress_research)

# Add edges to connect nodes
# Flow: START → LLM → (decide) → either tool_node (loop back) or compress_research → END
retrieval_agent_builder.add_edge(START, "llm_call")
retrieval_agent_builder.add_conditional_edges(
    "llm_call",
    should_continue,
    {
        "tool_node": "tool_node",  # Continue retrieval loop
        "compress_research": "compress_research",  # Finalize and compress
    },
)
retrieval_agent_builder.add_edge("tool_node", "llm_call")  # Loop back for more retrieval
retrieval_agent_builder.add_edge("compress_research", END)

# Compile the graph
retrieval_agent = retrieval_agent_builder.compile()

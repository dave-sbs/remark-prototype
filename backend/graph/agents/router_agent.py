"""
Router Agent Implementation

This agent is responsible for taking the user's query and identifying the most appropriate tool to use to answer the query.

Since tools can be called in parallel, the router agent is encouraged to pick all the potentially useful tools and then send them to the retrieval agent.

Main considerations:
- Speed to reason + make decisions
- Accuracy of tools called: How useful are the tools that it is recommmending?
    - What are the downstream implications of calling too many or too few tools?
    - How much does it cost to run this agent?

V1 Architecture:
- Clarification with user
- Research brief generation
"""

# State Management Imports
import os
import operator
from typing_extensions import Optional, Annotated, List, Sequence
from langgraph.graph import MessagesState
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from typing_extensions import Literal
from dotenv import load_dotenv

# Chat Imports
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, get_buffer_string
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command

# Utils Imports
from graph.utils import get_today_str

# Prompts Imports
from graph.prompts import clarify_with_user_instructions, transform_messages_into_research_topic_prompt


# =========== STATE DEFINITIONS ===========

class AgentInputState(MessagesState):
    """State for the router agent"""
    pass

class AgentState(MessagesState):
    """
    Main state for the full multi-agent workflow

    Extends MessagesState with additional fields for research coordination.
    Some fields will be duplicated across different sub-state classes for proper state management between subgraphs and the main workflow.
    """
    # Research brief generated from user conversation history
    research_brief: Optional[str]
    # Tools selected by the router agent
    selected_tools: Annotated[List[str], operator.add] = []
    # Raw unprocessed retrieval results collected from the retrieval agent
    retrieval_results: Annotated[List[str], operator.add] = []
    # Final formatted research report
    final_report: str

# ===== STRUCTURED OUTPUT SCHEMAS =====

class ClarifyWithUser(BaseModel):
    """Schema for user clarification decision and questions."""
    
    need_clarification: bool = Field(
        description="Whether the user needs to be asked a clarifying question.",
    )
    question: str = Field(
        description="A question to ask the user to clarify the report scope",
    )
    verification: str = Field(
        description="Verify message that we will start research after the user has provided the necessary information.",
    )

class ResearchQuestion(BaseModel):
    """Schema for structured research brief generation."""
    
    research_brief: str = Field(
        description="A research question that will be used to guide the research.",
    )

# =========== CONFIGURATION ===========
load_dotenv()

intent_extraction_model = init_chat_model(model="openai:gpt-4.1-mini", temperature=0.0, api_key=os.getenv("OPENAI_API_KEY"))

# =========== WORKFLOW NODES ===========
def extract_intent_from_query(state: AgentState) -> Literal["write_research_brief", "__end__"]:
    """
    Determine if the user's request contains sufficient information to proceed with the research.

    Uses structured output to make determinstic decisions and avoid halluciantion.
    Routes to either research brief generation or ends with a clarification question.
    """
    # Set up structured output for model
    structured_output_model = intent_extraction_model.with_structured_output(ClarifyWithUser)

    # Invoke the model with clarification instructions
    response = structured_output_model.invoke([
        HumanMessage(content=clarify_with_user_instructions.format(
            messages=get_buffer_string(messages=state["messages"]), 
            date=get_today_str()
        ))
    ])
    
    # Route based on clarification need
    if response.need_clarification:
        return Command(
            goto=END, 
            update={"messages": [AIMessage(content=response.question)]}
        )
    else:
        return Command(
            goto="write_research_brief", 
            update={"messages": [AIMessage(content=response.verification)]}
        )

def write_research_brief(state: AgentState):
    """
    Transform the conversation history into a comprehensive research brief.
    
    Uses structured output to ensure the brief follows the required format
    and contains all necessary details for effective research.
    """
    # Set up structured output model
    structured_output_model = intent_extraction_model.with_structured_output(ResearchQuestion)
    
    # Generate research brief from conversation history
    response = structured_output_model.invoke([
        HumanMessage(content=transform_messages_into_research_topic_prompt.format(
            messages=get_buffer_string(state.get("messages", [])),
            date=get_today_str()
        ))
    ])
    
    # Update state with generated research brief and pass it to the supervisor
    return {
        "research_brief": response.research_brief,
        "supervisor_messages": [HumanMessage(content=f"{response.research_brief}.")]
    }

# =========== GRAPH DEFINITION ===========

router_agent_builder = StateGraph(AgentState, input_schema=AgentInputState)

router_agent_builder.add_node("extract_intent_from_query", extract_intent_from_query)
router_agent_builder.add_node("write_research_brief", write_research_brief)

router_agent_builder.add_edge(START, "extract_intent_from_query")
router_agent_builder.add_edge("write_research_brief", END)

router_agent = router_agent_builder.compile()
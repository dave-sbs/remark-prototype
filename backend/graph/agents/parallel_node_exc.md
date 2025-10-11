Based on web search results, here's how to perform parallelized node execution in LangGraph:

## Key Concepts

LangGraph supports native parallel execution through fan-out and fan-in patterns, where multiple nodes can execute concurrently and then merge their results.

## Implementation Steps

### 1. Define Parallel Branches
Create multiple edges from a single node to enable concurrent execution:

```python
graph.add_edge("start_node", "parallel_node_1")
graph.add_edge("start_node", "parallel_node_2")
```

### 2. Manage State Updates with Reducers
When parallel nodes update the same state key, use reducers to handle conflicts:

```python
from typing import Annotated
import operator

class GraphState:
    context: Annotated[list, operator.add] = []
```

The `operator.add` reducer will concatenate list outputs from parallel nodes.

### 3. Implement Parallel Node Functions
Define functions that process state independently:

```python
def parallel_node_1(state):
    # Process state
    return {"context": ["Result from node 1"]}

def parallel_node_2(state):
    # Process state  
    return {"context": ["Result from node 2"]}
```

### 4. Add Merge Node
Create a node to combine results after parallel execution:

```python
def merge_node(state):
    combined_results = state.context
    # Further processing
    return {"final_result": combined_results}
```

### 5. Construct the Graph
Set up the complete workflow:

```python
graph.add_node("start_node", start_node_function)
graph.add_node("parallel_node_1", parallel_node_1)
graph.add_node("parallel_node_2", parallel_node_2)
graph.add_node("merge_node", merge_node)

graph.add_edge("start_node", "parallel_node_1")
graph.add_edge("start_node", "parallel_node_2")
graph.add_edge("parallel_node_1", "merge_node")
graph.add_edge("parallel_node_2", "merge_node")
```

## Result
This setup ensures `parallel_node_1` and `parallel_node_2` run concurrently after `start_node` completes, with `merge_node` executing only after both parallel nodes finish.

This approach is particularly useful in your deep research system for running multiple research agents or processing different aspects of a research query simultaneously.
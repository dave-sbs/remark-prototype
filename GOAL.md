We have the following tables in our database @schema_v1.sql .

The goal is to create an agentic chatbot that takes questions from a user and provides the most helpful responses to help them with their purchase decision. The goal is to create a digital shopping experience that expensive boutique in-person shops offer with multiple sales people in the stores always at reach to answer questions and explain the products in depth as well as compare them well. 

Currently we have a v1 version of the schema set up.

The next steps are the following:
1. Upload the data from DATASET.md and PRICES.md to supabase
    a. Upload to products, product_specifications, product_configurations, product_base_prices, product_addons
    b. Test data validity by just creating a very simple frontend that lets me pick the different configurations for the chairs and see the price changes
    c. Create dataset for use_case_scenarios, comparison_frameworks to simulate an expert salespersons playbook and deep understand of the products. Upload the data
2. Consolidate the different tables by implementing search functions in supabase, and the necessary business logic to tie them together for LLMs to access the search and ranking functions as tools to make informed decisions
3. Design sub agents for different tasks 
4. Evaluate different subagent responses to various user queries, edge cases, hallucinations etc
5. Combine them to create a deep sales agent with routing capabilities 
6. Iterate and simplify the database schema 

During this process, we'll have a living document PROCESS.md to document our design process, iterations, and analysis of the backend performance - It mainly discusses what we measure? how we measure them? how we adjust them?

7. Once we're happy with the backend capabilities move to building a frontend for the store page and a chatbot experience.

TECH STACK
- Supabase with PgVector for the database
- Langgraph for agent orchestration
- Langsmith for tracing and evaluation

env vars
SUPABASE_PASSWORD
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
LANGSMITH_API_KEY
LANGSMITH_TRACING
LANGSMITH_PROJECT
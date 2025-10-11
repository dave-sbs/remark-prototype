**Current Challenges**
- The semantic search results are really poor. 
- The price tools are never called


The user could have any type of characteristic, but once they come in the store:
1. They have a certain budget range
2. They have certain functional needs
3. They have certain aesthetic wants
4. They have some sort of social validation

In summary, they have a certain degree of pain and are willing to pay some amount of money to alleviate that pain.

We come in at that moment to understand their incentives and provide them with the solution that makes the most sense. To do that:
- We have to understand their level of pain.
- We have to understand their willingness to pay.

Let's start really simple:
- A tool to get all the products and the basic details
- A tool to get a specific product by name with full details (aesthetics + functionality)
- A tool to get all prices (default configuration)
- A tool to get a specific product's price
- A tool to get each product's unique features

How much coverage can we get from these tools?
    - As a regular sales rep, how helpful can I be with these tools?
        - I think I can go pretty deep by answering basic questions and asking follow ups. Surface their context better.


So given the product table isn't super long we can call a tool that gets the product with basic details and its price and add it to the context of the initial message.

From there get the user's question and depending on how specific they asked determine whether an additional tool call is necessary or respond immediately. The response prompt will be crafted intentionally to provide useful nudges that guide their journey to get one step closer to making a purchase decision.


Need to summarize conversation context eventually
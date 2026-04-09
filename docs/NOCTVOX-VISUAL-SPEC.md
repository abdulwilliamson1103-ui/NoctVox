# NoctVox Visual Spec

Documented: 2026-04-09
Purpose: Define the interface for Ignis, the Council, the agents, and the Vox empires.

## Visual Goal
The UI should answer five questions immediately:
- what is happening
- who is thinking
- who is acting
- which empire owns the task
- what infrastructure supports it

## Main Regions
- `Ignis Core`: current mission and state
- `Council Ring`: active minds and influence intensity
- `Task Router`: request -> values -> structure -> specialist -> agent
- `Agent Panel`: assigned agent, state, risks
- `Empire Panel`: LeVox, NeoVox, HPVox, DoctrinaVox, XoVox, FinVox, StarVox
- `Infra + Lab Strip`: AWS, Terraform, Kubernetes, Databricks, Vercel, Hugging Face, arXiv

## Interaction Rule
Only the relevant minds should light up on a given task.
If everything is glowing, the system is not prioritizing.

## Style Direction
Avoid generic SaaS dashboards.
Aim for a command chamber: high contrast, deliberate hierarchy, restrained motion, and symbolic clarity.

## MVP Build Order
1. Static visual layout
2. Interactive task routing
3. Live data and agent state integration

# Visual VoxHive Architecture

Documented: 2026-04-09
Purpose: Turn the Vox vision into a concrete system map.

## System View

```text
                                   VOXHIVE
                      Governance Layer + Shared Intelligence

    -------------------------------------------------------------------------
    |                                                                       |
    |  Research + Algorithm Layer                                           |
    |  - Hugging Face                                                       |
    |  - Papers with Code                                                   |
    |  - arXiv                                                              |
    |  - Search / Planning (MCTS-style experiments)                         |
    |  - Structured reasoning pipelines                                     |
    |                                                                       |
    -------------------------------------------------------------------------
                                  |        |
                                  |        |
                    --------------          --------------
                    |                                        |
                    v                                        v
    -------------------------------         ---------------------------------
    | Infrastructure Layer        |         | Product / Empire Layer         |
    | - AWS / SageMaker           |         | - LeVox       -> Knights       |
    | - Terraform                 |         | - NeoVox      -> Ninjas        |
    | - Kubernetes                |         | - HPVox       -> Vikings       |
    | - Databricks                |         | - DoctrinaVox -> Spartans      |
    | - Vercel                    |         | - XoVox       -> Pirates       |
    -------------------------------         | - FinVox      -> Gladiators    |
                    |                       | - StarVox     -> Samurai       |
                    |                       ---------------------------------
                    |                                        |
                    -------------------      -----------------
                                      |      |
                                      v      v
                          -----------------------------------
                          | Shared Runtime + Agent Orchestration |
                          | - Tier 1 teaching agents             |
                          | - Tier 2 worker agents               |
                          | - Tier 3 manager agents              |
                          -----------------------------------
```

## Architecture Notes
- `NeoVox` functions as the shared research and algorithm lab.
- `LeVox` is the first working domain implementation.
- `Vercel` is the product delivery layer, not the GPU fleet.
- `Terraform` and `Kubernetes` belong to infrastructure control.
- `AWS/SageMaker` and `Databricks` belong to heavy compute and data workflows.

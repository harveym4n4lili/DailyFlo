## [19/06/2025] - [Thursday]

### Decision 1
Decided to make seperate model entities for a non-recurring and recurring task
#### Decision Goal
> Simplify logic and ensure data integrity for recurring task generation and management
#### Decision Context
* Originally considered merging all tasks into a single model with optional recurrence fields.
* This caused complexity in querying and scheduling.

### Notes
- None
---
# DECISIONS LOG BOOK TEMPLATE
## [20/06/2025] - [Friday]

### Decision 1
Decided to continue original DRF structure instead of implementing Pydantic library structure.
#### Decision Goal
> Speed up development process to allow more time dedicated to end processes such as hosting, deployment and feature implementation.
#### Decision Context
* Upon backend setup aswell as research, came across a more modern approach to system architecture which was pydantic.
* I was torn between sticking with what I know and going through the DRF serializer root or learning a new library and architecture through Pydantic for the sake of modern django practices in 2025.

### Notes
- No notes
---

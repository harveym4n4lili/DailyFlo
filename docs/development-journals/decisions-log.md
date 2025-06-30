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
## [27/06/2025] - [Friday]

### Decision 1
Decided to add new model: Lists, where tasks and routines can be grouped/categorised together.
#### Decision Goal
> Allow for more potential extension/options
#### Decision Context
* Upon wireframe design I noticed that the current content was too minimal for full navigation.
* I realised it made sense for users to have more control over their tasks, being able to group them so they can categorise their tasks.

### Decision 2
Renaming RecurringTasks to Routines.
#### Decision Goal
> To improve clarity, intuitiveness using a more relatable term.
#### Decision Context
* Upon wireframe design I noticed rewriting "RecurringTasks" felt too technical.
* New term "Routines" better conveys the the concept of repeating tasks.

### Notes
- No notes

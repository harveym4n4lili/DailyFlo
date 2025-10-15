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
---
## [18/08/2025] - [Monday]

### Decision 1
Decided to simplify nav where monthly planner screen and today's task screen are combined into one.
#### Decision Goal
> Simplify app usage.
#### Decision Context
* Upon wireframe design I noticed that the monthly planner view and today's tasks view could be combined with the usage if various UI techniques.
* It also made more sense for a user standpoint for all task related planning to be in one view, rather than having it seperated dependant on month/week.

### Notes
- No notes
---
## [10/09/2025] - [Wednesday]

### Decision 1
Reverted decision of combining today's view and planner.
#### Decision Goal
> Provide a more clearer view for the user
#### Decision Context
* Whilst developing the figma wireframes, I noticed more screens could be included whilst reducing difficulty with usage.

### Notes
- No notes
---
## [14/09/2025] - [Sunday]

### Decision 1
Fully decided to continue frontend development in typescript.
#### Decision Goal
> For personal growth
#### Decision Context
* I attempted to convert the frontend into javascript as it was initialized with a typescript template project, without re-initializing the whole frontend.
* Decided to go through with typescript-based frontend.

### Notes
- No notes
---
## [24/09/2025] - [Tuesday]

### Decision 1
Fully decided to remove task icons
#### Decision Goal
> Simplify styliong and reduce clutter
#### Decision Context
* I attempted to create the task card component with the icon, but after testing I noticed the task card logo style was too cluttered.
* With this, I just decided it was easier for icons to be removed completely for now.

### Notes
- No notes
---
## [12/10/2025] - [Sunday]

### Decision 1
Added time, duration and icon fields to the Task model.
#### Decision Goal
> Allow further expansion and implementation
#### Decision Context
* I considered current constraints and implementation, I thought I might as well add these fields for future features, to expand my development.
* These features gave more to do in the app

### Notes
- No notes
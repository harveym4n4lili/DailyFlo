## [18/06/2025] - [Wednesday]

### Today's Goals
- [x] Begin Documentation Folders/Files
- [x] Complete Requirements Planning
- [ ] Complete Architectural and Technical Planning
### What I Learned
- Learned how to start documentation professionally.
### Notes
- No Notes

---
## [19/06/2025] - [Thursday]

### Today's Goals
- [x] Complete model conceptual design doc
- [x] Complete endpoint design doc
- [x] Complete authentication flow design
- [x] Initialise Django backend, in seperate branch
- [x] Initialise React Native, Expo frontend, in seperate branch
- [x] Merged both setup branches to main branch
### What I Accomplished
- Practice in planning and design practices
### What I Learned
- After research, gained further understanding on authentication workflows with JWT
### Challenges & Solutions
- Came across merge conflict from both branches containing their own .gitignore files, solved by using git web editor to edit and append both files together.
### Tomorrow's Plan
- Implement Models
### Notes
- No Notes
---
## [20/06/2025] - [Friday]

### Today's Goals
- [ ] Implement some django models
- [ ] Prepare endpoints for authentication

### What I Learned
- Came across a new library and backend archirecture in PyDantic, which is commonly used in modern 2025 practice for django.
### Challenges & Solutions
- Wasn't able to meet todays goals
- More time was spent on researching more about PyDantic, and deciding between archirectures.
### Tomorrow's Plan
- Complete today's goals tommorow.
### Notes
- No Notes
---
## [21/06/2025] - [Saturday]

### Today's Goals
- [X] Implement some django models
- [X] Write basic model serializers 
- [ ] Begin writing API endpoints 

### What I Learned
- Relearned serializer method writing, from learning about serializer vs modelSerializers and its meta class, to extensions and data validation methods.

### Challenges & Solutions
- Had problems with references within backend which includes:
    - installed app references had to be changed as I had created a new apps folder and moved all apps into that folder
    - manage.py referring to wrong dailyfo folder for main settings which was renamed to config
- Problems appeared when trying to make migrations, kept saying modules couldn't be found.
- Solved by ensuring manage.py refers to correct settings.py parent folder, and ensuring installed apps dict contains correct reference to apps dependent on structure, ensuring settings variables contain correct reference to settings parent folders where necessary. 
### Tomorrow's Plan
- Complete frontend setup
- Merge both branches again and delete to prepare for feature branching

### Notes
- No Notes
---
## [22/06/2025] - [Sunday]

### Today's Goals/Accomplishments
- [X] Written basic CRUD API views and endpoints for tasks
- [X] Implement JWT login endpoints
- [X] Prepare general URL endpoints 

### What I Learned
- Somewhat learned view writing, learned different types of view writing e.g FBV, CBV, generics, viewsets
- Research on JWT was conducted, learned about what it is, pros and cons, how to implement it to project and use built in methods for token obtaining.
- Learned how to use curl for API endpoint behaviour testing 
### Challenges & Solutions
- CURL formatting caused problems, I just had to open a gitbash terminal in the correct dir to bypass format problems.
### Tomorrow's Plan
- Implement CRUD for recurring tasks.
- Implement soft delete for task and recurring task
### Notes
- No notes
---
## [23/06/2025] - [Monday]

### Today's Goals
- [X] Write CRUD API views for reucrring tasks model
- [X] Implement soft delete views for task and recurring task
- [X] Conduct basic curl testing for user login, registration

### What I Accomplished
- gained significant practice in basic curl testing for endpoint behaviours.
### Tomorrow's Plan
- Design wireframes for phone display
- Completely design userflow throughout app
- Research on possible frontend stacks/refresh on react native
### Notes
- No notes
---
## [26/06/2025] - [Thursday]

### Today's Goals
- [X] Start Wireframe planning

### What I Learned
- Gained insight in modern practice wireframe planning
- More extensive, complete wireframe planning on could help increase workflow and development, especially on frontend. 
### Tomorrow's Plan
- Complete wireframe plan
### Notes
- Considering extending, including task categories
- renaming recurring tasks to routines
- bottom nav bar: 3/5 buttons complete, considering a page with grouped tasks view, e.g project/task-list, and controlled categories
- 
---
## [30/06/2025] - [Monday]

### Today's Goals
- [X] Write a wireframe design doc for client-side dailyflo app
- [X] Plan out user flow throughout app

### What I Accomplished
- Gained more extensive practice on planning various user flows, helped expanded my view on UX planning as a whole, from responsive planning to state planning.
### Tomorrow's Plan
- Continue Refresh on react native and research on expo
- Continue research on styling stacks
### Notes
- No notes
---
## [08/07/2025] - [Tuesday]

### Today's Goals
- [X] Continue refresh on react native and expo (notion notes)

### What I learned
- Gained refreshing insight on react's hook, prop state management system and other fundamentals
- Gained refreshing insight on implementing navigation, and project structure react native expo
### Future Plan
- Go over data forms and responsive, enhanced UI in react native expo
- Research styling stacks, inspiration for global elements
### Notes
- No notes
---

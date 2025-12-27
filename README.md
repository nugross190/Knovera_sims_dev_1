# knovera-item-exam-prototype
A progress checker on my knovera progres
# Exam Engine Logic Flow

Here is the visual logic map for the Knovera Exam Runner:

```mermaid
graph TD
    %% 1. INITIALIZATION
    Start((Start Exam)) -->|Load Question Array| Init[Initialize: <br> index = 0 <br> answers = {}]
    
    %% 2. THE MAIN LOOP
    Init --> Render[<b>Render Question</b> <br> Get examQuestions index]
    
    %% 3. USER INTERACTION
    Render --> UserAction{User Action}
    
    %% 4. ANSWER STORAGE
    UserAction -->|Selects Option| Input[User Selects Answer]
    Input -->|Click 'Check'| Save[<b>Save to Memory</b> <br> userAnswers id = 'Correct/Wrong']
    Save --> Feedback[Show Visual Feedback]
    
    %% 5. NAVIGATION LOGIC
    UserAction -->|Click 'Next'| CheckEnd{Is this the <br> Last Question?}
    
    CheckEnd -- No --> Increment[index = index + 1]
    Increment --> Render
    
    UserAction -->|Click 'Previous'| CheckStart{Is this the <br> First Question?}
    CheckStart -- No --> Decrement[index = index - 1]
    Decrement --> Render
    
    %% 6. FINISH STATE
    CheckEnd -- Yes --> Summary[<b>Render Summary Screen</b> <br> Calculate Score from userAnswers]
    Summary --> End((End))
```

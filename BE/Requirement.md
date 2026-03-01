Problem statement
Functional Requirements:

Design and implement a multiplier drawing and guessing game like skribble, which has below features
Lobby and Player management
A user (host) can create a private room with following configuration parameters
Maximum number of players allowed (MVP)
Number of rounds (MVP)
Custom words to choose from ( for now only custom words no on the fly words like skribble) (MVP)
A unique sharable link for the Room to share (MVP)
    - 	Multiple players can join the room ( up to configured maximum players) (MVP)
    -       A list of connected players displayed in the lobby (MVP)
    -       A start game button for the host once the minimum number of players is met (MVP)
   -        Once a game in the room starts any other user can not join in between. ( Out of Scope for now )

Drawing and guessing Mechanics:
A time limit for the drawing phase of each round (MVP)
A system for the drawer to choose one word from a selection of options provided by system (MVP)
Chat functionality for players to submit their guess (MVP)
Drawing canvas and tools ( eg:color palette , brush size , eraser , undo/redo) ( Only 1 color and 1 brush no eraser and no undo/redo )

Scoring and Game End:
A point system where drawer earns points when the other guess correctly and guessers earn points on how quickly they guess ( Initial version fixed score for correct guess and drawer)
Game over mechanism after all the rounds with final scores and a leaderboard for the session. (MVP)

NFR
Minimum 300 private room created ( Only scope for 20 private rooms )
Each room can have 10 people ( Only scope for 4 people )

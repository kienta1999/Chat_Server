# CSE330
488493

488494

http://ec2-13-250-43-149.ap-southeast-1.compute.amazonaws.com:3456/
(replace the address with your instance's address)

The page is served in port 3456. 

# Creative portion:
## 1. Block Specific Users
Users have the option of entering other users' usernames to permanently block them. Once blocked, users will not see texts from them in a group chat or be able to receive direct private messages from blocked users. This functionality allows users to have privacy over the chat annd decide who they want to talk to or receive messages from. 

If A blocks B -> A will not see B's message and B cannot send private message to A. However, B can still see A's message if B does not block A. 

## 2. Filter Out Profanity
When a user tries to send profanity words in the chat, those words will be filter out using the astrisks. 
For example: f-word, b-word, n-word, etc. are all censored (to "****") when user tries to send them in the chat.

## 3. Emoji Texts
Emojis are automatically added when the user is typing them in the form such as: 
"I love :/pizza/:" (without forward slashes). The sent message will show up as "I love 🍕"

Find the emoji you want in this Emoji API (https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json)). The syntax is ":" + name + ":" 

## 4. No Duplicate Rooms/Usernames 
Duplicated room names or usernames re not allowed. When trying to sign in using an existing username or creating a new room, which is previously
created, the webpage will clear your inputs.


### Note:
- You cannot send private messages to a nonexisting user. You can only send private messages to users who are currently in the room as you. 
- If you join the web after other users, you would not be able to see the rooms created previously. So if you cannot create room, try a more unique name - it's just that the room've already existed.

### Packages used:
1. mime
2. socket.io
3. express
4. bad-words
5. node-emoji



### Grading Feedback
-2pts users still listed as being in room after leaving

-5pts creators of chat rooms can't kick or ban users

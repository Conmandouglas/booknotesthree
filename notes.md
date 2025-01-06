On this project:
- Use an orm for the database
- Make this project super simple to transfer over eventually
- Make this project fully functional:
[] View Posts
- [] Use imgur for placeholder images next to books, generate the links in the backend and store in the database
[] Create Posts
  - book title & author; details; rating
  - AUTO: user that wrote it, date updated, date created
[] Delete Posts
  - make it have a date for post deleted in database
  - only show posts with the default NULL value in this row
[] Edit Posts
  - same ejs file as creating post
[] Delete book
  - deletes a book if no reviews are present for it
  - also a button to delete the book
[] Add user
[] Edit user
[] Delete User
**last:**
[] when adding a book, if thumbnail is not generated generate one from open library API
[] have a button to manually re-generate a thumbnail
- each time its pressed increase the .docs[0] then .docs[1] etc
[] instead of each review having a book tied to it, have like a book group with reviews inside of it like other project
  
TODO:
Sun, Dec 29:
[y] Flowchart for database
[y] Basic sudocode for project

Mon, Dec 30:
[y] Make basic frontend
[y] Create database queries and database
[y] Render home page of website

Tue, Dec 31
[y] Make add review
[y] Make dropdown for books
[y] Make edit review
[y] Make add book
[y] Make edit book
[y] Add book covers
On my own, using knowledge:
[n] Advanced grid, flex, styling
[n] Users route, add user, edit user, delete user, using same ideas as books and reviews

Wed, Jan 1
[y] Add users view page
[y] Add the user create just like post create
[y] Add user delete
[y] Add user update
[y] Start styline the website

Thu, Jan 2
[y] Style homepage (main priority)
[y] Style users page
[y] Make the users page function, so it actually selects a user and changes whether edit and delete user shows. Use stack overflow and github no AI
[y] Add session variables
[y] Add correct delete functionality and if null don't show

Fri, Jan 3
[y] Make sure everything *functions* as intended
[y] Make sure working version is pushed to github
[-] Reformat file structure to be more organized (**WILL NOT BE AN EASY TASK**)
  [y] Instead of index.js, have a frontend.js and backend.js
  [y] Make sure it is working before continue
  [y] Split each js file further by adding a frontendroutesjs and backendroutes.js
  [y] Make sure it is working before continue

Take a break, do some games and other coding, then continue:
- Using own coding skills take the time to make each route work (/users) as well as backend routes like edit review and delete review
- This will not be an easy task, but after this is done the project will be done

Get done by SUNDAY and have a day before school starts to do other coding stuff that is NOT this project

Next:
[] Move javascript in EJS files into individual javascript files
[] Make sure everything is organized and one code type is in each file
[] Comment code and understand all code present

later roadmap:
- Add scrollbar if there is more than 3 reviews
- Maybe: try an orm


KEEP THIS NOTE OPEN AFTER PROJECT:
To do:
- Do simple project
- Reformat project into a more organized file structure and more readable code
  1. practice seperate frontend and backend
  2. practice routes files
  3. practice using orms
After this project:
- Do the to-do list project and review past knowledge (like on Notion plan)
  - study and practice
- Put all of this onto github and my portfolio
- Make a new website for portfolio, use previous capstones for inspo, but this time it is a whole new project
- Continue with Angela's course
- Do projects along the way, play around with what I learn, don't worry about completing it fast, knowledge comes with experience
- Take inspiration off of the video that I watched about full stack plan, and also learn MongoDB as an alternative databse
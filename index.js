// import packages

// on home "/" route:
// fetch review from database, and their attached info and book
// display the reviews on the page

// on "/add" route
// go to edit.ejs and let user type into inputs, and grab what they type in
// 'parse' it, update database and redirect to home

// when clicking edit button "/edit" route
// edit.ejs, fetch the id using query "?" and enter it into placeholder of inputs
// allow user to update database with what they type in of the review
// redirect to home

// when clicking delete button "/delete" route
// add a value to "deleted at" in database
// because value is not null, do not show on the home page

// on the "/users route"
// display all users from database

// on the "/users/add" route
// allow user to add user and redirect to users route upon completion

// on the "/users/edit" route
// using ? fetch id of user trying to edit, fetch info from database
// fill into the inputs, and allow user to update the database
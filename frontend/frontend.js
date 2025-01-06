import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Corrected import statement
import cors from 'cors';

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());


app.use(express.static(path.join(__dirname, '../public'))); // Serve static files from the 'public' directory

// Set the views directory and view engine
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');

app.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/`); // No session handling needed
    console.log(response.data.userName);
    if (response.data.userName) {
      res.render("index", response.data);
    } else {
      res.redirect('/users');
    }

  } catch (err) {
    console.error("Error fetching data", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/users', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    res.render("users", {
      usersList: response.data.usersList,
      selectedUserId: response.data.selectedUserId,
      error: null,
    });
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/adduser', async (req, res) => {
  try {
    res.render('edituser.ejs', { user: null });
    // check if logged data is correct
  } catch (err) {
    console.error('Error rendering page', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add', async (req, res) => { // for more clarity, in the future change /add to /addbook
  try {
    res.render('edit.ejs', { book: null, review: null });
  } catch (err) {
    console.error('Error rendering page', err);
    res.status(500).send('Internal Server Error');
  }
})

app.post('/add', async (req, res) => {
  try {
    const { title, author_name } = req.body;
    await axios.post(`${API_URL}/add`, { title, author_name });
    res.redirect("/");
  } catch (err) {
    console.error('Error fetching add that adds book', err.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/adduser', async (req, res) => {
  try {
    const name = req.body.name; 
    await axios.post(`${API_URL}/adduser`, { name });
    res.redirect('/');
  } catch (err) {
    console.error('Error fetching add user', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/addreview', async (req, res) => {
  try {
    const { book_id, details, grade } = req.body;

    // Send the review data to the backend via Axios
    const response = await axios.post(`${API_URL}/addreview`, { book_id, details, grade });

    // Handle the response
    if (response.status === 201) {
      // Review was successfully added. You can update the UI here or show a success message.
      console.log('Review added successfully:', response.data);

      // Optionally, redirect or do something after success
      res.redirect('/');
    } else {
      throw new Error('Failed to add review');
    }
  } catch (err) {
    console.error('Error posting a review', err);
    res.status(500).send('Internal Server Error');
  }
});

//get edit review page
app.get('/updatereview', async (req, res) => {
  try {
    console.log("Hit! Trying to render '/updatereview'");
    const reviewId = req.query.id;
    const result = await axios.get(`${API_URL}/updatereview`, { params: { id: reviewId } });

    // Access `data` property of Axios response
    res.render('edit.ejs', {
      review: result.data.review, // Correctly access the review data
      book: result.data.book,     // Correctly access the book data
    });
  } catch (err) {
    console.error('Error rendering page', err);
    res.status(500).send('Internal Server Error');
  }
});

//post edit review
app.post('/updatereview', async (req, res) => {
  try {
    const { id, details, grade } = req.body;

    // Call the backend API
    const response = await axios.post(`${API_URL}/updatereview`, { id, details, grade });

    if (response.status === 200) {
      console.log('Review updated successfully:', response.data);

      // Redirect to the homepage after a successful update
      res.redirect('/');
    } else {
      throw new Error('Failed to update review');
    }
  } catch (err) {
    console.error('Error editing review:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/update', async (req, res) => {
  try {
    console.log("Hit! Trying to render /update (update book)");
    const bookId = req.query.id; // Extract the query parameter 'id'
    const result = await axios.get(`${API_URL}/update`, { params: { bookId } }); // Pass 'bookId' in params
    res.render('edit.ejs', {
      review: result.data.review, // Correctly access the review data
      book: result.data.book,     // Correctly access the book data
    });
  } catch (err) {
    console.error('Error rendering page', err);
    res.status(500).send('Internal Server Error');
  }
});


//post edit book
app.post('/update', async (req, res) => {
  try {
    const { id, title, author_name } = req.body;
    console.log("Hit! tryong to /update a book POST");
    
    const response = await axios.post(`${API_URL}/update`, { id, title, author_name });

    if (response.status === 200) {
      console.log('Book updated successfully:', response.data);

      // Redirect to the homepage after a successful update
      res.redirect('/');
    } else {
      throw new Error('Failed to update review');
    }
  } catch (err) {
    console.error('Error editing review:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/updateuser', async (req, res) => {
  try {
    console.log("Hit! Trying to render /updateuser");
    const { id } = req.query; // Extract the query parameter 'id'
    const result = await axios.get(`${API_URL}/updateuser`, { params: { id } }); // Pass 'bookId' in params
    res.render('edituser.ejs', { user: result.data.user });
  } catch (err) {
    console.error('Error rendering page', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updateuser', async (req, res) => {
  try {
    const { id, name } = req.body;
    console.log("Hit! tryong to /update a -user- POST");
    
    const response = await axios.post(`${API_URL}/updateuser`, { id, name });

    if (response.status === 200) {
      console.log('User updated successfully:', response.data);

      // Redirect to the homepage after a successful update
      res.redirect('/');
    } else {
      throw new Error('Failed to update user');
    }
  } catch (err) {
    console.error('Error editing user:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/deletebook', async (req, res) => {
  try {
    console.log("trying delete book in frontend");
    const { id } = req.query;
    console.log(`this is the book id: ${id}`);
    await axios.delete(`${API_URL}/deletebook`, { params: { id } });     
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/deletereview', async (req, res) => {
  try {
    console.log("trying delete book in frontend");
    const { id } = req.query;
    console.log(`this is the review id: ${id}`);
    await axios.delete(`${API_URL}/deletereview`, { params: { id } });     
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/deleteuser', async (req, res) => {
  try {
    console.log('trying to delete user in frontend');
    const { id } = req.query;
    console.log('this is the user id: ' + id);
    await axios.delete(`${API_URL}/deleteuser`, { params: { id } });
    res.redirect('/users');
  } catch (error) {
    console.error('Error deleting user:', err);
    res.status(500).send('Internal Server Error');
  }
});


// next:
// 1. do backend user routes (user edit/delete) use postman
// 2. then get the user page working (selecting users, and the bold & buttons showing)
// 3. get thumbnails to show


app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
});
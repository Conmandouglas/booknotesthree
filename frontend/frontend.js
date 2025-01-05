import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Corrected import statement

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public'))); // Serve static files from the 'public' directory

// Set the views directory and view engine
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');

app.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/`); // No need to pass userId explicitly
    res.render("index", response.data);
  } catch (err) {
    console.error("Error fetching data", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/users', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    console.log(response.data);
    
    res.render("users", {
      usersList: response.data.usersList,       // Extract the users list
      selectedUserId: response.data.selectedUserId, // Extract selectedUserId
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
    const name = req.body.name; // Get the name from the request
    await axios.post(`${API_URL}/adduser`, { name }); // Pass name in the POST request
    res.redirect('/');
  } catch (err) {
    console.error('Error fetching add user', err);
    res.status(500).send('Internal Server Error');
  }
});

// Other routes... after first route working be done

app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
});
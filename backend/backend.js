import express from 'express';
import pg from 'pg';
import fetch from 'node-fetch';
import session from 'express-session';
import cors from 'cors';

const app = express();  
const port = 4000;  
  
const db = new pg.Client({  
  user: "postgres",  
  host: "localhost",  
  database: "simplebooknotes",  
  password: "the_password",  
  port: 5432,  
});  
  
db.connect().catch(err => console.log(err));  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to set default selectedUserId if not set
app.use((req, res, next) => {
  if (!req.session.selectedUserId) {
    req.session.selectedUserId = 1; // Default user ID
  }
  next();
});

app.get("/session", (req, res) => {
  res.json(req.session);
});

async function fetchBooksAndReviews() {
  console.log("Fetching books and reviews");
  const booksQuery = `
    SELECT b.id AS book_id, b.title, b.author_name, b.thumb, r.id AS review_id, r.details, r.grade
    FROM books b
    LEFT JOIN reviews r ON b.id = r.book_id AND r.deleted_at IS NULL
    WHERE b.deleted_at IS NULL
    ORDER BY b.id DESC, r.id DESC;
  `;
  const result = await db.query(booksQuery).catch(err => {
    console.error('Error executing query', err.stack);
    throw err;
  });

  const books = {};
  for (const row of result.rows) {
    if (!books[row.book_id]) {
      books[row.book_id] = {
        id: row.book_id,
        title: row.title,
        author_name: row.author_name,
        thumb: row.thumb,
        reviews: []
      };
    }
    if (row.review_id) {
      books[row.book_id].reviews.push({
        id: row.review_id,
        details: row.details,
        grade: row.grade
      });
    }
  }

  console.log("Books and reviews fetched successfully:", books);
  return books;
}

async function usersName(userId) {
  console.log("Getting the user's name");
  const getUserNameQuery = `
    SELECT name
    FROM users
    WHERE id = $1;
  `;
  try {
    const result = await db.query(getUserNameQuery, [userId]);
    if (result.rows.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }
    const user = result.rows[0];
    console.log("User found:", user);
    return user.name;
  } catch (err) {
    console.error('Error fetching user name', err.stack);
    throw err;
  }
}

async function fetchUsers() {
  const usersQuery = `
  SELECT id, name
  FROM users
  WHERE deleted_at IS NULL
  ORDER BY id;  
  `;
  const result = await db.query(usersQuery);
  const usersList = result.rows;
  return usersList;
}

app.get("/", async (req, res) => {  
  try {  
   const booksListObject = await fetchBooksAndReviews();  
   const userId = req.session.selectedUserId;
   const userName = await usersName(userId);  

   const booksList = Object.values(booksListObject);

   res.json({ booksList, userName });  
  } catch (err) {  
   console.error('Error fetching data', err.stack);  
   res.status(500).send('Internal Server Error');  
  }  
});  
  
app.get('/users', async (req, res) => {
  console.log("hit backend users");
  try {
    const usersList = await fetchUsers();
    const selectedUserId = req.session.selectedUserId; // Get the selected user ID from the session

    res.json({
      usersList,         // List of users
      selectedUserId,    // Selected user ID
    });
  } catch (err) {
    console.error('Error fetching users', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add', async (req, res) => {
  console.log("hit backend");
  try {
    console.log(req.body);
    console.log("that was req body");
    const { title, author_name, details, grade } = req.body; // Destructure the data
    const insertBookQuery = `
      INSERT INTO books (title, author_name)
      VALUES ($1, $2)
      RETURNING id;
    `;
    const bookResult = await db.query(insertBookQuery, [title, author_name]);
    const bookId = bookResult.rows[0].id;

    if (details && grade) {
      const insertReviewQuery = `
        INSERT INTO reviews (book_id, details, grade, user_id)
        VALUES ($1, $2, $3, $4);
      `;
      await db.query(insertReviewQuery, [bookId, details, grade, req.session.selectedUserId]);
    }
    res.redirect('/'); // Redirect after adding
  } catch (err) {
    console.error('Error adding book', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/adduser', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Name is required');
  }

  try {
    const insertUserQuery = `
      INSERT INTO users (name)
      VALUES ($1)
      RETURNING id;
    `;
    const userResult = await db.query(insertUserQuery, [name]);
    res.status(201).send({ id: userResult.rows[0].id });
  } catch (err) {
    console.error('Error adding user', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

// other routes to do myself

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);  
});
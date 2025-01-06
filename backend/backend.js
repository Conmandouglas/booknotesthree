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

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'none'
  }
}));

app.use((req, res, next) => {
  console.log('Before Session Middleware:', req.session);
  if (!req.session.selectedUserId) {
    console.log('Setting default user ID');
    req.session.selectedUserId = 1;
  }
  console.log('After Session Middleware:', req.session);
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
  console.log('Session in GET /:', req.session);
   const booksListObject = await fetchBooksAndReviews();  
   const userId = req.session.selectedUserId;
   const userName = await usersName(userId);  
   console.log(`the username is ${userName}`);
   console.log(`while the id is ${userId}`);

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
    req.session.selectedUserId = userResult.rows[0].id;
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).send('Internal Server Error');
      }
      console.log('Session after adding user:', req.session);
      res.status(201).send({ id: userResult.rows[0].id });
    });
    
  } catch (err) {
    console.error('Error adding user', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/addreview', async (req, res) => {
  const { book_id, details, grade } = req.body;

  try {
    if (!book_id) {
      throw new Error("Book ID is required");
    }

    const insertReviewQuery = `
      INSERT INTO reviews (book_id, details, grade, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;  -- Adding RETURNING statement to get the inserted review id
    `;
    
    const reviewResult = await db.query(insertReviewQuery, [book_id, details, grade, req.session.selectedUserId]);

    // Respond with the review details
    res.status(201).json({ 
      reviewId: reviewResult.rows[0].id,
      book_id: reviewResult.rows[0].book_id,
      details: details,
      grade: grade
    });
  } catch (err) {
    console.error('Error adding review', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/updatereview', async (req, res) => {
  const reviewId = req.query.id; // Extract query parameter

  if (reviewId) {
    try {
      const reviewQuery = `
        SELECT id, details, grade
        FROM reviews
        WHERE id = $1;
      `;
      const result = await db.query(reviewQuery, [reviewId]);

      if (result.rows.length > 0) {
        const review = result.rows[0];
        console.log(review);
        res.json({
          book: null,
          review,
        });
      } else {
        res.status(404).send('Review not found');
      }
    } catch (err) {
      console.error('Error fetching review details', err.stack);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.render("edit.ejs", { book: null, review: null });
  }
});

app.post('/updatereview', async (req, res) => {
  const { id, details, grade } = req.body;
  console.log('HIT the /updatereview in the backend');
  console.log('ID:', id);
  console.log('Details:', details);
  console.log('Grade:', grade);

  try {
    const updateReviewQuery = `
      UPDATE reviews
      SET details = $1, grade = $2
      WHERE id = $3;
    `;
    const result = await db.query(updateReviewQuery, [details, grade, id]);
    
    // Send a response back to the client after a successful update
    console.log('Review updated successfully');
    res.status(200).json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error('Error updating review', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/update', async (req, res) => {
  console.log("Hit! Trying to render '/update'");
  const bookId = req.query.bookId; // Extract bookId from query parameters

  if (bookId) {
    try {
      const bookQuery = `
        SELECT b.id AS book_id, b.title, b.author_name, r.id AS review_id, r.details, r.grade
        FROM books b
        LEFT JOIN reviews r ON b.id = r.book_id
        WHERE b.id = $1;
      `;
      const result = await db.query(bookQuery, [bookId]);
      if (result.rows.length > 0) {
        const book = result.rows[0];
        res.json({
          book,
          review: null,
        });
      } else {
        res.status(404).send('Book not found');
      }
    } catch (err) {
      console.error('Error fetching book details', err.stack);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.render('edit.ejs', { book: null, review: null });
  }
});

app.post('/update', async (req, res) => {
  const { id, title, author_name, details, grade } = req.body;
  try {
    console.log('in backend')
    const updateBookQuery = `
      UPDATE books
      SET title = $1, author_name = $2
      WHERE id = $3;
    `;
    await db.query(updateBookQuery, [title, author_name, id]);

    console.log('Review updated successfully');
    res.status(200).json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error('Error updating book', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/updateuser', async (req, res) => {
  console.log('Hit! Trying to render "/edituser"');
  const { id } = req.query;
  if (id) {
    try {
      const userQuery = `
        SELECT id, name
        FROM users
        WHERE id = $1
      `;
      const result = await db.query(userQuery, [id]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        res.json({
          user,
        });
      } else {
        res.status(404).send('User not found');
      }
    } catch (err) {
      console.error('Error fetching user details', err.stack);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.json({
      user: null,
    })
  }
});

app.post('/updateuser', async (req, res) => {
  const { id, name } = req.body;
  try {
    const updateUserQuery = `
      UPDATE users
      SET name = $1
      WHERE id = $2
    `;
    await db.query(updateUserQuery, [name, id]);
  } catch (err) {
    console.error('Error updating user', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/deletebook', async (req, res) => {
  console.log('now its in the backend...');
  const { id } = req.query;  // Corrected to match the query parameter name
  console.log(id);
  try {
    // Set the deleted_at timestamp for the book
    const deleteBookQuery = `
      UPDATE books
      SET deleted_at = NOW()
      WHERE id = $1;
    `;
    await db.query(deleteBookQuery, [id]);

    // Set the deleted_at timestamp for associated reviews
    const deleteReviewsQuery = `
      UPDATE reviews
      SET deleted_at = NOW()
      WHERE book_id = $1;
    `;
    await db.query(deleteReviewsQuery, [id]);

    res.status(200).send('Book and associated reviews marked as deleted');
  } catch (err) {
    console.error('Error deleting book', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/deletereview', async (req, res) => {
  console.log('deleting review.. HIT in backend')
  const { id } = req.query ;

  try {
    const deleteReviewQuery = `
      UPDATE reviews
      SET deleted_at = NOW()
      WHERE id = $1;
    `;
    await db.query(deleteReviewQuery, [id]);
    res.status(200).send('Review marked as deleted');
  } catch (err) {
    console.error('Error deleting review', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/deleteuser', async (req, res) => {
  console.log('deleint user, HIT in backend');
  const { id } = req.query;
  try {
    // Check the total number of users
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM users
      WHERE deleted_at IS NULL;
    `;
    const countResult = await db.query(countQuery);
    const userCount = parseInt(countResult.rows[0].count, 10);

    if (userCount <= 1) {
      return res.status(400).send('Cannot delete the last remaining user');
    }

    // Set the deleted_at timestamp for the user
    const deleteUserQuery = `
      UPDATE users
      SET deleted_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;
    const deleteResult = await db.query(deleteUserQuery, [id]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    // If the deleted user was the selected user, update the selected user to the previous user ID
    if (req.session.selectedUserId === parseInt(id, 10)) {
      const previousUserQuery = `
        SELECT id
        FROM users
        WHERE id < $1 AND deleted_at IS NULL
        ORDER BY id DESC
        LIMIT 1;
      `;
      const previousUserResult = await db.query(previousUserQuery, [id]);

      if (previousUserResult.rows.length > 0) {
        req.session.selectedUserId = previousUserResult.rows[0].id;
      } else {
        // If there is no previous user, select the next user
        const nextUserQuery = `
          SELECT id
          FROM users
          WHERE id > $1 AND deleted_at IS NULL
          ORDER BY id ASC
          LIMIT 1;
        `;
        const nextUserResult = await db.query(nextUserQuery, [id]);

        if (nextUserResult.rows.length > 0) {
          req.session.selectedUserId = nextUserResult.rows[0].id;
        }
      }
    }
    res.status(200).send('User marked as deleted');
  } catch (err) {
    console.error('Error deleting user', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);  
});
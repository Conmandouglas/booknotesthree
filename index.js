import express from 'express';
import pg from 'pg';
import fetch from 'node-fetch';
import session from 'express-session';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "simplebooknotes",
  password: "the_password",
  port: 5432,
});

db.connect().catch(err => console.log(err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Configure session middleware
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
      let imageUrl = row.thumb;
      if (!imageUrl) {
        const openLibraryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(row.title)}&author=${encodeURIComponent(row.author_name)}`;
        const response = await fetch(openLibraryUrl);
        const data = await response.json();
        const coverId = data.docs && data.docs[0] && data.docs[0].cover_edition_key;
        imageUrl = coverId ? `https://covers.openlibrary.org/b/olid/${coverId}-L.jpg` : 'https://via.placeholder.com/200x300?text=No+Cover';

        // Update the book with the thumbnail URL
        const updateThumbQuery = `
          UPDATE books
          SET thumb = $1
          WHERE id = $2;
        `;
        await db.query(updateThumbQuery, [imageUrl, row.book_id]);
      }

      books[row.book_id] = {
        id: row.book_id,
        title: row.title,
        author_name: row.author_name,
        image_url: imageUrl,
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

  return Object.values(books);
}

async function usersName(userId) {
  console.log("Getting the user's name");
  const getUserNameQuery = `
    SELECT name
    FROM users
    WHERE id = $1
  `;
  const result = await db.query(getUserNameQuery, [userId]).catch(err => {
    console.error('Error executing query', err.stack);
    throw err;
  });
  return result.rows[0].name;
}

app.get("/", async (req, res) => {
  console.log("Hit! Trying to render '/' home route");

  const userId = req.session.selectedUserId; // Get the user ID from the session

  try {
    const userName = await usersName(userId);
    const booksList = await fetchBooksAndReviews();

    res.render("index.ejs", {
      booksList: booksList,
      userName: userName,
    });
  } catch (err) {
    console.error('Error fetching data', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/users', async (req, res) => {
  console.log("Hit! Trying to render '/users'");
  try {
    const usersQuery = `
      SELECT id, name
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY id;  
    `;
    const result = await db.query(usersQuery);
    const usersList = result.rows;

    res.render("users.ejs", {
      usersList: usersList,
      selectedUserId: req.session.selectedUserId, // Get the user ID from the session
    });
  } catch (err) {
    console.error('Error fetching users', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/add", async (req, res) => {
  console.log("Hit! Trying to render '/add'");
  res.render('edit.ejs', { book: null, review: null });
});

app.get('/adduser', async (req, res) => {
  console.log("Hit! Trying to render '/adduser'");
  res.render('edituser.ejs', { user: null });
});

app.get("/edit", async (req, res) => {
  console.log("Hit! Trying to render'/edit'");
  const bookId = req.query.id;
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
        res.render("edit.ejs", { book, review: null });
      } else {
        res.status(404).send('Book not found');
      }
    } catch (err) {
      console.error('Error fetching book details', err.stack);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.render("edit.ejs", { book: null, review: null });
  }
});

app.get('/edituser', async (req, res) => {
  console.log('Hit! Trying to render "/edituser"');
  const userId = req.query.id;
  if (userId) {
    try {
      const userQuery = `
        SELECT id, name
        FROM users
        WHERE id = $1
      `;
      const result = await db.query(userQuery, [userId]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        res.render('edituser.ejs', { user });
      } else {
        res.status(404).send('User not found');
      }
    } catch (err) {
      console.error('Error fetching user details', err.stack);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.render('edituser.ejs', { user: null });
  }
});

app.get("/editReview", async (req, res) => {
  console.log("Hit! Trying to render'/editReview'");
  const reviewId = req.query.id;
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
        res.render("edit.ejs", { book: null, review });
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

app.post("/add", async (req, res) => {
  const { title, author_name, details, grade } = req.body;
  try {
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

    res.redirect("/");
  } catch (err) {
    console.error('Error adding book', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/adduser', async (req, res) => {
  const { name } = req.body;
  try {
    const insertUserQuery = `
      INSERT INTO users (name)
      VALUES ($1)
      RETURNING id;
    `;
    const userResult = await db.query(insertUserQuery, [name]);
    req.session.selectedUserId = userResult.rows[0].id;

    res.redirect("/");
  } catch (err) {
    console.error('Error adding user', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/update", async (req, res) => {
  const { id, title, author_name, details, grade } = req.body;
  try {
    const updateBookQuery = `
      UPDATE books
      SET title = $1, author_name = $2
      WHERE id = $3;
    `;
    await db.query(updateBookQuery, [title, author_name, id]);

    if (details && grade) {
      const updateReviewQuery = `
        INSERT INTO reviews (book_id, details, grade, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (book_id) DO UPDATE
        SET details = EXCLUDED.details, grade = EXCLUDED.grade;
      `;
      await db.query(updateReviewQuery, [id, details, grade, req.session.selectedUserId]);
    }

    res.redirect("/");
  } catch (err) {
    console.error('Error updating book', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/updateReview", async (req, res) => {
  const { id, details, grade } = req.body;
  try {
    const updateReviewQuery = `
      UPDATE reviews
      SET details = $1, grade = $2
      WHERE id = $3;
    `;
    await db.query(updateReviewQuery, [details, grade, id]);
    res.redirect("/");
  } catch (err) {
    console.error('Error updating review', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updateUser', async (req, res) => {
  const { id, name } = req.body;
  try {
    const updateUserQuery = `
      UPDATE users
      SET name = $1
      WHERE id = $2
    `;
    await db.query(updateUserQuery, [name, id]);
    res.redirect('/users');
  } catch (err) {
    console.error('Error updating user', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/addReview", async (req, res) => {
  const { book_id, details, grade } = req.body;
  try {
    if (!book_id) {
      throw new Error("Book ID is required");
    }
    const insertReviewQuery = `
      INSERT INTO reviews (book_id, details, grade, user_id)
      VALUES ($1, $2, $3, $4);
    `;
    await db.query(insertReviewQuery, [book_id, details, grade, req.session.selectedUserId]);
    res.redirect("/");
  } catch (err) {
    console.error('Error adding review', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.delete("/deleteBook", async (req, res) => {
  const bookId = req.query.id;
  try {
    // Set the deleted_at timestamp for the book
    const deleteBookQuery = `
      UPDATE books
      SET deleted_at = NOW()
      WHERE id = $1;
    `;
    await db.query(deleteBookQuery, [bookId]);

    // Set the deleted_at timestamp for associated reviews
    const deleteReviewsQuery = `
      UPDATE reviews
      SET deleted_at = NOW()
      WHERE book_id = $1;
    `;
    await db.query(deleteReviewsQuery, [bookId]);

    res.status(200).send('Book and associated reviews marked as deleted');
  } catch (err) {
    console.error('Error deleting book', err.stack);
    res.status(500).send('Internal Server Error');
  }
});
app.delete("/deleteReview", async (req, res) => {
  const reviewId = req.query.id;
  try {
    const deleteReviewQuery = `
      UPDATE reviews
      SET deleted_at = NOW()
      WHERE id = $1;
    `;
    await db.query(deleteReviewQuery, [reviewId]);
    res.status(200).send('Review marked as deleted');
  } catch (err) {
    console.error('Error deleting review', err.stack);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/deleteUser', async (req, res) => {
  const userId = req.query.id;
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
    const deleteResult = await db.query(deleteUserQuery, [userId]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    // If the deleted user was the selected user, update the selected user to the previous user ID
    if (req.session.selectedUserId === parseInt(userId, 10)) {
      const previousUserQuery = `
        SELECT id
        FROM users
        WHERE id < $1 AND deleted_at IS NULL
        ORDER BY id DESC
        LIMIT 1;
      `;
      const previousUserResult = await db.query(previousUserQuery, [userId]);

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
        const nextUserResult = await db.query(nextUserQuery, [userId]);

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

app.post('/updateSelectedUser', (req, res) => {
  const { userId } = req.body;
  req.session.selectedUserId = userId;
  res.status(200).send('Selected user updated');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
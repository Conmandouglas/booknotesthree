CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	deleted_at TIMESTAMP NULL
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  details TEXT NOT NULL,
  grade INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL REFERENCES users(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	deleted_at TIMESTAMP NULL
);

INSERT INTO users (name)
VALUES ('Connor'), ('Jack'), ('Padre'), ('Jill')

INSERT INTO books (title, author_name)
VALUES ('The Great Gatsby', 'F. Scott Fitzgerald'), ('The Hunger Games', 'Suzanne Collins')

INSERT INTO reviews (details, grade, user_id, book_id)
VALUES ('This was a pretty good book!', 9, 1, 1), ('This was an awesome book.', 8, 2, 1), ('I dont really like it', 3, 1, 2)
-- all edits made after, using other such means, should be displayed below, not direct edits to above --
ALTER TABLE books
ADD COLUMN thumb TEXT
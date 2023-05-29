// import required modules
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
// create connection to MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "roengrang",
});
const Storage = multer.diskStorage({
  destination: "public/images",
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: Storage,
});
// connect to MySQL database
db.connect((error) => {
  if (error) {
    console.log("Error connecting to MySQL database:", error);
  } else {
    console.log("Connected to MySQL database");
  }
});

// create express application
const app = express();
app.use(bodyParser.json());
app.use(cors());

// get users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (error, results, fields) => {
    if (error) {
      console.log("Error retrieving users:", error);
      res.status(500).send("Error retrieving users");
    } else {
      console.log(results);
      res.send(results);
    }
  });
});

//findOne
app.get("/users/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM users WHERE id = ?",
    [id],
    (error, results, fields) => {
      if (error) {
        console.log("Error retrieving user:", error);
        res.status(500).send("Error retrieving user");
      } else {
        res.send(results[0]);
      }
    }
  );
});

// add
app.post("/user/add", (req, res) => {
  const data = req.body;
  db.query("INSERT INTO users SET ?", data, (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).json("Error inserting data into database");
    } else {
      console.log(`Data inserted into database with ID ${result.insertId}`);
      res.status(200).json("Data inserted into database");
    }
  });
});

// update
app.put("/book/:id", upload.single("image"), (req, res) => {
  const id = req.params.id;
  console.log("req.file", req.file);
  console.log("req.body", req.body);
  // const { name, username } = req.body;
  // db.query('UPDATE books SET name = ?, name = ? WHERE id = ?', [name, username, id], (error, results) => {
  //     if (error) {
  //         console.log('Error updating user:', error);
  //         res.status(500).send('Error updating user');
  //     } else {
  //         res.send(results);
  //     }
  // });
});

// delete
app.delete("/users/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM users WHERE id = ?", [id], (error, results, fields) => {
    if (error) {
      console.log("Error deleting user:", error);
      res.status(500).json("Error deleting user");
    } else {
      res.status(200).json("Delete Success");
    }
  });
});


// add
app.post("/book/add", (req, res) => {
  const data = req.body;
  db.query("INSERT INTO books SET ?", data, (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).json("Error inserting data into database");
    } else {
      console.log(`Data inserted into database with ID ${result.insertId}`);
      res.status(200).json("Data inserted into database");
    }
  });
});
app.get("/book/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM books WHERE id = ?",
    [id],
    (error, results, fields) => {
      if (error) {
        console.log("Error retrieving user:", error);
        res.status(500).send("Error retrieving user");
      } else {
        res.send(results[0]);
      }
    }
  );
});

// update
app.put("/users/:id", (req, res) => {
  const id = req.params.id;
  const { name, username } = req.body;
  db.query(
    "UPDATE users SET name = ?, username = ? WHERE id = ?",
    [name, username, id],
    (error, results) => {
      if (error) {
        console.log("Error updating user:", error);
        res.status(500).send("Error updating user");
      } else {
        res.send(results);
      }
    }
  );
});

// get product
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (error, results, fields) => {
    if (error) {
      console.log("Error retrieving products:", error);
      res.status(500).send("Error retrieving products");
    } else {
      console.log(results);
      res.send(results);
    }
  });
});

// delete
app.delete("/users/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM users WHERE id = ?", [id], (error, results, fields) => {
    if (error) {
      console.log("Error deleting user:", error);
      res.status(500).json("Error deleting user");
    } else {
      res.status(200).json("Delete Success");
    }
  });
});

app.post("/books/add", upload.single("image"), (req, res) => {
  console.log("body", req.file); // should log the file data
  const { name, price, image } = req?.body;
  // const insertQuery = `INSERT INTO books (name,price,image) VALUES (?, ?, ?)`;
  // db.query(insertQuery, [name, price, image], (err, result) => {
  //     if (err) {
  //         console.error('Error inserting data: ', err);
  //     } else {
  //         console.log('Data inserted successfully');
  //         res.status(200).send('File uploaded successfully');
  //     }
  // });
});

//login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = crypto
    .createHash("md5")
    .update(password)
    .digest("hex");
  // Query the database for the user with the given email
  const sql = "SELECT * FROM users WHERE user_email = ?";
  const params = [username];
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
    if (results.length === 0) {
      return res.status(401).send("Invalid email or password");
    }
    // Check if the password matches the one in the database
    const user = results[0];
    if (hashedPassword !== user.user_password) {
      return res.status(401).send("Invalid email or password");
    }
    // Return a success message
    const { user_id, user_fullname } = user;
    const userData = { user_id, user_fullname };
    console.log(userData);
    return res.status(200).json(userData);
  });
});
// create API endpoint to retrieve a single user by ID

// start server on port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});

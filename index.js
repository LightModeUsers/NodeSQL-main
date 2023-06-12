// import required modules
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const fs = require("fs"); // Import the fs module

const upload = multer({ dest: "public/images" });

cloudinary.config({
  cloud_name: "dlne5j5ub",
  api_key: "232327965775433",
  api_secret: "jJbI7p20xpDJzI4tPNNf9w8R_zg",
});

// create connection to MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "roengrang",
});

// connect to MySQL database
db.connect((error) => {
  if (error) {
    console.log("Error connecting to MySQL database:", error);
  } else {
    console.log("Connected to MySQL database");
  }
});
const app = express();
app.use(bodyParser.json());
app.use(cors());

//upload
app.post("/upload", upload.single("user_img"), async (req, res) => {
  try {
    const dataFile = req?.body?.user_img;
    const data = dataFile.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(data, "base64");
    const filePath = "uploads/file.png";
    fs.writeFile(filePath, buffer, async (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return;
      }
    });
    cloudinary.uploader.upload(filePath, (error, result) => {
      if (error) {
        console.log("Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
      } else {
        const newData = {
          user_fullname: req?.body?.user_fullname,
          user_password: req?.body?.user_password,
          user_email: req?.body?.user_email,
          user_img: result?.secure_url,
        };
        db.query("INSERT INTO users SET ?", newData, (error, result) => {
          if (error) {
            console.error(error);
            res.status(500).json("Error inserting data into database");
          } else {
            console.log(
              `Data inserted into database with ID ${result.insertId}`
            );
            res.status(200).json("Data inserted into database");
          }
        });
      }
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ status: 0, message: "Upload failed" });
  }
});
// create express application

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

app.post("/order/add", (req, res) => {
  const { proId, userId, ord_amount, user_fullname, ord_tel, address, ord_road, ord_soi, ord_province, ord_district, ord_subdistrict, ord_postID, ord_location, ord_note } = req.body;

  db.query(
    "SELECT * FROM products LEFT JOIN shop ON products.shop_id = shop.shop_id WHERE products.pro_id = ? ORDER BY products.pro_id",
    [proId],
    (error, results) => {
      if (error) {
        console.log("Error updating user:", error);
        res.status(500).send("Error updating user");
      } else {
        const pro = results[0];
        const pro_amount = pro['pro_amount'] - ord_amount;
        const pro_selled = pro['pro_selled'] + ord_amount;
        const sum_price = pro['pro_price'] * ord_amount;
        const total_price = 10 + sum_price;

        // บันทึกข้อมูลการสั่งซื้อสินค้าลงในฐานข้อมูล
        db.query(
          "INSERT INTO orders (pro_id, shop_id, user_id, ord_name, ord_amount, sum_price, sent_price, total_price, ord_tel, ord_location, ord_address, ord_road, ord_soi, ord_province, ord_district, ord_subdistrict, ord_postID, ord_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [proId, pro['shop_id'], userId, user_fullname, ord_amount, sum_price, '10', total_price, ord_tel, ord_location, address, ord_road, ord_soi, ord_province, ord_district, ord_subdistrict, ord_postID, ord_note],
          (error, result) => {
            if (error) {
              console.log("Error adding order:", error);
              res.status(500).send("Error adding order");
            } else {
              console.log("Order added successfully");
              res.status(200).send("Order added successfully");
            }
          }
        );

        // อัพเดตจำนวนสินค้าและจำนวนที่ขายในตาราง products
        db.query(
          "UPDATE products SET pro_amount = ?, pro_selled = ? WHERE pro_id = ?",
          [pro_amount, pro_selled, proId],
          (error, result) => {
            if (error) {
              console.log("Error updating product:", error);
              // การจัดการข้อผิดพลาดในการอัพเดตสินค้า
            } else {
              console.log("Product updated successfully");
              // การจัดการเมื่ออัพเดตสินค้าสำเร็จ
            }
          }
        );
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
app.get("/orderAll/:id", (req, res) => {
  const user_id = req.params.id;
  console.log(user_id)
  db.query(
    "SELECT * FROM orders LEFT JOIN products ON orders.pro_id = products.pro_id LEFT JOIN shop ON products.shop_id = shop.shop_id WHERE orders.user_id = ?",
    [user_id],
    (error, results, fields) => {
      if (error) {
        console.log("Error retrieving product:", error);
        res.status(500).send("Error retrieving product");
      } else {
        console.log(results);
        res.send(results);
      }
    }
  );
});

app.get("/orderStatus/:id/:st", (req, res) => {
  const user_id = req.params.id;
  const st = req.params.st;
  console.log(user_id)
  db.query(
    "SELECT * FROM orders LEFT JOIN products ON orders.pro_id = products.pro_id LEFT JOIN shop ON products.shop_id = shop.shop_id WHERE orders.order_status = ? AND orders.user_id = ?",
    [st,user_id],
    (error, results, fields) => {
      if (error) {
        console.log("Error retrieving product:", error);
        res.status(500).send("Error retrieving product");
      } else {
        console.log(results);
        res.send(results);
      }
    }
  );
});

// get productDetail
app.get("/products/:pro_id", (req, res) => {
  const proId = req.params.pro_id;
  db.query(
    "SELECT * FROM products WHERE pro_id = ?",
    [proId],
    (error, results, fields) => {
      if (error) {
        console.log("Error retrieving product:", error);
        res.status(500).send("Error retrieving product");
      } else {
        console.log(results);
        res.send(results);
      }
    }
  );
});
// get orderDetail
app.get("/orders/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM orders LEFT JOIN products ON orders.pro_id = products.pro_id LEFT JOIN shop ON products.shop_id = shop.shop_id WHERE orders.id = ?",
    [id],
    (error, results, fields) => {
      if (error) {
        console.log("Error retrieving product:", error);
        res.status(500).send("Error retrieving product");
      } else {
        console.log(results);
        res.send(results);
      }
    }
  );
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
  console.log("body", req.file);
  const { name, price, image } = req?.body;
});

app.put("/upload/status4", upload.single("image"), (req, res) => {
  const { id } = req.body;

  db.query(
    "UPDATE orders SET order_status = ?, receive_date = CURRENT_TIMESTAMP, recieve_img = ?, paymentUser_img = ?, payment_status = '1' WHERE orders.id = ?",
    [id, req.file.filename, req.file.path], // Assuming you want to save the filename and file path in the database
    (error, results, fields) => {
      if (error) {
        console.log("Error updating order:", error);
        res.status(500).json("Error updating order");
      } else {
        res.status(200).json("Update Success");
      }
    }
  );
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
// add
app.post("/status1/:pro_id", (req, res) => {
  const pro_id = req.params.pro_id;
  db.query(
    "UPDATE orders SET order_status = ?, doing_date = CURRENT_TIMESTAMP WHERE orders.id = ?",
    [2, pro_id],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).json("Error updating data in the database");
      } else {
        console.log("Data updated in the database");
        res.status(200).json("Data updated in the database");
      }
    }
  );
});

// start server on port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});

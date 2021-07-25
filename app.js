//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mysql = require("mysql");
const moment = require("moment");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Connect to db
const connection = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: ''
});

app.get("/", function(req, res) {
  connection.query('SELECT * FROM CONTACT', function(err, rows, fields) {
    if (err) throw err;
    res.render("home", {
      data: rows
    });
  });
});

// For pages on navbar
app.get("/:page", function(req, res) {
  res.render(req.params.page);
});

app.get("/user/create", function(req, res) {
  res.render("create");
});

// POST from html form on create page
app.post("/user/create", function(req, res) {
  // The Object.entries() method returns an array of a given object's own enumerable string-keyed property [key, value] pairs
  const keyValuePair = Object.entries(req.body);
  let keys = [];
  let values = [];
  // Iterate through the pairs
  keyValuePair.forEach((entry, index, array) => {
    // Deal with the empty string, skip empty strings
    if (entry[1] != "") {
      keys.push(entry[0]);
      values.push('"' + entry[1] + '"');
    }
  });
  // Create new contact by insert into CONTACT table
  connection.query('INSERT INTO CONTACT (' + keys.join() + ') VALUES (' + values.join() + ')', function(err, user, fields) {
    if (err) throw err;
    // After query, it returns the id (insertId)
    res.redirect("/user/edit/" + user.insertId);
  });
});

app.get("/user/:category/:Contact_id", function(req, res) {
  const cid = req.params.Contact_id;
  const cat = req.params.category;

  // user/delete/Contact_id
  if (cat == "delete") {
    connection.query('DELETE FROM CONTACT WHERE Contact_id = "' + cid + '"', function(err, user, fields) {
      if (err) throw err;
      // After delete contact, redirect to homepage.
      res.redirect("/");
    });
  } else {
    // user/edit/Contact_id OR user/:category/Contact_id
    connection.query('SELECT * FROM CONTACT WHERE Contact_id = "' + cid + '"', function(err, contact, fields) {
      if (err) throw err;
      // Display edit page: user/edit/Contact_id
      if (cat == "edit") {
        connection.query('SELECT * FROM ADDRESS WHERE Contact_id = "' + cid + '"', function(err, address, fields) {
          if (err) throw err;
          connection.query('SELECT * FROM PHONE WHERE Contact_id = "' + cid + '"', function(err, phone, fields) {
            if (err) throw err;
            connection.query('SELECT * FROM DATE WHERE Contact_id = "' + cid + '"', function(err, date, fields) {
              if (err) throw err;
              // Check the query (from DATE table). If not empty, convert Date data for html input
              if (!_.isEmpty(date)) {
                date.forEach(function(element) {
                  element.Date = moment(element.Date).format("YYYY-MM-DD");
                });
              }
              res.render("edit", {
                contact: contact,
                address: address,
                phone: phone,
                date: date
              });
            });
          });
        });
      } else {
        // Display category's table from specific contact: user/:category/Contact_id
        connection.query('SELECT * FROM ' + cat + ' WHERE Contact_id = "' + cid + '"', function(err, rows, fields) {
          if (err) throw err;
          // Check the query (from DATE table). If not empty, convert Date data for html input
          if (cat == "date" && !_.isEmpty(rows)) {
            rows.forEach(function(element) {
              element.Date = moment(element.Date).format("YYYY-MM-DD");
            });
          }
          res.render(cat, {
            data: rows,
            contact: contact
          });
        });
      }
    });
  }
});

// action: create/edit/delete
app.all("/:category/:action/:item_id", function(req, res) {
  const action = req.params.action;
  const iid = req.params.item_id;
  const cat = req.params.category;
  // Create new record of address/date/phone of a specific contact (POST from html form on contact's edit page)
  if (action == "create") {
    const keyValuePair = Object.entries(req.body);
    let keys = [];
    let values = [];
    keyValuePair.forEach((entry, index, array) => {
      if (entry[1] != "") {
        keys.push(entry[0]);
        values.push('"' + entry[1] + '"');
      }
    });
    connection.query('INSERT INTO ' + cat + ' (Contact_id, ' + keys.join() + ') VALUES (' + iid + ', ' + values.join() + ')', function(err, user, fields) {
      if (err) throw err;
      // Redirect to the same page for refetching data
      res.redirect("/user/edit/" + iid);
    });
  } else {
    // For delete or edit
    connection.query('SELECT Contact_id FROM ' + cat + ' WHERE ' + cat + '_id = "' + iid + '"', function(err, rows, fields) {
      if (err) throw err;
      // Update/Edit existing record of specific contact (including CONTACT table)
      if (action == "edit") {
        const keyValuePair = Object.entries(req.body);
        let loopQuery = new Promise((resolve, reject) => {
          keyValuePair.forEach((entry, index, array) => {
            connection.query('UPDATE ' + cat + ' SET ?? = NULLIF(?, "") WHERE ' + cat + '_id = "' + iid + '"', [entry[0], entry[1]], function(err, user, fields) {
              if (err) throw err;
              if (index === array.length - 1) resolve();
            });
          });
        });
        loopQuery.then(() => {
          res.redirect("/user/edit/" + rows[0].Contact_id);
        });
      } else if (action == "delete") {
        // Delete existing record of specific contact (NOT including CONTACT table)
        connection.query('DELETE FROM ' + cat + ' WHERE ' + cat + '_id = "' + iid + '"', function(err, user, fields) {
          if (err) throw err;
          res.redirect("/user/edit/" + rows[0].Contact_id);
        });
      }
    });
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

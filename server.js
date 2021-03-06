var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
require('dotenv').config();

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

//first we will have the serer connect to a local db and if that doesn't work it will connect to a external db
var MONGODB_URI = "mongodb://localhost/interceptScraper" || process.env.MONGODB_URI;

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI);


// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://theintercept.com/").then(function(response) {

    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every Promo-container within an class name, and do the following:
    $(".Promo-container").each(function(i, element) {
      //  console.log(this.children.children);

      // Save an empty result object (array)...
    var result = {};
    // console.log(response.data);

      //2 different objects with the same keys & values stored in them- 
      // We prefer to use this if we know what the keys & values should be in advanced
      //var nonEmptyObject = {key: "value"};
      // console.log(nonEmptyObject);

      //if you are unsure what you will store in your object then you can use this construction
      // var tempEmptyObject = {};
      // tempEmptyObject.key = "value";
      // console.log(tempEmptyObject);

      // We're building a result object. Add the text and href of every link, and save them as properties of the result object  class="Promo-title-wrap"
      result.headline = $(element)
        .find(".Promo-title-wrap")
        .text();
      result.summary = $(element)
        .find(".Excerpt")
        .text();
        // console.log(result);
        
      result.url = $(element)
        .children()
        .next()
        .children()
        .attr("href");
        // console.log(result)

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        //error handling... 
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("your article is scraped!");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticles) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticles);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the comments associated with it
    .populate("comment")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(function(dbComment) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

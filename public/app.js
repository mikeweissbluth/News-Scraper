const freshScrape=(articles)=>{
  for (var i = 0; i < articles.length; i++) {
    // Display the apropos information on the page
    $("#articles").prepend("<p data-id='" + articles[i]._id + "'>" + articles[i].headline + "<br />" + articles[i].summary + "<br />" + "<a target='_blank' href='https://www.theintercept.com" + articles[i].url + "'>"+ articles[i].url +"</a>" + "</p>");
  }
}

// <a href= "url" >url</a>
// + "<a href='https://www.theintercept.com" + articles[i].url + "'>"+ articles[i].url +"</a>" +

$("#newScrape").click(function(){
  // console.log("is this working?");
  $.ajax({
    method: "GET",
    url:"/scrape"
  })
  .then(function(data) {
    console.log(data);
    // Grab the articles as a json 
    $.getJSON("/articles", function(articles) {

     freshScrape(articles);
    });
  });
});

// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the notes from the comments section
  $("#comments").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the article
      $("#comments").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#comments").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#comments").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#comments").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.comment) {
        // Place the title of the note in the title input
        // $("#titleinput").val(data.comment.title);
        // Place the body of the note in the body text area
        $("#bodyinput").val(data.comment.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      // title: $("#titleinput").val(),
      // Value taken from note text area
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#comments").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

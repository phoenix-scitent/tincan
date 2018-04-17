//get activity_id bookmark if it exists
bookmarking.get(function(bookmark){

  if (bookmark !== null) {

    $.confirm({
      content: 'Do you want to resume where you left off?',
      confirmButton: 'YES',
      cancelButton: 'NO',
      confirm: function () {
        bookmarking.initFromBookmark(bookmark);

        if (!bookmarking.getCompletion()) {
          var resumedStatement = {
            verb: {
              id: "http://adlnet.gov/expapi/verbs/resumed",
              display: {
                "en-US": "resumed"
              }
            },
            context: Activity.getContext(),
            result: {
              duration: TinCan.Utils.convertMillisecondsToISO8601Duration(bookmark.attemptDuration)
            }
          };
          statements.push(resumedStatement);
        }
      },
      cancel: function () {
        bookmarking.reset();

        //start new attempt
        statements.push(attemptedStatement);
        bookmarking.save(function(err, xhr){});
      }
    });

  } else {
    // if there isn't a stored bookmark, start the user at the first page
    bookmarking.setPage(0);
    statements.push(attemptedStatement);
  }

  tincan.sendStatements(statements, function(response, data){
    var err = response.err;
    if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
  });

});
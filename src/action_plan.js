////////////////
  // ACTIONPLAN //
  ////////////////

  // action plan type action
  var actionPlanVerb = 'http://adlnet.gov/expapi/verbs/actionPlanUpdated';
  var actionPlanDisplay = 'updated action plan';

  // action plan identifier
  var actionPlanIdExtension = 'http://adlnet.gov/expapi/activities/actionPlan';
  var actionPlanResponsesExtension = 'http://adlnet.gov/expapi/activities/actionPlanResponses';

  const setActionplanData = function({ takeaway }){
    // takeaway :: { identifier: { 'qId': { text: '', context: [], value: '' }, 'qId2': { ... }, ... } }

    var identifier = R.compose(R.head, R.keys)(takeaway);
    var responses = R.compose(R.head, R.values)(takeaway);

    const subject = async();

    var statements = [];

    var createObject = function () {
      return {
        "id": Activity.id,
        "objectType": "Activity",
        "definition": {
          "name": {"en-US": identifier },
          "description": {"en-US": Activity.definition.name},
          "type": actionPlanIdExtension
        },
        "name": identifier
      }
    };

    var createResult = function () {
      return {}
    };

    var context = {};

    var extensions = {};

    extensions[actionPlanIdExtension] = identifier;

    extensions[actionPlanResponsesExtension] = responses;

    context['extensions'] = extensions;

    var interactionStatement = {
      verb: {
        id: actionPlanVerb,
        display: {
          "en-US": actionPlanDisplay
        }
      },
      result: createResult(),
      object: createObject(),
      context: context
    };

    statements.push(interactionStatement);

    pushToLRS(statements, function(response, data){
      var err = response.err;
      if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
    });

    return subject;
  };

  const getActionplanData = function({ identifier }){
    const subject = async();

    //TODO: extract AJAX into function that takes params and builds query string like `tincan.getStatements`...

    var query = '?agent=' + encodeURI(JSON.stringify(tincan.actor)) + '&verb=' + actionPlanVerb;

    var handleActionplanData = function(result){
      var actionplanId = identifier;
      var thisActor = function(statement) {
        return statement['actor']['account'] ? (statement['actor']['account']['name'] === tincan.actor.account.name) : (statement['actor']['mbox'] === tincan.actor.mbox)
      };
      var statements = result['statements'].filter(thisActor).filter(function(statement) {
        return statement['context']['extensions'] && statement['context']['extensions'][actionPlanIdExtension] === actionplanId
      }).sort(function(a,b){
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      var recentStatement = R.head(statements);

      //var id = R.pathOr(null, ['context', 'extensions', actionPlanIdExtension], recentStatement);
      var body = R.pathOr({}, ['context', 'extensions', actionPlanResponsesExtension], recentStatement);

      subject.next(body).complete();

    };

    $.ajax({
      url: tincan.recordStores[0]['endpoint'] + "statements" + query,
      type: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', tincan.recordStores[0]['auth']);
      },
      success: handleActionplanData
    });

    return subject;
  };
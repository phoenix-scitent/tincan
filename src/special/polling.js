//////////
// POLL //
//////////

// poll type action
var pollVerb = 'http://adlnet.gov/expapi/verbs/polled';
var pollDisplay = 'polled';

// poll identifier
var pollIdExtension = 'http://adlnet.gov/expapi/activities/poll';

const setPollResponse = function({ identifier, type, question, response }){
// identifier :: [String] unique poll ref
// type :: [String] type of poll (ex. radio, text, etc...)
// question :: [String] question text
// response :: [String] response text

const subject = async();

var statements = [];

var createObject = function () {
  return {
    "id": Activity.id,
    "objectType": "Activity",
    "definition": {
      "name": {"en-US": question},
      "description": {"en-US": Activity.definition.name},
      "type": pollIdExtension + '/' + type
    },
    "name": identifier
  }
};

var createResult = function () {
  return {
    "response": response
  }
};

var context = {};

var extensions = {};

extensions[pollIdExtension] = identifier;

context['extensions'] = extensions;

var interactionStatement = {
  verb: {
    id: pollVerb,
    display: {
      "en-US": pollDisplay
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

// TODO: DRY these two into single function with choice for one or all algorithm

const getPollResponseData = function({ identifier }){
const subject = async();

//TODO: extract AJAX into function that takes params and builds query string like `tincan.getStatements`...

var query = '?activity=' + tincan.activity.id + '&verb=' + pollVerb;

var handlePollData = function (result) {
  var pollId = identifier;
  var thisActor = function (statement) {
    return statement['actor']['account'] ? (statement['actor']['account']['name'] === tincan.actor.account.name) : (statement['actor']['mbox'] === tincan.actor.mbox)
  };
  var statements = result['statements'].filter(function (statement) {
    return statement['context']['extensions'] && statement['context']['extensions'][pollIdExtension] === pollId
  });
  var statement = statements.filter(thisActor);
  subject.next(statement.length === 0 ? null : statement[0]['result']['response']).complete();
};

$.ajax({
  url: tincan.recordStores[0]['endpoint'] + "statements" + query,
  type: "GET",
  beforeSend: function (xhr) {
    xhr.setRequestHeader('Authorization', tincan.recordStores[0]['auth']);
  },
  success: handlePollData
});

return subject;
};

const getPollResponsesData = function({ identifier }){
const subject = async();

//TODO: extract AJAX into function that takes params and builds query string like `tincan.getStatements`...

var query = '?activity=' + tincan.activity.id + '&verb=' + pollVerb;

var handlePollData = function (result) {
  var pollId = identifier;
  var thisActor = function (statement) {
    return statement['actor']['account'] ? (statement['actor']['account']['name'] === tincan.actor.account.name) : (statement['actor']['mbox'] === tincan.actor.mbox)
  };
  var statements = result['statements'].filter(function (statement) {
    return statement['context']['extensions'] && statement['context']['extensions'][pollIdExtension] === pollId
  });
  var statement = statements.filter(thisActor);
  subject.next(statements.map(function (statement) { return {value: statement['result']['response']} })).complete();
};

$.ajax({
  url: tincan.recordStores[0]['endpoint'] + "statements" + query,
  type: "GET",
  beforeSend: function (xhr) {
    xhr.setRequestHeader('Authorization', tincan.recordStores[0]['auth']);
  },
  success: handlePollData
});

return subject;
};
import $ from 'jquery'; // TODO: need to get rid of this after fixing resume progress
import { timer, slugify } from './helpers';
import { bus } from 'partybus';
import R from 'ramda';
import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';

export default function(CONFIG, isLocal, authUrl){

  // ActivityID that is sent for the statement's object
  const TC_COURSE_ID = CONFIG.full_url;

  // CourseName for the activity
  const TC_COURSE_NAME = { "en-US": CONFIG.activity_name };

  // CourseDesc for the activity
  const TC_COURSE_DESC = { "en-US": CONFIG.activity_name };

  // Pre-configured LRSes that should receive data, added to what is included
  // in the URL and/or passed to the constructor function.
  //
  // An array of objects where each object may have the following properties:
  //
  //    endpoint: (including trailing slash '/')
  //    auth:
  //    allowFail: (boolean, default true)
  //
  // TC_RECORD_STORES = [
  //   {
  //     endpoint: "https://cloud.scorm.com/ScormEngineInterface/TCAPI/public/",
  //     auth:     "Basic VGVzdFVzZXI6cGFzc3dvcmQ="
  //   }
  // ];

  const Tincan = {};

  Tincan.CourseActivity = {
    id: TC_COURSE_ID,
    definition: {
      type: "http://adlnet.gov/expapi/activities/course",
      name: TC_COURSE_NAME,
      description: TC_COURSE_DESC
    }
  };

  Tincan.getContext = function (parentActivityId, isAssessment) {
    //isAssessment = typeof isAssessment !== 'undefined' ? isAssessment : false;
    //var ctx = {
    //  contextActivities: {
    //    grouping: [
    //      {
    //        id: Tincan.CourseActivity.id
    //      },
    //      {
    //        id: "http://id.tincanapi.com/activity/tincan-prototypes"
    //      }
    //    ],
    //    category: [
    //      {
    //        id: "http://id.tincanapi.com/recipe/tincan-prototypes/golf/1",
    //        definition: {
    //          type: "http://id.tincanapi.com/activitytype/recipe"
    //        }
    //      },
    //      {
    //        id: "http://id.tincanapi.com/activity/tincan-prototypes/elearning",
    //        definition: {
    //          type: "http://id.tincanapi.com/activitytype/source",
    //          name: {
    //            "en-US": "E-learning course"
    //          },
    //          description: {
    //            "en-US": "An e-learning course built using the golf prototype framework."
    //          }
    //        }
    //      }
    //    ]
    //  }
    //};
    //if (parentActivityId !== undefined && parentActivityId !== null) {
    //  ctx.contextActivities.parent = {
    //    id: parentActivityId
    //  };
    //}
    //if (isAssessment) {
    //  ctx.contextActivities.grouping.push({
    //    id: Tincan.CourseActivity.id + "/GolfAssessment"
    //  });
    //}
    var ctx = {};
    return ctx;
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //// https://github.com/RusticiSoftware/TinCanJS                                                             ////
  //// http://rusticisoftware.github.io/TinCanJS                                                               ////
  //// http://rusticisoftware.github.io/TinCanJS/doc/api/latest/classes/TinCan.LRS.html#method_queryStatements ////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var tincan = new TinCan({
    url: authUrl || window.location.href,
    activity: Tincan.CourseActivity
  });

  var BookmarkingTracking = function () {
    this.questionsAnswered = {};
    this.completionState = [];
    this.currentPage = 0;
    this.startTimeStamp = new Date();
    this.startAttemptDuration = 0;
    this.attemptComplete = false;
  };

  BookmarkingTracking.prototype = {
    initFromBookmark: function (bookmark) {
      // this.setPage(parseInt(bookmark.location, 10));
      // this.setStartDuration(bookmark.attemptDuration);
      // this.getCompletion(bookmark.attemptComplete);
      if (bookmark && bookmark.completionState) {
        this.completionState = bookmark.completionState;
        $(document).trigger('resumeProgress', [this.completionState])
      }
    },
    reset: function () {
      this.setPage(0);
      this.setStartDuration(0);
      this.setCompletion(false);
    },
    save: function (callback) {
      var bookmarking = {
        location: this.currentPage,
        attemptDuration: this.getAttemptDuration(),
        attemptComplete: this.attemptComplete,
        questionsAnswered: this.questionsAnswered,
        completionState: this.completionState
      };
      tincan.setState("bookmarking-data", bookmarking, {
        contentType: "application/json",
        overwriteJSON: false,
        callback: callback
      });
    },
    get: function (callback) {
      var stateResult = tincan.getState("bookmarking-data", {
        callback: function(stateResult){
          var stateResult = stateResult || {};
          if (stateResult.err === null && stateResult.state !== null && stateResult.state.contents !== "") {
            callback(stateResult.state.contents);
          } else {
            callback(null);
          }
        }
      });
    },
    setStartDuration: function (duration) {
      this.startAttemptDuration = duration;
    },
    setPage: function (page) {
      this.currentPage = page;
      return true;
    },
    getPage: function () {
      return this.currentPage;
    },
    incrementPage: function () {
      this.currentPage++;
    },
    decrementPage: function () {
      this.currentPage--;
    },
    setCompletion: function (completion) {
      this.attemptComplete = completion;
      return true;
    },
    getCompletion: function (completion) {
      return this.attemptComplete;
    },
    getAttemptDuration: function () {
      return this.startAttemptDuration + this.getSessionDuration();
    },
    getSessionDuration: function () {
      return Math.abs((new Date()) - this.startTimeStamp);
    },
    setAttemptState: function (state) {
      this.completionState = state;
    },
    getAttemptState: function () {
      return completionState;
    },
    setQuestionsAnswered: function (questionTitle, questionState) {
      this.questionsAnswered[questionTitle] = questionState;
    },
    getQuestionsAnswered: function () {
      return this.questionsAnswered;
    }
  };

  var bookmarkingData = new BookmarkingTracking();

  ////////////////////////////////////
  //////////////////////// ACTIONS //
  //////////////////////////////////

  const doStart = function(){
    const subject = async();

    var statements = [];

    var initializedStatement = {
      verb: {
        id: "http://adlnet.gov/expapi/verbs/initialized",
        display: {
          "en-US": "initialized"
        }
      },
      context: Tincan.getContext(),
      result: {
        duration: "PT0S"
      }
    };

    var attemptedStatement = {
      verb: {
        id: "http://adlnet.gov/expapi/verbs/attempted",
        display: {
          "en-US": "attempted"
        }
      },
      context: Tincan.getContext(),
      result: {
        duration: "PT0S"
      }
    };

    statements.push(initializedStatement);

    //get activity_id bookmark if it exists
    bookmarkingData.get(function(bookmark){

      if (bookmark !== null) {

        $.confirm({
          content: 'Do you want to resume where you left off?',
          confirmButton: 'YES',
          cancelButton: 'NO',
          confirm: function () {
            bookmarkingData.initFromBookmark(bookmark);

            if (!bookmarkingData.getCompletion()) {
              var resumedStatement = {
                verb: {
                  id: "http://adlnet.gov/expapi/verbs/resumed",
                  display: {
                    "en-US": "resumed"
                  }
                },
                context: Tincan.getContext(),
                result: {
                  duration: TinCan.Utils.convertMillisecondsToISO8601Duration(bookmark.attemptDuration)
                }
              };
              statements.push(resumedStatement);
            }
          },
          cancel: function () {
            bookmarkingData.reset();

            //start new attempt
            statements.push(attemptedStatement);
            bookmarkingData.save(function(err, xhr){});
          }
        });

      } else {
        // if there isn't a stored bookmark, start the user at the first page
        bookmarkingData.setPage(0);
        statements.push(attemptedStatement);
      }

      tincan.sendStatements(statements, function(response, data){
        var err = response.err;
        if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
      });

    });

    return subject;
  };

  const storeAttemptState = function({ completionState }){
    const subject = async();

    bookmarkingData.setAttemptState(completionState);
    bookmarkingData.save(function(err, xhr){
      if(err){ subject.error(err).complete(); } else { subject.next(xhr.response).complete(); }
    });

    return subject;
  };

  const doComplete = function(){
    const subject = async();

    var statements = [];

    var completedStatement = {
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: {
          "en-US": "completed"
        }
      },
      context: Tincan.getContext(),
      result: {
        completion: true,
        success: true,
//            "score": {
//              "scaled": 0.9,
//              "raw": 90,
//              "min": 0,
//              "max": 100
//            },
        duration: "PT0S"
      }
    };

    statements.push(completedStatement);

    tincan.sendStatements(statements, function(response, data){
      var err = response.err;
      if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
    });

    return subject;
  };

  //////////////
  // TRACKING //
  //////////////

  const doTracking = function(type, info){
    const subject = async();

    var statements = [];

    var createObject = function (info) {
      if (type === 'access_course') {
        return {
          "id": TC_COURSE_ID,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": info.name},
            "description": {"en-US": info.courseName},
            "type": 'http://adlnet.gov/expapi/activities/course'
          },
          "name": info.name,
          "extensions": {
            "http://scitent.com/xapi/action": {
              "name": {"en-US": "action"},
              "description": {"en-US": "access_course"}
            },
            "http://scitent.com/xapi/name": {"name": {"en-US": "name"}, "description": {"en-US": info.name}},
            "http://scitent.com/xapi/start": {"name": {"en-US": "start"}, "description": {"en-US": info.start}}
          }
        }
      }

      if (type === 'leave_course') {
        return {
          "id": TC_COURSE_ID,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": info.name},
            "description": {"en-US": info.courseName},
            "type": 'http://adlnet.gov/expapi/activities/course'
          },
          "name": info.name,
          "extensions": {
            "http://scitent.com/xapi/action": {"name": {"en-US": "action"}, "description": {"en-US": "leave_course"}},
            "http://scitent.com/xapi/name": {"name": {"en-US": "name"}, "description": {"en-US": info.name}},
            "http://scitent.com/xapi/end": {"name": {"en-US": "end"}, "description": {"en-US": info.end.end}},
            "http://scitent.com/xapi/elapsed": {
              "name": {"en-US": "elapsed"},
              "description": {"en-US": info.end.elapsed}
            }
          }
        }
      }

      if (type === 'access_section') {
        return {
          "id": TC_COURSE_ID,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": info.name},
            "description": {"en-US": info.courseName},
            "type": (info.type === 'exercise' ? 'http://adlnet.gov/expapi/activities/assessment' : 'http://adlnet.gov/expapi/activities/lesson')
          },
          "name": info.name,
          "extensions": {
            "http://scitent.com/xapi/action": {
              "name": {"en-US": "action"},
              "description": {"en-US": "access_section"}
            },
            "http://scitent.com/xapi/name": {"name": {"en-US": "name"}, "description": {"en-US": info.name}},
            "http://scitent.com/xapi/start": {"name": {"en-US": "start"}, "description": {"en-US": info.start}}
          }
        }
      }

      if (type === 'leave_section') {
        return {
          "id": TC_COURSE_ID,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": info.name},
            "description": {"en-US": info.courseName},
            "type": (info.type === 'exercise' ? 'http://adlnet.gov/expapi/activities/assessment' : 'http://adlnet.gov/expapi/activities/lesson')
          },
          "name": info.name,
          "extensions": {
            "http://scitent.com/xapi/action": {
              "name": {"en-US": "action"},
              "description": {"en-US": "leave_section"}
            },
            "http://scitent.com/xapi/name": {"name": {"en-US": "name"}, "description": {"en-US": info.name}},
            "http://scitent.com/xapi/end": {"name": {"en-US": "end"}, "description": {"en-US": info.end.end}},
            "http://scitent.com/xapi/elapsed": {
              "name": {"en-US": "elapsed"},
              "description": {"en-US": info.end.elapsed}
            }
          }
        }
      }

      if (type === 'start_video') {
        return {
          "id": TC_COURSE_ID,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": (info.section + ' - ' + info.src)},
            "description": {"en-US": info.courseName},
            "type": 'http://adlnet.gov/expapi/activities/media'
          },
          "name": info.src,
          "extensions": {
            "http://scitent.com/xapi/action": {"name": {"en-US": "action"}, "description": {"en-US": "start_video"}},
            "http://scitent.com/xapi/src": {"name": {"en-US": "src"}, "description": {"en-US": info.src}},
            "http://scitent.com/xapi/currentTime": {
              "name": {"en-US": "currentTime"},
              "description": {"en-US": info.currentTime}
            },
            "http://scitent.com/xapi/start": {"name": {"en-US": "start"}, "description": {"en-US": info.start}}
          }
        }
      }

      if (type === 'end_video') {
        return {
          "id": TC_COURSE_ID,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": (info.section + ' - ' + info.src)},
            "description": {"en-US": info.courseName},
            "type": 'http://adlnet.gov/expapi/activities/media'
          },
          "name": info.src,
          "extensions": {
            "http://scitent.com/xapi/action": {"name": {"en-US": "action"}, "description": {"en-US": "end_video"}},
            "http://scitent.com/xapi/src": {"name": {"en-US": "src"}, "description": {"en-US": info.src}},
            "http://scitent.com/xapi/currentTime": {
              "name": {"en-US": "currentTime"},
              "description": {"en-US": info.currentTime}
            },
            "http://scitent.com/xapi/end": {"name": {"en-US": "end"}, "description": {"en-US": info.end.end}},
            "http://scitent.com/xapi/elapsed": {
              "name": {"en-US": "elapsed"},
              "description": {"en-US": info.end.elapsed}
            }
          }
        }
      }

      if (type === 'access_help') {
        return {
          "id": TC_COURSE_ID,
          "objectType": "Activity",
          "definition": {
            "name": "help button",
            "description": {"en-US": info.courseName}
          },
          "extensions": {
            "http://scitent.com/xapi/action": {"name": {"en-US": "action"}, "description": {"en-US": "access_help"}}
          }
        }
      }

    };

    var createResult = function (info) {
      if (type === 'access_course') {
        return {};
      }

      if (type === 'leave_course') {
        return {
          "duration": TinCan.Utils.convertMillisecondsToISO8601Duration(info.end.elapsed)
        }
      }

      if (type === 'access_section') {
        return {};
      }

      if (type === 'leave_section') {
        return {
          "duration": TinCan.Utils.convertMillisecondsToISO8601Duration(info.end.elapsed)
        }
      }

      if (type === 'start_video') {
        return {};
      }

      if (type === 'end_video') {
        return {
          "duration": TinCan.Utils.convertMillisecondsToISO8601Duration(info.end.elapsed)
        }
      }

      if (type === 'access_help') {
        return {};
      }

    };

    var interactionStatement = {
      verb: {
        id: "http://adlnet.gov/expapi/activities/interaction",
        display: {
          "en-US": "interacted with"
        }
      },
      result: createResult(info),
      object: createObject(info),
      context: Tincan.getContext()
    };

    statements.push(interactionStatement);

    tincan.sendStatements(statements, function(response, data){
      var err = response.err;
      if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
    });

    return subject;
  };

  const accessCourse = function({ courseName, name }){
    // courseName :: [String] activity being accessed
    // name :: [String] identifier for timer start/stop

    var start = timer.start(slugify(name));
    return doTracking('access_course', {courseName: courseName, name: name, start: start});
  };

  const leaveCourse = function({ courseName, name }){
    // courseName :: [String] activity being accessed
    // name :: [String] identifier for timer start/stop

    var end = timer.stop(slugify(name));
    return doTracking('leave_course', {courseName: courseName, name: name, end: end});
  };

  const accessSection = function({ courseName, name, type }){
    // courseName :: [String] activity being accessed
    // name :: [String] identifier for timer start/stop
    // type :: [String] type of section (ex. exercise, page, ...)

    var start = timer.start(slugify(name));
    return doTracking('access_section', {courseName: courseName, name: name, type: type, start: start});
  };

  const leaveSection = function({ courseName, name, type }){
    // courseName :: [String] activity being accessed
    // name :: [String] identifier for timer start/stop
    // type :: [String] type of section (ex. exercise, page, ...)

    var end = timer.stop(slugify(name));
    return doTracking('leave_section', {courseName: courseName, name: name, type: type, end: end});
  };

  const startVideo = function({ courseName, src, currentTime, section }){
    // courseName :: [String] activity being accessed
    // src :: [Uri] video src
    // currentTime :: [String] current time video is at
    // section :: [String] section identifier

    var start = timer.start(slugify(src));
    return doTracking('start_video', {
      courseName: courseName,
      src: src,
      currentTime: currentTime,
      section: section,
      start: start
    });
  };

  const stopVideo = function({ courseName, src, currentTime, section }){
    // courseName :: [String] activity being accessed
    // src :: [Uri] video src
    // currentTime :: [String] current time video is at
    // section :: [String] section identifier

    var end = timer.stop(slugify(src));
    return doTracking('end_video', {
      courseName: courseName,
      src: src,
      currentTime: currentTime,
      section: section,
      end: end
    });
  };

  const accessHelp = function({ courseName }){
    // courseName :: [String] activity being accessed

    return doTracking('access_help', {courseName: courseName});
  };

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
        "id": TC_COURSE_ID,
        "objectType": "Activity",
        "definition": {
          "name": {"en-US": question},
          "description": {"en-US": TC_COURSE_NAME["en-US"]},
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

    tincan.sendStatements(statements, function(response, data){
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
        "id": TC_COURSE_ID,
        "objectType": "Activity",
        "definition": {
          "name": {"en-US": identifier },
          "description": {"en-US": TC_COURSE_NAME["en-US"]},
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

    tincan.sendStatements(statements, function(response, data){
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

  /////////
  // API //
  /////////

  const local = function(methodString){
    return (params) => most.just({ [methodString]: params }).tap((result) => { console.log('local', result) });
  };

  const api = {
    start: isLocal ? local('☂ doStart') : doStart,
    storeAttemptState: isLocal ? local('☂ storeAttemptState') : storeAttemptState,
    complete: isLocal ? local('☂ doComplete:') : doComplete,
    accessCourse: isLocal ? local('☂ accessCourse:') : accessCourse,
    leaveCourse: isLocal ? local('☂ leaveCourse:') : leaveCourse,
    accessSection: isLocal ? local('☂ accessSection:') : accessSection,
    leaveSection: isLocal ? local('☂ leaveSection:') : leaveSection,
    startVideo: isLocal ? local('☂ startVideo:') : startVideo,
    stopVideo: isLocal ? local('☂ stopVideo:') : stopVideo,
    accessHelp: isLocal ? local('☂ accessHelp:') : accessHelp,
    setPollResponse: isLocal ? local('☂ setPollResponse') : setPollResponse,
    getPollResponseData: isLocal ? local('☂ getPollResponseData') : getPollResponseData,
    getPollResponsesData: isLocal ? local('☂ getPollResponsesData') : getPollResponsesData,
    setActionplanData: isLocal ? local('☂ setActionplanData') : setActionplanData,
    getActionplanData: isLocal ? local('☂ getActionplanData') : getActionplanData
  };

  bus.on('tincan::start', () => { api.start().drain(); });
  bus.on('tincan::storeAttemptState', (params) => { api.storeAttemptState(params).drain() });
  bus.on('tincan::complete', () => { api.complete().drain() });

  bus.emit('tincan::ready');

  return api;

};
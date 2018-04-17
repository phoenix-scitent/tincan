import $ from 'jquery'; // TODO: need to get rid of this after fixing resume progress
import { timer, slugify } from './helpers';
import { bus } from 'partybus';
import R from 'ramda';
import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import getActivity from './activity';
// import bookmarking from './bookmarking';

export default function(activity_config, isLocal, authUrl){

  const Activity = getActivity(activity_config);

  var tincan = new TinCan({
    url: authUrl || window.location.href,
    activity: Activity
  });

  const pushToLRS = (statements, cb) => {
    console.log("Sending Statements to the LRS", statements);
    tincan.sendStatements(statements, cb);
  };


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //// https://github.com/RusticiSoftware/TinCanJS                                                             ////
  //// http://rusticisoftware.github.io/TinCanJS                                                               ////
  //// http://rusticisoftware.github.io/TinCanJS/doc/api/latest/classes/TinCan.LRS.html#method_queryStatements ////
  //// http://developer.pearson.com/blog/retrieving-xapi-statements-lrs                                        ////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  const doStart = function(){
    const subject = async();

    var start = timer.start(Activity.id);
    bus.emit('bookmark::fetch');

    var statements = [];

    var initializedStatement = {
      verb: {
        id: "http://adlnet.gov/expapi/verbs/initialized",
        display: {
          "en-US": "initialized"
        }
      },
      context: Activity.getContext(),
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
      context: Activity.getContext(),
      result: {
        duration: "PT0S"
      }
    };

    statements.push(initializedStatement);
    statements.push(attemptedStatement);

    pushToLRS(statements, function(response, data){
      var err = response.err;
      if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
    });

    return subject;
  };

  const doComplete = function(){
    const subject = async();

    var statements = [];
    var end = timer.stop(Activity.id);

    var completedStatement = {
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: {
          "en-US": "completed"
        }
      },
      context: Activity.getContext(),
      result: {
        completion: true,
        success: true,
//            "score": {
//              "scaled": 0.9,
//              "raw": 90,
//              "min": 0,
//              "max": 100
//            },
        duration: TinCan.Utils.convertMillisecondsToISO8601Duration(end.elapsed)
      }
    };

    statements.push(completedStatement);

    pushToLRS(statements, function(response, data){
      var err = response.err;
      if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
    });

    return subject;
  };

  const doTracking = function(wut){
    const subject = async();

    var statements = [];

    var createObject = function (type, info) {
      if (type === 'access_activity') {
        return {
          "id": Activity.id,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": Activity.name},
            "description": {"en-US": Activity.name},
            "type": 'http://adlnet.gov/expapi/activities/lesson'
          },
          "name": Activity.name,
          "extensions": {
            "http://scitent.com/xapi/action": {
              "name": {"en-US": "action"},
              "description": {"en-US": "access_course"}
            },
            "http://scitent.com/xapi/name": {"name": {"en-US": "name"}, "description": {"en-US": Activity.name}},
            "http://scitent.com/xapi/start": {"name": {"en-US": "start"}, "description": {"en-US": info.start}}
          }
        }
      }

      if (type === 'leave_activity') {
        return {
          "id": Activity.id,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": Activity.name},
            "description": {"en-US": Activity.name},
            "type": 'http://adlnet.gov/expapi/activities/lesson'
          },
          "name": Activity.name,
          "extensions": {
            "http://scitent.com/xapi/action": {"name": {"en-US": "action"}, "description": {"en-US": "leave_activity"}},
            "http://scitent.com/xapi/name": {"name": {"en-US": "name"}, "description": {"en-US": Activity.name}},
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
          "id": Activity.id,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": info.name},
            "description": {"en-US": info.name},
            "type": (info.kind === 'exercise' ? 'http://adlnet.gov/expapi/activities/assessment' : 'http://id.tincanapi.com/activitytype/slide')
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
          "id": Activity.id,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": info.name},
            "description": {"en-US": info.name},
            "type": (info.kind === 'exercise' ? 'http://adlnet.gov/expapi/activities/assessment' : 'http://id.tincanapi.com/activitytype/slide')
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
          "id": Activity.id,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": (info.section + ' - ' + info.name + ' - ' + info.src)},
            "description": {"en-US": info.src},
            "type": 'http://adlnet.gov/expapi/activities/media'
          },
          "name": info.name,
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
          "id": Activity.id,
          "objectType": "Activity",
          "definition": {
            "name": {"en-US": (info.section + ' - ' + info.name + ' - ' + info.src)},
            "description": {"en-US": info.src},
            "type": 'http://adlnet.gov/expapi/activities/media'
          },
          "name": info.name,
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
          "id": Activity.id,
          "objectType": "Activity",
          "definition": {
            "name": "help button",
            "description": {"en-US": Activity.name}
          },
          "extensions": {
            "http://scitent.com/xapi/action": {"name": {"en-US": "action"}, "description": {"en-US": "access_help"}}
          }
        }
      }

    };

    var createResult = function (type, info) {
      if (type === 'leave_course' || type === 'leave_section' || type === 'end_video') {
        return {
          "duration": TinCan.Utils.convertMillisecondsToISO8601Duration(info.end.elapsed)
        }
      }
      return {};
    };

    var interactionStatement = {
      verb: {
        id: "http://adlnet.gov/expapi/activities/interaction",
        display: {
          "en-US": "interacted with"
        }
      },
      result: createResult(wut.type, wut.info),
      object: createObject(wut.type, wut.info),
      context: Activity.getContext()
    };

    statements.push(interactionStatement);

    pushToLRS(statements, function(response, data){
      var err = response.err;
      if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
    });

    return subject;
  };

 
  const locallog = function(methodString){
    return (params) => most.just({ [methodString]: params }).tap((result) => { console.log('local', result) });
  };

  const api = {
    start: isLocal ? locallog('☂ doStart') : doStart,
    complete: isLocal ? locallog('☂ doComplete:') : doComplete,
    track: isLocal ? locallog('☂ doTracking:') : doTracking
  };

  bus.on('tincan::start', () => { api.start().drain(); });
  bus.on('tincan::complete', () => { api.complete().drain() });
  bus.on('tincan::track', doTracking);

  bus.emit('tincan::ready');

  return api;

};
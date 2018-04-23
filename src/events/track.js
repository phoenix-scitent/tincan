import { async } from 'most-subject';
import { bus } from 'partybus';
import { timer, slugify } from '../helpers';

const buildStatement = (end, Activity, info) => {
  return {
    verb: {
      id: "http://adlnet.gov/expapi/activities/interaction",
      display: {
        "en-US": "interacted with"
      }
    },
    result: createResult(end, info),
    object: createObject(end, Activity, info),
    context: Activity.getContext()
  };
}

const createObject = (end, Activity, info) => {
  return {
    "id": Activity.id,
    "objectType": "Activity",
    "definition": {
      "name": {"en-US": info.name},
      "description": {"en-US": info.name},
      "type": 'http://id.tincanapi.com/activitytype/slide'
    },
    "name": info.name,
    "extensions": extension(end, info)
  }
};


const doTrack = function(pushToLRS, Activity, wut){
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

export default doTrack;



const access_help = function(){
  // courseName :: [String] activity being accessed
  bus.emit('tincan::track', { type: 'access_help' })
};

// bus.on('tincan::track::access_activity', access_activity);
// bus.on('tincan::track::leave_activity', leave_activity);
// bus.on('tincan::track::access_section', access_section);
// bus.on('tincan::track::leave_section', leave_section);
// bus.on('tincan::track::start_video', start_video);
// bus.on('tincan::track::stop_video', stop_video);
// bus.on('tincan::track::access_help', access_help);


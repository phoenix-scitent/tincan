import * as most from 'most';
import { async } from 'most-subject';
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

const extension = (end, info) => {
  if (end) {
    return  {
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
  } else {
    return {
      "http://scitent.com/xapi/action": {
        "name": {"en-US": "action"},
        "description": {"en-US": "access_section"}
      },
      "http://scitent.com/xapi/name": {"name": {"en-US": "name"}, "description": {"en-US": info.name}},
      "http://scitent.com/xapi/start": {"name": {"en-US": "start"}, "description": {"en-US": info.start}}
    }
  }
};

const createResult = (end, info) => {
  if (end) {
    return {
      "duration": TinCan.Utils.convertMillisecondsToISO8601Duration(info.end.elapsed)
    }
  }
  return {};
};

const section_tracker = (pushToLRS, Activity, info) => {
  const subject = async();

  let statements = [];



  let interactionStatement = {
    verb: {
      id: "http://adlnet.gov/expapi/activities/interaction",
      display: {
        "en-US": "interacted with"
      }
    },
    result: createResult(end),
    object: createObject(end),
    context: Activity.getContext()
  };

  statements.push(interactionStatement);

  pushToLRS(statements, function(response, data){
    var err = response.err;
    if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
  });

  return subject;


}

export default section_tracker;
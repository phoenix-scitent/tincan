import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import { timer } from '../helpers';

const doStart = function(pushToLRS, Activity){
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

export default doStart;
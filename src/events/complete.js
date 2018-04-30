import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import { timer } from '../helpers';


const doComplete = function(pushToLRS, Activity){
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
//    score: { scaled: 0.9, raw: 90, min: 0, max: 100 },
      duration: TinCan.Utils.convertMillisecondsToISO8601Duration(end.elapsed)
    }
  };

  statements.push(completedStatement);

  console.log('tincan::complete', end, Activity.id, statements);

  pushToLRS(statements, function(response, data){
    var err = response.err;
    if(err){ subject.error(err).complete(); } else { subject.next(data).complete(); }
  });

  return subject;
};


export { doComplete };
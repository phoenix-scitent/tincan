import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import { timer } from '../helpers';

const start_activity_timer = new Date();

const storeSections = function(pushToLRS, Activity, sections){
  const subject = async();
  let now = new Date();

  let section_state = {
    sections: sections,
    attempt_duration: Math.round((now - start_activity_timer) / 1000)
  };

  console.log("Sections state to LRS:", section_state);

  pushToLRS("section-data", section_state, function(err, xhr){
    if(err){ subject.error(err).complete(); } else { subject.next(xhr.response).complete(); }
  });


  return subject;
};

export default storeSections;
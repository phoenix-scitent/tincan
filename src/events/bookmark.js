import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import { timer } from '../helpers';

const start_bookmark_timer = new Date();

const doBookmark = function(pushToLRS, Activity, slug){
  const subject = async();
  let now = new Date();

  let bookmarking = {
    location: slug,
    attempt_duration: Math.round((now - start_bookmark_timer) / 1000)
  };

  console.log("BOOKMARK:", bookmarking);

  pushToLRS("bookmarking-data", bookmarking, function(err, xhr){
    if(err){ subject.error(err).complete(); } else { subject.next(xhr.response).complete(); }
  });


  return subject;
};

export default doBookmark;
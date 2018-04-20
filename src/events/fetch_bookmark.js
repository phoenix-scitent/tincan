import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import { timer } from '../helpers';

const fetch_bookmark = function(xAPI){

  xAPI.getState("bookmarking-data", {
    callback: function(err, result){
      if (err === null && result !== null && result.contents.location !== '') {
        console.log("Bookmarking Data Found", result.contents.location, err);
        bus.emit('tincan::bookmark::found', result.contents.location);
      } else {
        console.log("Bookmarking Data not found", result, err);
      }
    }
  });

};

export default fetch_bookmark;

bus.on('tincan::fetch_bookmark', fetch_bookmark);
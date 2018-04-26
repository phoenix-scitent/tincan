import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import { timer } from '../helpers';

const fetch_sections = function(xAPI){

  xAPI.getState("section-data", {
    callback: function(err, result){
      if (err === null && result !== null && result.contents.sections !== '') {
        console.log("Section Data Found", result.contents.sections, err, result);
        bus.emit('tincan::state::found', result.contents.sections);
      } else {
        console.log("Section Data not found", result, err);
      }
    }
  });

};

export default fetch_sections;

bus.on('tincan::fetch_sections', fetch_sections);
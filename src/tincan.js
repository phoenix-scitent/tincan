import { timer, slugify } from './helpers';
import { bus } from 'partybus';
import * as most from 'most';
import { async } from 'most-subject';
import TinCan from 'tincanjs';
import getActivity from './activity';
import doStart from './events/start';
import doComplete from './events/complete';
import doTrack from './events/track';
import doBookmark from './events/bookmark';
import fetch_bookmark from './events/fetch_bookmark';

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// https://github.com/RusticiSoftware/TinCanJS                                                             ////
//// http://rusticisoftware.github.io/TinCanJS                                                               ////
//// http://rusticisoftware.github.io/TinCanJS/doc/api/latest/classes/TinCan.LRS.html#method_queryStatements ////
//// http://developer.pearson.com/blog/retrieving-xapi-statements-lrs                                        ////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export default (activity_config, send_for_real, authUrl) => {

  const Activity = getActivity(activity_config);
  const xAPI = new TinCan({
    url: authUrl || window.location.href,
    activity: Activity
  });

  const send_statements_to_LRS = (statements, cb) => {
    if (!send_for_real) {
      console.log("LRS Statements... not sending", statements);
    } else {
      console.log("Sending Statements to the LRS", statements);
      xAPI.sendStatements(statements, cb);      
    }
  };
  const setState_to_LRS = (key, data, cb) => {
    if (!send_for_real) {
      console.log("LRS setState... not sending", key, data);
    } else {
      console.log("Sending setState to the LRS", key, data);
      try {
        xAPI.setState(key, data, {
          contentType: "application/json",
          overwriteJSON: false,
          callback: cb
        });              
      } catch(err) {
        console.log("ERROR setState", err);
      }
    }
  };

  bus.on('tincan::start', () => { doStart(send_statements_to_LRS, Activity).drain(); });
  bus.on('tincan::complete', () => { doComplete(send_statements_to_LRS, Activity).drain() });
  bus.on('tincan::track', (wut) => { doTrack(send_statements_to_LRS, Activity, wut).drain(); });
  bus.on('tincan::bookmark', (slug) => { doBookmark(setState_to_LRS, Activity, slug).drain(); });
  bus.emit('tincan::ready');
  bus.emit('tincan::fetch_bookmark', xAPI);

  return xAPI;
};
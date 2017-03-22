import $ from 'jquery';
import { bus } from 'partybus';

//////////////////////////////////////////////////
// activity.js (hucklebuck) progress statements //
//////////////////////////////////////////////////

bus.on('tincan::ready', function(){
  console.log('tincan::ready send: ', 'start, storeAttemptState, complete');
  bus.emit('tincan::start');
  bus.emit('tincan::storeAttemptState', { completionState: {} });
  bus.emit('tincan::complete');
});

// SET global via hucklebuck \\

window.context = {
  user: {
    name: 'User Two',
    email: 'user2@user.com'
  },
  course: 'Test Course',
  activity: 'Activity One',
  section: 'section1'
};

// SET via course in working directory (../activity_config.js) \\

var config = {
  activity_name: 'Quality Course',
  slug: 'quality_course',
  full_url: 'https://governance.netlify.com/quality_course',
  distpath: '../../quality_course',
  author: 'Scitent http://scitent.com',
  first_section: 'quality_course_introduction',
  theme: 'clean-blog-3.3.7'
};

var isLocal = (window.location.protocol === 'file:') || (window.location.hostname === 'localhost') || (window.location.hostname.includes('surge.sh'));

// call `tincan` function via course (src/js/index.js), but inport via hucklebuck (src/hucklebuck)

import tincanInit from './src/tincan';

///////////////////
// test real use //
///////////////////

//var tincan = tincanInit(config, isLocal);

//////////////////////////////
// test demo/production use //
//////////////////////////////

var email = 'xftohnson';
var firstName = 'Gim';
var lastName = 'Tohnson';
var activity = 'http%3A%2F%2Fcareerdevelopment.aaas.org%2Fcourse3';

var authUrl = `https://17515-presscdn-0-77-pagely.netdna-ssl.com/wp-content/uploads/grassblade/6896-course-3/index.html?actor=%7B%22mbox%22%3A%22mailto%3A${email}%40scitent.us%22%2C%22name%22%3A%22${firstName}%20${lastName}%22%2C%22objectType%22%3A%22Agent%22%7D&auth=Basic%20MzctMzRiOTNjYWI2MTc0MmUwOmRjOThhYjFjN2U3NDRmZTE4NGRkYzU4N2U%3D&endpoint=https%3A%2F%2Flrs.scitent.us%2FxAPI%2F&registration=&activity_id=${activity}`;
var tincan = tincanInit(config, false, authUrl);

///////////////
// EXAMPLES: //
///////////////

$(document).on('click', '#start', function(){
  tincan.start().tap(console.log).drain();
});

$(document).on('click', '#complete', function(){
  tincan.complete().tap(console.log).drain();
});

$(document).on('click', '#access-section', function(){
  var context = { courseName: config.activity_name, name: config.activity_name, type: 'access_section' };
  tincan.accessSection(context).tap(console.log).drain();
});

$(document).on('click', '#leave-section', function(){
  var context = { courseName: config.activity_name, name: config.activity_name, type: 'leave_section' };
  tincan.leaveSection(context).tap(console.log).drain();
});

$(document).on('click', '#update-progress', function(){
  var newState = {};
  tincan.storeAttemptState({ completionState: newState }).tap(console.log).drain();
});

$(document).on('click', '#poll-response', function(){
  var response = { identifier: 'Poll 1', type: 'radio', question: 'Who is there?', response: 'Me' };
  tincan.setPollResponse(response).tap(console.log).drain();
});

$(document).on('click', '#get-poll-response', function(){
  var identifier = 'Poll 1';
  tincan.getPollResponseData({ identifier }).tap(console.log).drain();
});

$(document).on('click', '#get-poll-responses', function(){
  var identifier = 'Poll 1';
  tincan.getPollResponsesData({ identifier }).tap(console.log).drain();
});

$(document).on('click', '#actionplan-update', function(){
  var actionplan = {
    'ap-1': {
      'enter-ten-items': {
        text: 'Enter 10 items...',
        context: ['Section 1', 1489421176326],
        value: '1. hi, 2. ok, 3. bye, ....'
      },
      'what-are-your-thoughts': {
        text: 'What are your thoughts?',
        context: ['Section 2', 1589421176327],
        value: 'I have a few...'
      }
    }
  };

  tincan.setActionplanData({ takeaway: actionplan }).tap(console.log).drain();
});

$(document).on('click', '#get-actionplan', function(){
  var actionplanId = 'ap-1';
  tincan.getActionplanData({ identifier: actionplanId }).tap(console.log).drain();
});
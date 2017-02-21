import $ from 'jquery';
import { bus } from 'partybus';

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

import tincan from './src/tincan';

///////////////////
// test real use //
///////////////////

tincan(config, isLocal);

//////////////////////////////
// test demo/production use //
//////////////////////////////

//var authUrl = 'https://17515-presscdn-0-77-pagely.netdna-ssl.com/wp-content/uploads/grassblade/6896-course-3/index.html?actor=%7B%22mbox%22%3A%22mailto%3Atjohnson%40scitent.us%22%2C%22name%22%3A%22Tim%20Johnson%22%2C%22objectType%22%3A%22Agent%22%7D&auth=Basic%20MzctMzRiOTNjYWI2MTc0MmUwOmRjOThhYjFjN2U3NDRmZTE4NGRkYzU4N2U%3D&endpoint=https%3A%2F%2Flrs.scitent.us%2FxAPI%2F&registration=&activity_id=http%3A%2F%2Fcareerdevelopment.aaas.org%2Fcourse3';
//tincan(config, false, authUrl);

// EXAMPLES:

$(document).on('click', '#start', function(){
  bus.emit('tincan::start');
});

$(document).on('click', '#complete', function(){
  bus.emit('tincan::complete');
});

$(document).on('click', '#access-section', function(){
  bus.emit('tincan::access_section', { courseName: config.activity_name, name: config.activity_name, type: 'access_section' });
});

bus.on('click', '#leave-section', function(){
  bus.emit('tincan::leave_section', { courseName: config.activity_name, name: config.activity_name, type: 'leave_section' });
});
import { timer, slugify } from './helpers';
import { bus } from 'partybus';


const access_activity = function({ name }){
  // courseName :: [String] activity being accessed
  // name :: [String] identifier for timer start/stop

  var start = timer.start(slugify(name));
  bus.emit('tincan::track', { 
    type: 'access_activity', 
    name: name, 
    start: start
  });
};

const leave_activity = function({ name }){
  // courseName :: [String] activity being accessed
  // name :: [String] identifier for timer start/stop

  var end = timer.stop(slugify(name));
  bus.emit('tincan::track', { 
    type: 'leave_activity', 
    name: name, 
    end: end
  });
};

const access_section = function({ name, kind }){
  // courseName :: [String] activity being accessed
  // name :: [String] identifier for timer start/stop
  // kind :: [String] type of section (ex. exercise, page, ...)

  var start = timer.start(slugify(name));
  bus.emit('tincan::track', { 
    type: 'access_section', 
    name: name, 
    kind: kind, 
    start: start
  });
};

const leave_section = function({ name, kind }){
  // courseName :: [String] activity being accessed
  // name :: [String] identifier for timer start/stop
  // kind :: [String] type of section (ex. exercise, page, ...)

  var end = timer.stop(slugify(name));
  bus.emit('tincan::track', { 
    type: 'leave_section', 
    name: name, 
    kind: kind, 
    end: end
  });
};

const start_video = function({ name, src, currentTime, section }){
  // courseName :: [String] activity being accessed
  // src :: [Uri] video src
  // currentTime :: [String] current time video is at
  // section :: [String] section identifier

  var start = timer.start(slugify(src));
  bus.emit('tincan::track', { 
    type: 'start_video',
    name: name,
    src: src,
    currentTime: currentTime,
    section: section,
    start: start
  });
};

const stop_video = function({ name, src, currentTime, section }){
  // courseName :: [String] activity being accessed
  // src :: [Uri] video src
  // currentTime :: [String] current time video is at
  // section :: [String] section identifier

  var end = timer.stop(slugify(src));
  bus.emit('tincan::track', {
    type: 'end_video',
    name: name,
    src: src,
    currentTime: currentTime,
    section: section,
    end: end
  });
};

const access_help = function(){
  // courseName :: [String] activity being accessed
  bus.emit('tincan::track', { type: 'access_help' })
};

bus.on('tincan::track::access_activity', access_activity);
bus.on('tincan::track::leave_activity', leave_activity);
bus.on('tincan::track::access_section', access_section);
bus.on('tincan::track::leave_section', leave_section);
bus.on('tincan::track::start_video', start_video);
bus.on('tincan::track::stop_video', stop_video);
bus.on('tincan::track::access_help', access_help);


import { bus } from 'partybus';
import R from 'ramda';
import * as most from 'most';
import { async } from 'most-subject';


var BookmarkingTracking = function () {
  this.questionsAnswered = {};
  this.completionState = [];
  this.currentPage = 0;
  this.startTimeStamp = new Date();
  this.startAttemptDuration = 0;
  this.attemptComplete = false;
};

BookmarkingTracking.prototype = {
  initFromBookmark: function (bookmark) {
    // this.setPage(parseInt(bookmark.location, 10));
    // this.setStartDuration(bookmark.attemptDuration);
    // this.getCompletion(bookmark.attemptComplete);
    if (bookmark && bookmark.completionState) {
      this.completionState = bookmark.completionState;
      bus.emit('resumeProgress', this.completionState);
    }
  },
  reset: function () {
    this.setPage(0);
    this.setStartDuration(0);
    this.setCompletion(false);
  },
  save: function (callback) {
    var bookmarking = {
      location: this.currentPage,
      attemptDuration: this.getAttemptDuration(),
      attemptComplete: this.attemptComplete,
      questionsAnswered: this.questionsAnswered,
      completionState: this.completionState
    };
    tincan.setState("bookmarking-data", bookmarking, {
      contentType: "application/json",
      overwriteJSON: false,
      callback: callback
    });
  },
  get: function (callback) {
    var stateResult = tincan.getState("bookmarking-data", {
      callback: function(stateResult){
        var stateResult = stateResult || {};
        if (stateResult.err === null && stateResult.state !== null && stateResult.state.contents !== "") {
          callback(stateResult.state.contents);
        } else {
          callback(null);
        }
      }
    });
  },
  setStartDuration: function (duration) {
    this.startAttemptDuration = duration;
  },
  setPage: function (page) {
    this.currentPage = page;
    return true;
  },
  getPage: function () {
    return this.currentPage;
  },
  incrementPage: function () {
    this.currentPage++;
  },
  decrementPage: function () {
    this.currentPage--;
  },
  setCompletion: function (completion) {
    this.attemptComplete = completion;
    return true;
  },
  getCompletion: function (completion) {
    return this.attemptComplete;
  },
  getAttemptDuration: function () {
    return this.startAttemptDuration + this.getSessionDuration();
  },
  getSessionDuration: function () {
    return Math.abs((new Date()) - this.startTimeStamp);
  },
  setAttemptState: function (state) {
    this.completionState = state;
  },
  getAttemptState: function () {
    return completionState;
  },
  setQuestionsAnswered: function (questionTitle, questionState) {
    this.questionsAnswered[questionTitle] = questionState;
  },
  getQuestionsAnswered: function () {
    return this.questionsAnswered;
  }
};

var bookmarking = new BookmarkingTracking();

const storeAttemptState = ({ completionState }) => {
  const subject = async();

  bookmarking.setAttemptState(completionState);
  bookmarking.save(function(err, xhr){
    if(err){ subject.error(err).complete(); } else { subject.next(xhr.response).complete(); }
  });

  return subject;
};

bus.on('tincan::storeAttemptState', (params) => { api.storeAttemptState(params).drain() });


export default bookmarking;
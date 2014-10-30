// Generated by CoffeeScript 1.7.1
var ContactLog, PCLog, americano, async;

americano = require('americano-cozy');

async = require('async');

ContactLog = require('./contact_log');

PCLog = americano.getModel('PhoneCommunicationLog', {
  origin: {
    type: String,
    "default": 'cozy-contacts'
  },
  direction: String,
  timestamp: String,
  correspondantNumber: String,
  chipCount: Number,
  chipType: String,
  type: String,
  snippet: String
});

PCLog.byNumber = function(number, callback) {
  var options;
  options = {
    key: PCLog.normalizeNumber(number)
  };
  return PCLog.request('byNumber', options, callback);
};

PCLog.mergeToContactLogRT = function(event, id) {
  return PCLog.find(id, function(err, log) {
    var converted;
    if (err || !(log != null ? log.snippet : void 0)) {
      return console.log("[Dup] could not found doc id=", id, err, log);
    }
    converted = PCLog.toContactLog(log);
    return ContactLog.merge([converted], function(err) {
      if (err) {
        return console.log(err);
      }
    });
  });
};

PCLog.mergeToContactLog = function(callback) {
  return PCLog.request('bySnippet', function(err, logs) {
    var converted;
    if (err) {
      return callback(err);
    }
    converted = logs.map(PCLog.toContactLog);
    return ContactLog.merge(converted, callback);
  });
};

PCLog.toContactLog = function(calllog) {
  var out;
  out = {
    timestamp: calllog.timestamp,
    direction: calllog.direction,
    remote: {
      tel: calllog.correspondantNumber
    },
    type: calllog.type,
    snippet: calllog.snippet
  };
  if (out.type === 'VOICE') {
    out.content = {
      duration: calllog.chipCount
    };
  }
  return out;
};

module.exports = PCLog;

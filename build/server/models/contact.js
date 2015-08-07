// Generated by CoffeeScript 1.9.3
var Contact, DataPoint, VCardParser, async, cozydb, fs, log,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

cozydb = require('cozydb');

async = require('async');

VCardParser = require('cozy-vcard');

fs = require('fs');

log = require('printit')({
  prefix: 'Contact Model'
});

DataPoint = (function(superClass) {
  extend(DataPoint, superClass);

  function DataPoint() {
    return DataPoint.__super__.constructor.apply(this, arguments);
  }

  DataPoint.schema = {
    name: String,
    value: cozydb.NoSchema,
    type: String
  };

  return DataPoint;

})(cozydb.Model);

module.exports = Contact = (function(superClass) {
  extend(Contact, superClass);

  function Contact() {
    return Contact.__super__.constructor.apply(this, arguments);
  }

  Contact.docType = 'contact';

  Contact.schema = {
    id: String,
    fn: String,
    n: String,
    org: String,
    title: String,
    department: String,
    bday: String,
    nickname: String,
    url: String,
    revision: Date,
    datapoints: [DataPoint],
    note: String,
    tags: [String],
    _attachments: Object
  };

  Contact.cast = function(attributes, target) {
    target = Contact.__super__.constructor.cast.call(this, attributes, target);
    if ((target.n == null) || target.n === '') {
      if (target.fn == null) {
        target.fn = '';
      }
      if (target instanceof Contact) {
        target.n = target.getComputedN();
      } else {
        target.n = VCardParser.fnToN(target.fn).join(';');
      }
    } else if ((target.fn == null) || target.fn === '') {
      if (target instanceof Contact) {
        target.fn = target.getComputedFN();
      } else {
        target.fn = VCardParser.nToFN(target.n.split(';'));
      }
    }
    return target;
  };

  return Contact;

})(cozydb.CozyModel);

Contact.prototype.updateAttributes = function(changes, callback) {
  changes.revision = new Date().toISOString();
  return Contact.__super__.updateAttributes.apply(this, arguments);
};

Contact.prototype.save = function(callback) {
  changes.revision = new Date().toISOString();
  return Contact.__super__.save.apply(this, arguments);
};

Contact.prototype.savePicture = function(path, callback) {
  var data;
  data = {
    name: 'picture'
  };
  log.debug(path);
  return this.attachFile(path, data, function(err) {
    if (err) {
      return callback(err);
    } else {
      return fs.unlink(path, function(err) {
        if (err) {
          log.error("failed to purge " + file.path);
        }
        return callback();
      });
    }
  });
};

Contact.prototype.getComputedFN = function() {
  return VCardParser.nToFN(this.n.split(';'));
};

Contact.prototype.getComputedN = function() {
  return VCardParser.fnToN(this.fn).join(';');
};

Contact.prototype.toVCF = function(callback) {
  var laterStream, ref;
  if (((ref = this._attachments) != null ? ref.picture : void 0) != null) {
    laterStream = this.getFile('picture', function() {});
    return laterStream.on('ready', (function(_this) {
      return function(stream) {
        var buffers;
        buffers = [];
        stream.on('data', buffers.push.bind(buffers));
        return stream.on('end', function() {
          var picture;
          picture = Buffer.concat(buffers).toString('base64');
          return callback(null, VCardParser.toVCF(_this, picture));
        });
      };
    })(this));
  } else {
    return callback(null, VCardParser.toVCF(this));
  }
};

Contact.prototype.migrateAdr = function(callback) {
  var datapoints, hasMigrate;
  hasMigrate = false;
  datapoints = (typeof this !== "undefined" && this !== null ? this.datapoints : void 0) || [];
  if (datapoints != null) {
    datapoints.forEach(function(dp) {
      if (dp.name === 'adr') {
        if (typeof dp.value === 'string' || dp.value instanceof String) {
          dp.value = VCardParser.adrStringToArray(dp.value);
          return hasMigrate = true;
        }
      }
    });
  }
  if (hasMigrate) {
    return this.updateAttributes({
      datapoints: datapoints
    }, callback);
  } else {
    return setImmediate(callback);
  }
};

Contact.migrateAll = function(callback) {
  return Contact.all({}, function(err, contacts) {
    if (err != null) {
      console.log(err);
      return callback();
    } else {
      return async.eachLimit(contacts, 10, function(contact, done) {
        return contact.migrateAdr(done);
      }, callback);
    }
  });
};

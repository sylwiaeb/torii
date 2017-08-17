import UUIDGenerator from 'torii/lib/uuid-generator';
import PopupIdSerializer from 'torii/lib/popup-id-serializer';
import ParseQueryString from 'torii/lib/parse-query-string';
export var CURRENT_REQUEST_KEY = '__torii_request';

var on = Ember.on;

function parseMessage(url, keys){
  var parser = ParseQueryString.create({url: url, keys: keys});
  var data = parser.parse();
  return data;
}

var ServicesMixin = Ember.Mixin.create({

  toriiStorage: Ember.inject.service(),

  init: function(){
    this._super.apply(this, arguments);
    this.remoteIdGenerator = this.remoteIdGenerator || UUIDGenerator;
  },

  // Open a remote window. Returns a promise that resolves or rejects
  // accoring to if the iframe is redirected with arguments in the URL.
  //
  // For example, an OAuth2 request:
  //
  // iframe.open('http://some-oauth.com', ['code']).then(function(data){
  //   // resolves with data.code, as from http://app.com?code=13124
  // });
  //
  // Services that use this mixin should implement openRemote
  //
  open: function(url, keys, options){
    var service   = this,
        lastRemote = this.remote,
        toriiStorage = this.get('toriiStorage');

    return new Ember.RSVP.Promise(function(resolve, reject){
      if (lastRemote) {
        service.close();
      }

      var remoteId = service.remoteIdGenerator.generate();

      var pendingRequestKey = PopupIdSerializer.serialize(remoteId);
      toriiStorage.setItem(CURRENT_REQUEST_KEY, pendingRequestKey);


      service.openRemote(url, pendingRequestKey, options);
      service.schedulePolling();

      var onbeforeunload = window.onbeforeunload;
      window.onbeforeunload = function() {
        if (typeof onbeforeunload === 'function') {
          onbeforeunload();
        }
        service.close();
      };

      if (service.remote && !service.remote.closed) {
        service.remote.focus();
      } else {
        reject(new Error(
          'remote could not open or was closed'));
        return;
      }

      service.one('didClose', function(){
        var pendingRequestKey = toriiStorage.getItem(CURRENT_REQUEST_KEY);
        if (pendingRequestKey) {
          toriiStorage.removeItem(pendingRequestKey);
          toriiStorage.removeItem(CURRENT_REQUEST_KEY);
        }
        // If we don't receive a message before the timeout, we fail. Normally,
        // the message will be received and the window will close immediately.
        service.timeout = Ember.run.later(service, function() {
          reject(new Error("remote was closed, authorization was denied, or a authentication message otherwise not received before the window closed."));
        }, 100);
      });

      service.storageUpdatedHandler = function(storage) {
        const currentKey = storage[CURRENT_REQUEST_KEY];
        const newValue = storage[currentKey];

        if ( newValue ) {
          const data = parseMessage(newValue, keys);
          toriiStorage.removeItem(currentKey);
          toriiStorage.removeItem(CURRENT_REQUEST_KEY);
          Ember.run(function() {
            resolve(data);
          });
        }
      };

      toriiStorage.on('storageUpdated', service.storageUpdatedHandler);


    }).finally(function(){
      // didClose will reject this same promise, but it has already resolved.
      service.close();

      toriiStorage.off('storageUpdated', service.storageUpdatedHandler);
    });
  },

  close: function(){
    if (this.remote) {
      this.closeRemote();
      this.remote = null;
      this.trigger('didClose');
    }
    this.cleanUp();
  },

  cleanUp: function(){
    this.clearTimeout();
  },


  schedulePolling: function(){
    this.polling = Ember.run.later(this, function(){
      this.pollRemote();
      this.schedulePolling();
    }, 35);
  },

  // Clear the timeout, in case it hasn't fired.
  clearTimeout: function(){
    Ember.run.cancel(this.timeout);
    this.timeout = null;
  },

  stopPolling: on('didClose', function(){
    Ember.run.cancel(this.polling);
  })



});

export default ServicesMixin;

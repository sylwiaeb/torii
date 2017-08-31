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

  init() {
    this._super.apply(this, arguments);
    this.remoteIdGenerator = this.remoteIdGenerator || UUIDGenerator;
    this.on('didClose', this.cleanUp);
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
  open(url, keys, options) {

    return new Ember.RSVP.Promise((resolve, reject) => {
      if (this.remote) {
        this.close();
      }

      const remoteId = this.remoteIdGenerator.generate();
      const pendingRequestKey = PopupIdSerializer.serialize(remoteId);

      this.openRemote(url, pendingRequestKey, options);

      window.addEventListener('beforeunload', () => {
        Ember.run( () => {
          this.close();
        });
      });

      const remote = this.remote;
      if (remote && !remote.closed) {
        remote.focus();
        this.schedulePolling();
        this.scheduleTimeout();
      } else {
        reject(new Error(
          'remote could not open or was closed'));
        return;
      }

      this.requestChangeListener = (e) => {
        if ( e.origin !== window.location.origin ) { return; }
        const url = e.data.url;
        if ( url ) {
          const data = parseMessage(url, keys);
          Ember.run(() => {
            resolve(data);
          });
        }
      };

      window.addEventListener('message', this.requestChangeListener);

    }).finally(() => {
      this.close();
    });
  },

  close() {
    if ( this.remote ) {
      this.closeRemote();
      this.trigger('didClose');
    }
  },

  cleanUp() {
    Ember.run(() => {
      this.remote = null;
      window.removeEventListener('message', this.requestChangeListener);
      this.cancelTimeout();
    });
  },


  schedulePolling() {
    const remote = this.remote;
    const service = this;
    if ( remote ) {
      if ( remote.closed ) {
        this.trigger('didClose');
      } else {
        Ember.run.later(service, function() {
          this.schedulePolling();
        }, 500);
      }
    }
  },

  scheduleTimeout() {
    const service = this;
    this.timeout = Ember.run.later(service, function() {
      //Not rejecting authentication since user may have logged in using another tab's popup.
      //Rejecting would log the user out.
      Ember.Logger.warn('Timeout. Closing Google Authentication window.');
      this.close();
    }, 300000);
  },

  cancelTimeout() {
    let  timeout = this.timeout;
    if ( timeout ) {
      Ember.run.cancel( timeout );
      timeout =null;
    }
  }

});

export default ServicesMixin;

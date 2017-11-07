import Ember from 'ember';

export default Ember.Mixin.create({

  beforeModel() {
    this.handleRedirect(...arguments);
    this._super(...arguments);
  },

  /**
   * Setup that was done in 'torii/addon/redirect-handler' and
   * 'torii/app/initializers/initialize-torii-callback' is now handled here
   * to not use localStorage
   */
  handleRedirect(transition) {
    const allowedRedirectPaths = Ember.getOwner(this).resolveRegistration('config:environment').torii.allowedRedirectPaths;
    if ( allowedRedirectPaths.includes(window.location.pathname.replace(/\/$/, ""))) {
      transition.abort();
      //load OAuth provider url
      //doing the redirect in the popup so IE 11 window messaging will work
      const authUrl = Ember.get(transition, 'queryParams.authUrl');
      if ( authUrl ) {
        window.location.assign(decodeURIComponent(authUrl));
        return;
      }
      //send OAuth provider result to opener
      let opener = window.opener;
      let location = window.location;
      if ( opener ) {
        window.setInterval(function(){
          opener.postMessage({ url: location.toString() }, location.origin);
        },250);
      }
    }

  },
});

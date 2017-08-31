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
      let opener = window.opener;
      let location = window.location;
      if ( opener ) {
        opener.postMessage({ url: location.toString() }, location.origin);
      }
    }

  },
});

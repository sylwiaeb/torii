import Ember from 'ember';
import { CURRENT_REQUEST_KEY } from "./ui-service-mixin";

export default Ember.Mixin.create({
  toriiStorage: Ember.inject.service(),

  beforeModel() {
    this.handleRedirect(...arguments);
    this._super(...arguments);
  },

  /**
   * Setup that was done in 'torii/addon/redirect-handler' and
   * 'torii/app/initializers/initialize-torii-callback' is now handled here
   * for Adapative Storage support
   */
  handleRedirect(transition) {
    const toriiStorage = this.get('toriiStorage');
    const pendingRequestKey = toriiStorage.getItem(CURRENT_REQUEST_KEY);
    const allowedRedirectPaths = Ember.getOwner(this).resolveRegistration('config:environment').torii.allowedRedirectPaths;
    if ( pendingRequestKey &&
      allowedRedirectPaths.includes(window.location.pathname.replace(/\/$/, "")))
    {
      toriiStorage.setItem(pendingRequestKey, window.location.toString());
      transition.abort();
      window.close();
    }

  },
});

import Ember from 'ember';

/**
 * Default storage used by torii-storage service.
 * This default storage uses window.localStorage.
 */

export default Ember.Service.extend(Ember.Evented, {

  setItem(key, value) {
    window.localStorage.setItem(key, value);
  },

  removeItem(key) {
    window.localStorage.removeItem(key);
  },

  getItem(key) {
    return window.localStorage.getItem(key);
  },

  init() {
    Ember.$(window).on('storage', (e) => {
      this.trigger('storageUpdated', e.originalEvent.storageArea);
    });
  }

});

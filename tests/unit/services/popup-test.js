import Popup from 'torii/services/popup';
import ToriiStorage from 'torii/services/local-storage';
import PopupIdSerializer from 'torii/lib/popup-id-serializer';
import { CURRENT_REQUEST_KEY } from "torii/mixins/ui-service-mixin";
import QUnit from 'qunit';

let { module, test } = QUnit;

var popup;
var originalWindowOpen = window.open;

var buildMockWindow = function(windowName){
  windowName = windowName || "";
  return {
    name: windowName,
    focus() {},
    close() {}
  };
};

var buildPopupIdGenerator = function(popupId){
  return {
    generate: function(){
      return popupId;
    }
  };
};

var buildMockStorageEvent = function(popupId, redirectUrl){
  const key = PopupIdSerializer.serialize(popupId);
  const newValue = redirectUrl;
  return Ember.$.Event('storage', {
    originalEvent: {
      key,
      newValue,
      storageArea: {
        [key]: newValue,
        [CURRENT_REQUEST_KEY]: key
      }
    }
  });
};

module("Popup - Unit", {
  setup: function(){
    Ember.$(window).off('storage');
    localStorage.removeItem(CURRENT_REQUEST_KEY);
    popup = Popup.create({toriiStorage: ToriiStorage.create()});
    Ember.$(window).on('storage', (e) => {
      popup.get('toriiStorage').trigger('storageUpdated', e.originalEvent.storageArea);
    });
  },
  teardown: function(){
    Ember.$(window).off('storage');
    localStorage.removeItem(CURRENT_REQUEST_KEY);
    window.open = originalWindowOpen;
    Ember.run(popup, 'destroy');
  }
});

test("open resolves based on popup window", function(assert){
  let done = assert.async();
  assert.expect(8);
  var expectedUrl = 'http://authServer';
  var redirectUrl = "http://localserver?code=fr";
  var popupId = '09123-asdf';
  var mockWindow = null;

  Ember.$(window).off('storage');
  popup = Popup.create({toriiStorage: ToriiStorage.create(),remoteIdGenerator: buildPopupIdGenerator(popupId)});

  window.open = function(url, name){
    assert.ok(true, 'calls window.open');
    assert.equal(url, expectedUrl, 'opens with expected url');

    assert.equal(PopupIdSerializer.serialize(popupId),
        popup.get('toriiStorage').getItem(CURRENT_REQUEST_KEY),
        "adds the key to the current request item");

    mockWindow = buildMockWindow(name);
    return mockWindow;
  };

  Ember.run(function(){
    Ember.$(window).on('storage', (e) => {
      popup.get('toriiStorage').trigger('storageUpdated', e.originalEvent.storageArea);
    });
    popup.open(expectedUrl, ['code']).then(function(data){
      assert.ok(true, 'resolves promise');
      assert.equal(popupId, PopupIdSerializer.deserialize(mockWindow.name), "sets the window's name properly");
      assert.deepEqual(data, {code: 'fr'}, 'resolves with expected data');
      assert.equal(null,
          popup.get('toriiStorage').getItem(CURRENT_REQUEST_KEY),
          "removes the key from local storage");
      assert.equal(null,
          popup.get('toriiStorage').getItem(PopupIdSerializer.serialize(popupId)),
          "removes the key from local storage");
    }, function(){
      assert.ok(false, 'rejected the open promise');
    }).finally(done);
  });

  popup.get('toriiStorage').setItem(PopupIdSerializer.serialize(popupId), redirectUrl);

  // Need to manually trigger storage event, since it doesn't fire in the current window
  Ember.$(window).trigger(buildMockStorageEvent(popupId, redirectUrl));
});

test("open rejects when window does not open", function(assert){
  let done = assert.async();
  var closedWindow = buildMockWindow();
  closedWindow.closed = true;
  window.open = function(){
    assert.ok(true, 'calls window.open');
    return closedWindow;
  };

  Ember.run(function(){
    popup.open('http://some-url.com', ['code']).then(function(){
      assert.ok(false, 'resolves promise');
    }, function(){
      assert.ok(true, 'rejected the open promise');
    }).finally(done);
  });
});

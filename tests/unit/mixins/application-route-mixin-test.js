import Ember from 'ember';
import ApplicationRouteMixinMixin from 'torii/mixins/application-route-mixin';
import { module, test } from 'qunit';

module('Unit | Mixin | application route mixin');


test('it works', function(assert) {
  var ApplicationRouteMixinObject = Ember.Object.extend(ApplicationRouteMixinMixin);
  var subject = ApplicationRouteMixinObject.create();
  assert.ok(subject);
});

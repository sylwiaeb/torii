import { moduleFor, test } from 'ember-qunit';

moduleFor('service:local-storage', 'Unit | Service | local storage', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

test('it exists', function(assert) {
  var service = this.subject();
  assert.ok(service);
});

import test from 'tape'
import State from '../State.js'

const fixtures = {
  state: () => new State({ UNKNOWN: { id: 0 }, OK: { id: 1 }, NOT_OK: { id: 2 } })
}

function isObject (candidate) {
  return candidate && candidate.constructor === Object
}

function isEmptyObject (candidate) {
  return isObject(candidate) && Object.keys(candidate).length === 0
}

test('general', t => {
  const state = fixtures.state()

  t.assert(state.UNKNOWN.id === 0 && state.OK.id === 1 && state.NOT_OK.id === 2, 'State is created.')
  t.assert(state.is(state.UNKNOWN) && !state.is(state.OK) && !state.is(state.NOT_OK), 'Default state is correctly set.')

  state.set(state.OK)
  t.assert(state.is(state.OK) && !state.is(state.UNKNOWN && !state.is(state.NOT_OK)), 'State is as expected after state change without context update.')
  t.assert(isObject(state.OK) && Object.keys(state.OK).length === 1 && state.OK.id === 1, 'Context is same as before after state change without context update.')

  const ERROR_MESSAGE = 'This is just not ok.'
  state.set(state.NOT_OK, { error: ERROR_MESSAGE })
  t.assert(state.is(state.NOT_OK) && !state.is(state.UNKNOWN) && !state.is(state.OK), 'State is as expected after state change with context update.')
  t.assert(isObject(state.NOT_OK) && Object.keys(state.NOT_OK).length === 1 && state.NOT_OK.error === ERROR_MESSAGE, 'Context is as expected after state change with context update.')

  t.end()
})

test('guards', t => {
  const state = fixtures.state()

  t.throws(() => {
    state.DOES_NOT_EXIST
  }, 'Attempting to access non-existent state throws.')

  t.throws(() => {
    state.DOES_NOT_EXIST = {}
  }, 'Attempting to add a state after initialisation throws.')

  t.throws(() => {
    state.OK = { contextUpdated: true }
  }, 'Attempting to directly update the context of an existing state throws.')

  t.end()
})

test('subscriptions', t => {
  const state = fixtures.state()

  const listener1 = {
    lastTarget: null,
    invocationCount: 0,
    callback: function (target) {
      this.lastTarget = target
      this.invocationCount++
    }
  }

  const listener2 = {
    lastTarget: null,
    invocationCount: 0,
    callback: function (target) {
      this.lastTarget = target
      this.invocationCount++
    }
  }

  t.assert(Array.isArray(state.subscribers) && state.subscribers.length === 0, 'Initial subscribers list is empty.')

  const unsubscribe1 = state.subscribe(listener1.callback.bind(listener1))

  // (Note that, as per the Svelte spec, adding a subscriber immediately calls the callback on it.)
  t.strictEquals(state.subscribers.length, 1, 'First subscriber is added.')
  t.strictEquals(typeof unsubscribe1, 'function', 'Subscribe method returns function.')
  t.ok(listener1.lastTarget === state.internal, 'Listener 1 callback is invoked with correct target.')
  t.ok(listener1.invocationCount === 1, 'Listener 1 callback is called the right number of times.')

  state.set(state.OK)

  t.ok(listener1.invocationCount === 2, 'Listener 1 callback is called the right number of times (2).')

  const unsubscribe2 = state.subscribe(listener2.callback.bind(listener2))

  t.strictEquals(state.subscribers.length, 2, 'Second subscriber is added.')

  t.ok(listener2.lastTarget === state.internal, 'Listener 2 callback is invoked with correct target.')
  t.strictEquals(listener1.invocationCount, 2, 'Listener 1 callback is called the right number of times.')
  t.strictEquals(listener2.invocationCount, 1, 'Listener 2 callback is called the right number of times.')

  state.set(state.NOT_OK)

  t.strictEquals(listener1.invocationCount, 3, 'Listener 1 callback is called the right number of times.')
  t.strictEquals(listener2.invocationCount, 2, 'Listener 2 callback is called the right number of times.')

  unsubscribe1()

  t.strictEquals(state.subscribers.length, 1, 'Subscriber is removed (1).')

  state.set(state.OK)

  t.strictEquals(listener1.invocationCount, 3, 'Listener 1 callback is not called after unsubscribe.')
  t.strictEquals(listener2.invocationCount, 3, 'Listener 2 callback is called the right number of times.')

  unsubscribe2()

  t.strictEquals(state.subscribers.length, 0, 'Subscriber is removed (2).')

  state.set(state.UNKNOWN)

  t.strictEquals(listener1.invocationCount, 3, 'Listener 1 callback is not called after unsubscribe (2).')
  t.strictEquals(listener2.invocationCount, 3, 'Listener 2 callback is not called after unsubscribe.')

  t.end()
})

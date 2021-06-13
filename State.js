////////////////////////////////////////////////////////////////////////////////
//
// Basic State class.
//
// Properties:
//
// - Only one state may be active at a time.
// - Attempting to access a non-existent state will throw a TypeError.
// - No new states can be added after initialisation (throws Error).
// - Has is() and set() methods. Former returns a boolean based
//   on whether current state is the passed state and latter stores the passed
//   (optional) context in the state and sets the current state to it.
// - Exposes a subscribe method so you can treat it as a store and get
//   reactive updates in your interface by prefixing the state object’s name
//   with a dollar sign.
//
// Copyright ⓒ 2021-present Aral Balkan.
// Shared with ♥ by the Small Technology Foundation.
//
// Like this? Fund us!
// https://small-tech.org/fund-us
//
////////////////////////////////////////////////////////////////////////////////

// This is a Proxy class to ensure that new states cannot be added once
// a state object has been created and that state updates can only take place
// via the set() method. In other words, it acts as a guard.
export default class StateProxy {
  state = null

  constructor (state) {
    this.state = new State(state)

    return new Proxy(this, {

      get: (target, property, receiver) => {
        // Returns the internal, (non-proxied) state.
        // (This will have none of the guards provided by the proxy.)
        if (property === 'internal') {
          return this.state
        }

        let value = this.state[property]

        // Make sure and functions are bound to the state object.
        if (typeof value === 'function') {
          value = value.bind(this.state)
        }

        // Non-existent member access attempts throw an error. (We want
        // to fail fast on non-existent state look-ups.)
        if (value === undefined) {
          throw new TypeError(`Missing property on state: ${property}`)
        }

        return value
      },

      set: (object, property, value, receiver) => {
        // Do not allow properties to be directly set. State changes
        // must use the set method exclusively.
        throw new Error(`Cannot directly set property (${property}) on state. Please use the set() method instead.`)
      }
    })
  }
}

// This is the actual state class that does the bulk of the work,
// including providing a subscribe interface for Svelte-like stores.
class State {
  now = null
  subscribers = []

  constructor (state) {
    // Copy the state
    Object.assign(this, state)

    // Set the first state as the default.
    this.now = state[Object.keys(state)[0]]
  }

  is (state) {
    return this.now === state
  }

  set (state, context) {
    const key = Object.keys(this).find(key => this[key] === state)

    // Only update the context if one is passed.
    if (context !== undefined) {
      this[key] = context
    }
    this.now = this[key]

    // Notify all subscribers.
    this.subscribers.forEach(subscription => subscription.handler(this))
  }

  unsubscribe (id) {
    this.subscribers = this.subscribers.filter(subscription => subscription.id !== id)
  }

  subscribe (handler) {
    const id = Date.now()
    this.subscribers.push({ id, handler })

    // Call the handler right away (as per the Svelte spec).
    handler(this)

    // Return an unsubscribe function.
    return (() => {
      this.unsubscribe(id)
    }).bind(this)
  }
}

# @small-tech/state

A tiny (~100 lines of code) JavaScript state management class that supports Svelte stores.

## Install

```shell
npm i @small-tech/state
```

## Usage

### Initialise state

```js
import State from '@small-tech/state'

const state = new State({
  UNKNOWN: {},
  OK: {},
  NOT_OK: {}
})
```

Any properties you add to the empty objects become the context for the state.

The first state is set as the default state.

### Check state

```js
console.log(state.is(state.UNKNOWN)) // true
```

### Change state (without updating the context)

```js
state.set(state.OK)
console.log(state.is(state.OK)) // true
```

### Get the current state

```js
console.log(state.now) // {}
console.log(state.now === state.OK) // true
```

### Change state (and update the context)

```js
state.set(state.NOT_OK, { error: 'This is just not ok.' })
console.log(state.NOT_OK.error) // This is just not ok.
console.log(state.now.error)    // This is just not ok.
```

## Guards

The state object is actually a proxy and it will guard you against making the following mistakes (by throwing an error):

  - Attempt to access a non-existent state (throws `TypeError`).
  - Attempt to directly create a state or update a context after initialisation (throws `Error`).

## Use with Svelte

The state object implements [Svelte’s store contract](https://svelte.dev/docs#Store_contract). So you can use it reactively within your Svelte interface.

e.g., A small excerpt from [its use in](https://github.com/small-tech/basil/blob/stripe/.kit/src/lib/admin/PSL.svelte) [Basil](https://github.com/small-tech/basil), the [Small Web](https://ar.al/2020/08/07/what-is-the-small-web/) Host:

### Markup
```html
<h3 id='psl'>Public Suffix List (PSL) Settings</h3>

{#if $state.is(state.UNKNOWN)}
  <p><strong>Checking if domain is on the Public Suffix List…</strong></p>
{/if}

{#if $state.is(state.OK)}
  {#if state.OK.isPrivateInstance}
    <p><strong>✔️ Private instances do not have be registered on the <a href='https://publicsuffix.org'>Public Suffix List</a>.</strong></p>
    …
  {:else}
    <p><strong>✔️ Your domain is on the Public Suffix List.</strong></p>
  {/if}
{/if}

{#if $state.is(state.NOT_OK)}
  <p style='color: red;'><strong>❌️ {state.NOT_OK.error}</strong></p>
  <button on:click={validateSettings}>Check again now</button>
{/if}
```

### Script
```js
  import State from '@small-tech/state'

  const state = new State({
    UNKNOWN: {},
    OK: {},
    NOT_OK: {}
  })

  // …

  function validateSettings() {
    state.set(state.UNKNOWN)

    // Domain does not need to be on the Public Suffix List for private instances.
    if (settings.payment.provider === PAYMENT_PROVIDERS.none) {
      return state.set(state.OK, { isPrivateInstance: true })
    }

    // Otherwise, carry out validation.
    socket.send(JSON.stringify({
      type: type.VALIDATE_SETTINGS
    }))
  }

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)

    switch (message.type) {
      case messageIsOf(type.SETTINGS):
        validateSettings()
      break

      case messageIsOf(type.VALIDATE_SETTINGS):
        state.set(state.OK, { isPrivateInstance: false })
      break

      case errorIsOf(type.VALIDATE_SETTINGS):
        state.set(state.NOT_OK, { error: message.error })
      break
    }
  })
```

## Tests

```shell
npm run test
```

## Coverage

```shell
npm run coverage
```

## Like this? Fund us!

[Small Technology Foundation](https://small-tech.org) is a tiny, independent not-for-profit.

We exist in part thanks to patronage by people like you. If you share [our vision](https://small-tech.org/about/#small-technology) and want to support our work, please [become a patron or donate to us](https://small-tech.org/fund-us) today and help us continue to exist.

## Copyright

&copy; 2021-present [Aral Balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org).

## License

[ISC](https://opensource.org/licenses/ISC)

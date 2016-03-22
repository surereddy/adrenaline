# Adrenaline

[![build status](https://img.shields.io/travis/gyzerok/adrenaline/master.svg?style=flat-square)](https://travis-ci.org/gyzerok/adrenaline)
[![npm version](https://img.shields.io/npm/v/adrenaline.svg?style=flat-square)](https://www.npmjs.com/package/adrenaline)
[![npm downloads](https://img.shields.io/npm/dm/adrenaline.svg?style=flat-square)](https://www.npmjs.com/package/adrenaline)

This library provides subset of [Relay](https://github.com/facebook/relay) behaviour with a cleaner API.

## Why?

Relay is a great framework with exiting ideas behind it. The downside is that in order to get all cool features of one you need to deal with complex API. Relay provides you a lot of tricky optimistions which probably are more suitable for huge projects. In small, medium and even large ones you would prefer to have better DX while working with a simple minimalistic set of APIs.

Adrenaline intend to provide you Relay-like ability to describe your components with declarative data requirements, while keeping API as simple as possible. You are free to use it with different libraries like Redux, React Router and etc.

## When not use it?

- You have a huge project and highly need tricky optimisations to reduce client-server traffic.
- When you don't understand why should you prefer Adrenaline to Relay.

## Installation

`npm install --save adrenaline`

Adrenaline requires **React 0.14 or later.**

Adrenaline uses `fetch` under the hood so you need to install [polyfill](https://github.com/github/fetch) by yourself.

## API

Adrenaline follows the idea of [Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0#.b5g7ctse2)

### `<Adrenaline endpoint />`

Root of your application should be wrapped with Adrenaline component. This component is a provider component which injects some helpful stuff in your React application.

prop name | type   | default/required | purpose
----------|--------|------------------|--------
endpoint  | string | '/graphql'       | URI of your GraphQL endpoint

### `container({ variables, queries })(Component)`

In Adrenaline you would create container components mostly for your route handlers. Purpose of containers is to collect data requirements from presentation components in a single GraphQL query. Also they behave like view controllers and are able to speak to outside world using mutations.

key       | type                     | default/required | purpose
----------|--------------------------|------------------|--------
variables | (props: Props) => Object | () => ({})       | describe query variables as a pure function of props
query     | string                   | **required**     | your GraphQL query for this container


```javascript
import React, { Component, PropTypes } from 'react';
import { container } from 'adrenaline';
import TodoList from './TodoList';

class UserItem extends Component {
  static propTypes = {
    viewer: PropTypes.object.isRequired,
  }
  /* ... */
}

export default container({
  variables: (props) => ({
    id: props.userId,
  }),
  query: `
    query ($id: ID!) {
      viewer(id: $id) {
        id,
        name,
        ${TodoList.getFragment('todos')}
      }
    }
  `,
})(UserItem);
```

Also container would pass 2 additional properties to your component

* `mutate({ mutation: String, variables: Object = {}, invalidate: boolean = true }): Promise`: You need to use this function in order to perform mutations. `invalidate` argument means you need to resolve data declarations after mutation.
* `isFetching: boolean`: This property helps you understand if your component is in the middle of resolving data.

### `presenter({ fragments })(Component)`

As in [presentational components idea](https://github.com/rackt/react-redux#dumb-components-are-unaware-of-redux) all your dumb components may be declared as simple React components. But if you want to declare your data requirements in similar to Relay way you can use `createDumbComponent` function.

```javascript
import React, { Component } from 'react';
import { presenter } from 'adrenaline';

class TodoList extends Component {
  /* ... */
}

export default presenter({
  fragments: {
    todos: `
      fragment on User {
        todos {
          id,
          text
        }
      }
    `,
  },
})(Component);
```

### Mutations

You can declare your mutations as simple as

```javascript
const createTodo = `
  mutation ($text: String, $owner: ID) {
    createTodo(text: $text, owner: $owner) {
      id,
      text,
      owner {
        id
      }
    }
  }
`;
```

Then you can use this mutation with your component

```javascript
import React, { Component, PropTypes } from 'react';
import { createSmartComponent } from 'adrenaline';

class UserItem extends Component {
  static propTypes = {
    viewer: PropTypes.object.isRequired,
  }

  onSomeButtonClick() {
    this.props.mutate({
      mutation: createTodo,
      variables: {
        text: hello,
        owner: this.props.viewer.id
      },
    });
  }

  render() {
    /* render some stuff */
  }
}
```

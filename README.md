# Adrenaline

**Note: Currently docs are under development!**

React bindings for [Redux](https://github.com/rackt/redux) with [Relay](https://github.com/facebook/relay) in mind.

[![build status](https://img.shields.io/travis/gyzerok/adrenaline/master.svg?style=flat-square)](https://travis-ci.org/gyzerok/adrenaline)
[![npm version](https://img.shields.io/npm/v/adrenaline.svg?style=flat-square)](https://www.npmjs.com/package/adrenaline)
[![npm downloads](https://img.shields.io/npm/dm/adrenaline.svg?style=flat-square)](https://www.npmjs.com/package/adrenaline)

Personally I've found [Redux](https://github.com/rackt/redux) the best [Flux](https://github.com/facebook/flux) implementation for now. On the other hand I think that ideas behind [GraphQL](https://github.com/facebook/graphql) and [Relay](https://github.com/facebook/relay) are really great. Currently Relay API feels to be tightly coupled with Facebook cases and ecosystem. This project is an attempt to provide simplier Relay-like API with an ability to use full Redux features (time-travel, middlewares, etc...).

## Installation

`npm install --save adrenaline`

Adrenaline requires **React 0.13.**

## API

### Cache

First thing you need to know in order to use Adrenaline is how your client cache looks like. Your local client cache consists of normalized data. Adrenaline automatically normalizes data for you based on your GraphQL schema.

Suppose you do have following types in your schema:
```js
const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    name: {
      type: GraphQLString,
    },
    todos: {
      type: new GraphQLList(todoType),
      resolve: (user) => {
        // Your resolve logic
      },
    },
  }),
});

const todoType = new GraphQLObjectType({
  name: 'Todo',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    text: {
      type: GraphQLString,
    },
    owner: {
      type: userType,
      resolve: (todo) => {
        // Your resolve logic
      }
    },
  }),
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      viewer: {
        type: userType,
        resolve: () => {
          // Your resolve logic
        }
      }
    }),
  }),
});
```
Assume in the database you have one user with two todos. Then your cache might be:
```js
{
  User: {
    1: {
      id: 1,
      name: 'John Wick',
      todos: [1, 2],
    },
  },
  Todo: {
    1: {
      id: 1,
      text: 'Kill my enemies',
      owner: 1,
    },
    2: {
      id: 2,
      text: 'Drink some whiskey',
      owner: 1,
    },
  },
}
```

### GraphQL schema

In order to make things workinng you need to declare schema with one little addition. For all `resolve` function you need to declare behaviour for the client-side. One possible solution for this is to set global `__CLIENT__` variable and use it inside resolve functions.

With an example below it might looks like the following:
```js
const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    name: {
      type: GraphQLString,
    },
    todos: {
      type: new GraphQLList(todoType),
      resolve: (user, _, { rootValue: root }) => {
        if (__CLIENT__) {
          return user.todos.map(id => root.Todo[id]);
        }
        // resolve from database here
      },
    },
  }),
});

const todoType = new GraphQLObjectType({
  name: 'Todo',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    text: {
      type: GraphQLString,
    },
    owner: {
      type: userType,
      resolve: (todo, _, { rootValue: root }) => {
        if (__CLEINT__) {
          return root.User[todo.owner.id];
        }
        // resolve from database here
      }
    },
  }),
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      viewer: {
        type: userType,
        resolve: (root) => {
          if (__CLIENT__) {
            return root.User[1];
          }
          // Your resolve logic
        }
      }
    }),
  }),
});
```

### `<Adrenaline schema createStore>`

Root of your application should be wrapped with Adrenaline component.

#### Props

  - `schema`: An instance of GraphQL schema you are using.
  - `createStore`: Function for creating a store. Reducers would be created automatically, you just need to provide this function in order to be able to configure it with custom middlewares and higher-order stores. If nothing is provided `Redux.createStore` will be used.

### `createSmartComponent(Component, { initialArgs, query, mutations })`

This function is the main building block for your application.

### Mutations

Mutations should be declared as a plain objects. Simple mutation can be declared in the following way:
```js
const createTodo = {
  mutation: `
    mutation YourMutationName($text: String, $owner: ID) {
      createTodo(text: $text, owner: $owner) {
        id,
        text,
        owner {
          id
        }
      }
    }
  `,
}
```
In this example

But sometimes you need to update some references in order to make your client data consistent. Thats why there is an `updateCache` property which stands for an array of actions which need to be done in order to make data consistent. Those actions are quite similar to reducers. They have to return state pieces to update internal cache.
```js
const createTodo = {
  mutation: `
    mutation YourMutationName($text: String, $owner: ID) {
      createTodo(text: $text, owner: $owner) {
        id,
        text,
        owner {
          id
        }
      }
    }
  `,
  updateCache: [
    (todo) => ({
      parentId: todo.owner.id,
      parentType: 'Todo',
      resolve: (parent) => {
        return {
          ...parent,
          todos: parent.todos.concat([todo.id]),
        };
      },
    })
  ],
}
```

## Way to 1.0
 - Mutations
 - Queries batching
 - Default middlware for express
 - Isomorphism
 - Allow to specify starting params for component via props
 - Memoize fieldASTs to reduce overhead for query parsing
 - Move all to Redux as a deps to prevent implementing same things
 - Move all query sending into Adrenaline component?
 - Somehow solve nessesity of implementing cache resolve in the GraphQL schema

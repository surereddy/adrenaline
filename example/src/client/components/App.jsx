/* @flow */

import React, { Component, PropTypes } from 'react';
import TodoList from 'client/components/TodoList';
import { createSmartComponent } from '../../../../src';

class App extends Component {
  static propTypes = {
    viewer: PropTypes.object,
  }

  render() {
    const { todos } = this.props.viewer;

    return (
      <TodoList todos={todos} />
    );
  }
}

export default createSmartComponent(App, {
  endpoint: '/graphql',
  query: () => `
    query AppQuery {
      ${TodoList.getFragment('viewer')}
    }
  `,
});
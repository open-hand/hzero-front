/* eslint-disable-next-line */
import React from 'react';
import { Route } from 'dva/router';

export default class WrapperRoute extends Route {
  shouldComponentUpdate(nextProps, nextState) {
    return !!nextState.match;
  }
}

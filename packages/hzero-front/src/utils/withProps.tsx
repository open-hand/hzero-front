/**
 * withProps 高阶组件 注入 props
 * @date 2019/09/01
 * @author wuyunqiang yunqiang.wu@hand-china.com
 * @copyright Copyright (c) 2018, Hand
 */

import { DataSet } from 'choerodon-ui/pro';
import React from 'react';

/**
 * 默认清除时间
 */
const CLEAN_CACHE_TIMEOUT = 10 * 1000 * 60;

interface ThrottleTimeSingled extends Function {
  clean: () => void;
  startTimeoutClean: (timer: number) => void;
}

/**
 * 缓存方法的返回值, 有点类似于单例模式，区别在于，调用 startTimeoutClean 之后会在指定时间内清除缓存，
 * 每次调用该方法是缓存时间重置。
 * @param {*} func 缓存的方法
 * @returns {Function} throttleTimeSingleFun 返回的包装后端方法
 * @returns {Function} throttleTimeSingleFun.startTimeoutClean 开始计时，当到达指定时候后清除缓存数据
 */
export function throttleTimeSingle(func: () => void): ThrottleTimeSingled {
  if (typeof func !== 'function') {
    throw new TypeError('FUNC_ERROR_TEXT');
  }
  let result;
  let lastArgs;
  let lastThis;
  let timerId;

  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    result = func.apply(thisArg, args);
    return result;
  }

  const clean = () => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    lastArgs = undefined;
    lastThis = undefined;
    timerId = undefined;
    result = undefined;
  };

  const startTimeoutClean = (wait = CLEAN_CACHE_TIMEOUT) => {
    if (wait === 0) {
      clean();
      return;
    }
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(clean, wait);
  };

  function throttleTimeSingled(that: any, ...rest) {
    lastArgs = rest;
    lastThis = that;
    if (timerId === undefined) {
      return invokeFunc();
    }
    clearTimeout(timerId);
    return result;
  }

  throttleTimeSingled.startTimeoutClean = startTimeoutClean;
  throttleTimeSingled.clean = clean;

  return throttleTimeSingled;
}

/**
 * 高级组件 单例模式缓存props,并且在组件生命周期之后的指定时间后清除缓存
 * @param initPropsFun {()=>({ [key: string]: DataSet })} initPropsFun 返回一个 dataset map 的方法
 * @param options.cacheState {boolean} 是否缓存数据状态
 *
 * @example
 *  // initProps 是延迟运行的，initProps 返回的数据可以注入到组件的 props 里面
 *  const initProps = () => {
 *    const tableDS = new DataSet({
 *      ...dataSetProps(),
 *        autoQuery: true,
 *        exportUrl: '...',
 *    });
 *    return {
 *      tableDS,
 *    };
 *  };
 *  @withProps(initProps, { cacheState: true })
 *  export default class ListPage extends PureComponent {
 *    initWithProps() {
 *       // 这里可以完成 ds 的事件绑定, 或者对 initProps 返回的 Props 做一些持久化的修改
 *       this.props.tableDS.addEventListener('query', this.handleQueryEvent);
 *    }
 *    componentDidMount() {
 *      // 这里可以拿到通过时间缓存控制过的 initProps 的返回值
 *      console.log(this.props.tableDS);
 *   }
 * }
 */
export default function withProps(
  initPropsFun: () => { [key: string]: DataSet },
  { wait = CLEAN_CACHE_TIMEOUT, cacheState = false }: { wait?: number; cacheState?: boolean } = {}
): any {
  const throttleTimeSingleFun = throttleTimeSingle(initPropsFun);
  return Components => {
    class WithPropsComponent extends React.Component<{ language: string }> {
      constructor(props) {
        super(props);
        this.state = throttleTimeSingleFun();
      }

      /**
       * FIXME: @WYQ
       * @param nextProps
       * @constructor
       */
      // eslint-disable-next-line camelcase
      public UNSAFE_componentWillReceiveProps(nextProps) {
        const { language } = this.props;
        const { language: nextLanguage } = nextProps;
        if (language !== nextLanguage) {
          throttleTimeSingleFun.clean();
          setTimeout(() => {
            this.setState(throttleTimeSingleFun());
          }, 400);
        }
      }

      public componentWillUnmount() {
        if (cacheState) {
          throttleTimeSingleFun.startTimeoutClean(wait);
        } else {
          throttleTimeSingleFun.clean();
        }
      }

      public render() {
        const { children, ...otherProps } = this.props;
        return React.createElement(Components, { ...this.state, ...otherProps }, children);
      }
    }
    return WithPropsComponent;
  };
}

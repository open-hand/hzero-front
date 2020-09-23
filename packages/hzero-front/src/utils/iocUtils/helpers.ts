import { inject } from 'what-di';
import * as defaultConfig from '../config';
import { ConfigProvider } from './init';
import { UedProvider } from './UedProvider';

// 适配未引入新版hzero-boot的情况
export function getEnvConfig<T>(): T {
  try {
    const _config = inject<ConfigProvider>('config') || {};
    return (_config.config || defaultConfig) as T;
  } catch {
    return defaultConfig as T;
  }
}

/**
 * 获取dvaApp
 */
export function getDvaApp(): any {
  const dvaApp = inject('dvaApp');
  return dvaApp || (<any>window).dvaApp;
}

/**
 * 拓展配置
 * @param conf { Object }
 */
export function extendsEnvConfig(conf: any): void {
  const _conf = inject<ConfigProvider>('config');
  _conf.extends(conf);
}

export function registerUedContainer(Container: any) {
  const ued = inject<UedProvider>(UedProvider);
  ued.registerContainer(Container);
}

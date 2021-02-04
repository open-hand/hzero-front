import React, { useEffect, useState, useMemo } from 'react';
import { routerRedux, Switch, Route, withRouter } from 'dva/router';
import { getConfig } from 'hzero-boot';

import ModalContainer, { registerContainer } from 'components/Modal/ModalContainer';
import { ModalContainer as C7nModalContainer } from 'choerodon-ui/pro';
import Authorized from 'components/Authorized/WrapAuthorized';
import PermissionProvider from 'components/Permission/PermissionProvider';

import LocalProviderAsync from 'utils/intl/LocaleProviderAsync';

import { dynamicWrapper } from 'utils/router';
import { inject } from 'what-di';
import DefaultContainer from 'utils/iocUtils/DefaultContainer';
import { initIoc } from 'utils/iocUtils';
import { UedProvider } from 'utils/iocUtils/UedProvider';

// 初始化ioc容器
initIoc();

const WithRouterC7nModalContainer = withRouter(C7nModalContainer);
const { ConnectedRouter } = routerRedux;
const { DefaultAuthorizedRoute, PubAuthorizedRoute } = Authorized;

function RouterConfig({ history, app }) {
  const [uedConfig, setUedConfig] = useState({
    Container: DefaultContainer,
  });

  const Layout = dynamicWrapper(app, ['user', 'login'], () => import('./layouts/Layout'));
  const PubLayout = dynamicWrapper(app, ['user', 'login'], () => import('./layouts/PubLayout'));

  // 免登陆无权限路由
  const PublicLayout = dynamicWrapper(app, [], () => import('./layouts/PublicLayout'));
  // 免登陆权限路由
  const PrivateLayout = dynamicWrapper(app, [], () => import('./layouts/PrivateLayout'));

  useEffect(() => {
    const ued = inject(UedProvider);
    ued.subscribe(({ Container = null }) => {
      setUedConfig({
        Container: Container || DefaultContainer,
      });
    });
  }, []);

  const layoutExtraHeader = useMemo(() => {
    return getConfig('layoutExtraHeader');
  }, []);

  // 全局系统属性
  const configureParams = useMemo(() => {
    const result = getConfig('configureParams');
    if (typeof result === 'function') {
      return result();
    }
    return result;
  }, []);

  const redirectData = useMemo(() => {
    const result = getConfig('redirectData');
    if (typeof result === 'function') {
      return result();
    }
    return result;
  }, []);

  return (
    <uedConfig.Container defaultTheme="theme2">
      <LocalProviderAsync {...configureParams}>
        <PermissionProvider>
          <ConnectedRouter history={history}>
            <>
              <ModalContainer ref={registerContainer} />
              <WithRouterC7nModalContainer />
              <Switch>
                <Route
                  path="/private"
                  render={(props) => <PrivateLayout redirectData={redirectData} {...props} />}
                />
                <Route
                  path="/public"
                  render={(props) => <PublicLayout redirectData={redirectData} {...props} />}
                />
                <PubAuthorizedRoute
                  path="/pub"
                  render={(props) => <PubLayout redirectData={redirectData} {...props} />}
                />
                <DefaultAuthorizedRoute
                  path="/"
                  render={(props) => (
                    <Layout
                      redirectData={redirectData}
                      {...props}
                      extraHeaderRight={layoutExtraHeader}
                      headerProps={{ toolbarProps: { extraHeaderRight: layoutExtraHeader } }}
                    />
                  )}
                />
              </Switch>
            </>
          </ConnectedRouter>
        </PermissionProvider>
      </LocalProviderAsync>
    </uedConfig.Container>
  );
}

export default RouterConfig;

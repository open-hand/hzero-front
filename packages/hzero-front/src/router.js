import React, { useEffect, useState } from 'react';
import { routerRedux, Switch, Route, withRouter } from 'dva/router';

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
  return (
    <uedConfig.Container defaultTheme="theme2">
      <LocalProviderAsync>
        <PermissionProvider>
          <ConnectedRouter history={history}>
            <>
              <ModalContainer ref={registerContainer} />
              <WithRouterC7nModalContainer />
              <Switch>
                <Route path="/private" render={(props) => <PrivateLayout {...props} />} />
                <Route path="/public" render={(props) => <PublicLayout {...props} />} />
                <PubAuthorizedRoute path="/pub" render={(props) => <PubLayout {...props} />} />
                <DefaultAuthorizedRoute path="/" render={(props) => <Layout {...props} />} />
              </Switch>
            </>
          </ConnectedRouter>
        </PermissionProvider>
      </LocalProviderAsync>
    </uedConfig.Container>
  );
}

export default RouterConfig;

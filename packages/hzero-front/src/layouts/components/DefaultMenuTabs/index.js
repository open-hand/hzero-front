import React from 'react';
import { Icon, Layout, Spin, List, Popover, Tabs } from 'hzero-ui';
import { isFunction, map } from 'lodash';
import { Bind } from 'lodash-decorators';
import { connect } from 'dva';
import { Link, Redirect, Route, Switch } from 'dva/router';
import uuid from 'uuid/v4';

import getTabRoutes from 'components/Router';
import Exception from 'components/Exception';
import Icons from 'components/Icons';
import { cleanCache } from 'components/CacheComponent';

import intl from 'utils/intl';
import { isPromise } from 'utils/utils';
import {
  closeTab,
  getBeforeMenuTabRemove,
  getTabFromKey,
  menuTabEventManager,
  openTab,
} from 'utils/menuTab';

import styles from './index.less';

const { Content } = Layout;
const { TabPane } = Tabs;
const DefaultNotFound = () => (
  <Exception type="404" style={{ minHeight: 500, height: '80%' }} linkElement={Link} />
);
const EMPTY_ROUTE = () => null;

/**
 * 菜单数据结构改变 只有菜单有path,目录没有path
 * 所有的菜单必须有 服务前缀 `/服务前缀/...功能集合/功能/...子功能`
 * 根据菜单取得重定向地址.
 */
const getRedirect = (item, redirectData = []) => {
  if (item && item.children) {
    // 目录
    for (let i = 0; i < item.children.length; i++) {
      getRedirect(item.children[i], redirectData);
    }
    return redirectData;
  }
  if (item && item.path) {
    // 菜单
    let menuPaths = item.path.split('/');
    if (!menuPaths[0]) {
      menuPaths = menuPaths.slice(1, menuPaths.length);
    }
    let menuPath = '';
    for (let i = 0; i < menuPaths.length - 1; i++) {
      menuPath += `/${menuPaths[i]}`;
      const from = menuPath;
      const to = `${menuPath}/${menuPaths[i + 1]}`;
      const exist = redirectData.some((route) => route.from === from);
      if (!exist) {
        redirectData.push({ from, to });
      }
    }
  }
};

window.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    const node = document.querySelector(`.hzero-fullscreen`);
    if (node) {
      node.classList.remove('hzero-fullscreen');
    }
  }
});

class DefaultMenuTabs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contextMenuVisibleKey: '', // 显示的右键菜单对应的 tab
      contextMenuVisible: false, // 是否显示 右键菜单
    };
    this.refreshKeyMap = new Map();
  }

  /**
   * 切换 tab
   * @param {string} activeKey - menuTab 的 key
   */
  onTabChange(activeKey) {
    // const { history } = this.props;
    openTab(getTabFromKey(activeKey));
  }

  onTabEdit = (targetKey, action) => {
    this[action](targetKey);
  };

  /**
   * 关闭 tab
   */
  remove(targetKey) {
    const onBeforeHandler = getBeforeMenuTabRemove(targetKey);
    if (isFunction(onBeforeHandler)) {
      const isShouldDelete = onBeforeHandler();
      if (isPromise(isShouldDelete)) {
        isShouldDelete.then(
          // 关闭tab
          () => {
            cleanCache(targetKey);
            closeTab(targetKey);
          }
        );
      } else if (isShouldDelete !== false) {
        cleanCache(targetKey);
        closeTab(targetKey);
      }
    } else {
      cleanCache(targetKey);
      closeTab(targetKey);
    }
  }

  /**
   * 清除 contextMenu 的信息
   */
  clearContextMenuVisible() {
    this.setState({
      contextMenuVisibleKey: '',
      contextMenuVisible: false,
    });
  }

  /**
   * 在 render 时 使用了 arrow function, 所以不需要 @Bind()
   * 触发右键菜单的事件
   * @param {Object} pane - tab
   * @param {Boolean} visible - 显示或隐藏
   */
  handleContextMenuTrigger(pane, visible) {
    this.setState({
      contextMenuVisibleKey: pane.key,
      contextMenuVisible: visible,
    });
  }

  /**
   * 关闭除了当前 tab 的 所有可关闭的tab, 如果新的 tabs 不包含 active tab 则 打开当前 tab
   * @param {object} pane - menuTab 数据
   */
  @Bind()
  handleMenuTabCloseOthers(pane, e) {
    e.stopPropagation();
    const { removeOtherMenuTab, tabs = [], activeTabKey } = this.props;
    const removeTabs = tabs.filter((t) => t.key !== pane.key && t.closable);
    this.clearContextMenuVisible();
    removeOtherMenuTab({ tab: pane }).then((nextActiveTabKey) => {
      if (nextActiveTabKey !== activeTabKey) {
        openTab(getTabFromKey(nextActiveTabKey));
      }
      removeTabs.forEach((t) => {
        cleanCache(t.key);
        menuTabEventManager.emit('close', { tabKey: t.key });
      });
    });
  }

  /**
   * 关闭除了当前 tab 的 所有可关闭的tab, 如果新的 tabs 不包含 active tab 则 打开当前 tab
   * @param {object} pane - menuTab 数据
   */
  @Bind()
  handleMenuTabCloseLeft(pane, e) {
    e.stopPropagation();
    const { removeSomeMenuTab, tabs = [], activeTabKey } = this.props;
    const removeTabs = tabs
      .slice(
        0,
        tabs.findIndex((t) => t.key === pane.key)
      )
      .filter((i) => i.closable)
      .map((j) => j.key);
    this.clearContextMenuVisible();
    removeSomeMenuTab({ removeTabs }).then(() => {
      if (pane.key !== activeTabKey) {
        openTab(getTabFromKey(pane.key));
      }
      removeTabs.forEach((t) => {
        cleanCache(t.key);
        menuTabEventManager.emit('close', { tabKey: t.key });
      });
    });
  }

  /**
   * 关闭除了当前 tab 的 所有可关闭的tab, 如果新的 tabs 不包含 active tab 则 打开当前 tab
   * @param {object} pane - menuTab 数据
   */
  @Bind()
  handleMenuTabCloseRight(pane, e) {
    e.stopPropagation();
    const { removeSomeMenuTab, tabs = [], activeTabKey } = this.props;
    const removeTabs = tabs
      .slice(tabs.findIndex((t) => t.key === pane.key) + 1)
      .filter((i) => i.closable)
      .map((j) => j.key);
    this.clearContextMenuVisible();
    removeSomeMenuTab({ removeTabs }).then(() => {
      if (pane.key !== activeTabKey) {
        openTab(getTabFromKey(pane.key));
      }
      removeTabs.forEach((t) => {
        cleanCache(t.key);
        menuTabEventManager.emit('close', { tabKey: t.key });
      });
    });
  }

  /**
   * 关闭所有可关闭的tab, 打开最靠近的 !closable 的tab
   * @param {object} pane - menuTab 数据
   */
  @Bind()
  handleMenuTabCloseAll(pane, e) {
    e.stopPropagation();
    const { removeAllMenuTab, tabs = [], activeTabKey } = this.props;
    const removeTabs = tabs.filter((t) => t.closable);
    this.clearContextMenuVisible();
    removeAllMenuTab({ tab: pane }).then((nextActiveTabKey) => {
      if (nextActiveTabKey !== activeTabKey) {
        openTab(getTabFromKey(nextActiveTabKey));
      }
      removeTabs.forEach((t) => {
        cleanCache(t.key);
        menuTabEventManager.emit('close', { tabKey: t.key });
      });
    });
  }

  /**
   * 刷新当前 tab
   * @param {object} pane - menuTab 数据
   */
  @Bind()
  handleMenuTabRefresh(pane, e) {
    e.stopPropagation();
    this.clearContextMenuVisible();
    this.refreshKeyMap.set(pane.key, uuid());
    menuTabEventManager.emit('refresh', { tabKey: pane.key });
    this.forceUpdate();
  }

  /**
   * 全屏当前 tab
   * @param {object} pane - menuTab 数据 page-container
   */
  @Bind()
  handleMenuTabFullScreen(pane, e) {
    e.stopPropagation();
    const { activeTabKey, menuLayout } = this.props;
    this.clearContextMenuVisible();

    if (!document.fullscreenElement) {
      if (menuLayout === 'horizontal') {
        const node = document.querySelector(`.hzero-layout`);
        node.classList.add('hzero-fullscreen');
      } else if (menuLayout === 'side') {
        const node = document.querySelector(`.hzero-side-layout-container`);
        node.classList.add('hzero-fullscreen');
      } else if (menuLayout === 'side-all') {
        const node = document.querySelector(`.hzero-common-layout-container`);
        node.classList.add('hzero-fullscreen');
      } else {
        const node = document.querySelector(`.hzero-normal-container`);
        node.classList.add('hzero-fullscreen');
      }

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      }
    }

    if (pane.key !== activeTabKey) {
      openTab(getTabFromKey(pane.key));
    }
  }

  getBaseRedirect() {
    // According to the url parameter to redirect
    // 这里是重定向的,重定向到 url 的 redirect 参数所示地址
    const urlParams = new URL(window.location.href);

    const redirect = urlParams.searchParams.get('redirect');
    // Remove the parameters in the url
    if (redirect) {
      urlParams.searchParams.delete('redirect');
      window.history.replaceState(null, 'redirect', urlParams.href);
    } else {
      const { routerData = {} } = this.props;
      // get the first authorized route path in routerData
      // const authorizedPath = Object.keys(routerData).find(
      //   item => check(routerData[item].authority, item) && item !== '/'
      // );
      const authorizedPath = Object.keys(routerData).find((item) => item !== '/');
      return authorizedPath;
    }
    return redirect;
  }

  render() {
    const {
      activeTabKey, // 当前激活的 Tab 的 key
      language, // 当前的语言
      NotFound = DefaultNotFound, // 当找不到路由时返回的路由
      tabs = [], // 所有打开的 tabs
      menu = [], // 所有的菜单
      layoutLoading,
      pathname,
      routerData = {}, // 所有的路由
      extraRight = null, // 右侧额外的组件
    } = this.props;
    if (layoutLoading) {
      return (
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      );
    }
    const { contextMenuVisibleKey, contextMenuVisible = false } = this.state;
    const redirectData = [{ from: '/', to: '/workplace' }]; // 根目录需要跳转到工作台
    menu.forEach((item) => {
      getRedirect(item, redirectData);
    });
    const bashRedirect = this.getBaseRedirect();

    return (
      <>
        <Switch>
          {map(redirectData, (item) => (
            <Redirect key={item.from} exact from={item.from} to={item.to} />
          ))}
          {bashRedirect ? <Redirect exact from="/" to={bashRedirect} /> : null}
          {menu.length === 0 ? null : <Route render={EMPTY_ROUTE} />}
        </Switch>
        <Tabs
          hideAdd
          onChange={this.onTabChange}
          activeKey={activeTabKey}
          type="editable-card"
          onEdit={this.onTabEdit}
          tabBarExtraContent={extraRight}
          className={styles['menu-tabs']}
        >
          {map(tabs, (pane, index) => (
            <TabPane
              closable={pane.closable}
              tab={
                <Popover
                  overlayClassName="default-menu-tabs-context-menu"
                  content={
                    <List size="small">
                      {(tabs.length > 2 || pane.key === '/workplace') && tabs.length !== 1 && (
                        <List.Item
                          onClick={(e) => {
                            this.handleMenuTabCloseOthers(pane, e);
                          }}
                          className="default-menu-tabs-context-menu-item"
                        >
                          <Icons
                            type="close-other"
                            size={14}
                            className="default-menu-tabs-context-menu-item-icon"
                          />
                          <span className="default-menu-tabs-context-menu-item-text">
                            {intl.get('hzero.common.button.closeOther').d('关闭其他')}
                          </span>
                        </List.Item>
                      )}
                      {pane.key !== '/workplace' && index !== 1 && (
                        <List.Item
                          onClick={(e) => {
                            this.handleMenuTabCloseLeft(pane, e);
                          }}
                          className="default-menu-tabs-context-menu-item"
                        >
                          <Icons
                            type="close-all"
                            size={14}
                            className="default-menu-tabs-context-menu-item-icon"
                          />
                          <span className="default-menu-tabs-context-menu-item-text">
                            {intl.get('hzero.common.button.closeLeft').d('关闭左侧')}
                          </span>
                        </List.Item>
                      )}
                      {tabs.length - 1 !== index && (
                        <List.Item
                          onClick={(e) => {
                            this.handleMenuTabCloseRight(pane, e);
                          }}
                          className="default-menu-tabs-context-menu-item"
                        >
                          <Icons
                            type="close-all"
                            size={14}
                            className="default-menu-tabs-context-menu-item-icon"
                          />
                          <span className="default-menu-tabs-context-menu-item-text">
                            {intl.get('hzero.common.button.closeRight').d('关闭右侧')}
                          </span>
                        </List.Item>
                      )}
                      {tabs.length !== 1 && (
                        <List.Item
                          onClick={(e) => {
                            this.handleMenuTabCloseAll(pane, e);
                          }}
                          className="default-menu-tabs-context-menu-item"
                        >
                          <Icons
                            type="close-all"
                            size={14}
                            className="default-menu-tabs-context-menu-item-icon"
                          />
                          <span className="default-menu-tabs-context-menu-item-text">
                            {intl.get('hzero.common.button.closeAll').d('关闭全部')}
                          </span>
                        </List.Item>
                      )}
                      <List.Item
                        onClick={(e) => {
                          this.handleMenuTabFullScreen(pane, e);
                        }}
                        className="default-menu-tabs-context-menu-item"
                      >
                        <Icons
                          type="full-screen"
                          size={14}
                          className="default-menu-tabs-context-menu-item-icon"
                          // style={{ lineHeight: 'inherit', fontSize: '14px' }}
                        />
                        <span className="default-menu-tabs-context-menu-item-text">
                          {intl.get('hzero.common.button.fullScreen').d('全屏')}
                        </span>
                      </List.Item>
                      {pane.key === activeTabKey && (
                        <List.Item
                          onClick={(e) => {
                            this.handleMenuTabRefresh(pane, e);
                          }}
                          className="default-menu-tabs-context-menu-item"
                        >
                          <Icons
                            type="refresh"
                            size={14}
                            className="default-menu-tabs-context-menu-item-icon"
                          />
                          <span className="default-menu-tabs-context-menu-item-text">
                            {intl.get('hzero.common.button.refresh').d('刷新')}
                          </span>
                        </List.Item>
                      )}
                    </List>
                  }
                  title={null}
                  trigger="contextMenu"
                  visible={pane.key === contextMenuVisibleKey && contextMenuVisible}
                  onVisibleChange={(visible) => {
                    this.handleContextMenuTrigger(pane, visible);
                  }}
                >
                  {pane.path === '/workplace' ? (
                    <span>
                      <Icon type={pane.icon} key="icon" />
                      {language ? pane.title && intl.get(pane.title).d(pane.title) : '...'}
                    </span>
                  ) : (
                    <span>
                      {language ? pane.title && intl.get(pane.title).d(pane.title) : '...'}
                    </span>
                  )}
                </Popover>
              }
              key={pane.key}
            >
              <Content className="page-container" key={this.refreshKeyMap.get(pane.key)}>
                {getTabRoutes({
                  pane,
                  routerData,
                  NotFound,
                  pathname,
                  menu,
                  activeTabKey,
                })}
              </Content>
            </TabPane>
          ))}
        </Tabs>
      </>
    );
  }
}

function mapStateToProps({ global = {}, user = {}, routing }) {
  const { currentUser = {} } = user;
  const { menuLayout = 'default-layout' } = currentUser;
  return {
    activeTabKey: global.activeTabKey,
    tabs: global.tabs,
    menu: global.menu,
    routerData: global.routerData,
    language: global.language,
    layoutLoading: global.layoutLoading,
    menuLayout,
    pathname: routing && routing.location.pathname,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    removeSomeMenuTab(payload) {
      return dispatch({
        type: 'global/removeSomeMenuTab',
        payload,
      });
    },
    removeOtherMenuTab(payload) {
      return dispatch({
        type: 'global/removeOtherMenuTab',
        payload,
      });
    },
    removeAllMenuTab(payload) {
      return dispatch({
        type: 'global/removeAllMenuTab',
        payload,
      });
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps, null, { pure: false })(DefaultMenuTabs);

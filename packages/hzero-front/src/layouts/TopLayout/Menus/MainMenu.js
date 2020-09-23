/**
 * 所有的一级菜单, 当前激活的 一级菜单
 *
 * MainMenu
 * @author WY <yang.wang06@hand-china.com>
 * @date 2019-05-24
 * @copyright 2019-05-24 © HAND
 */

import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import { Bind } from 'lodash-decorators';
import { Tabs } from 'hzero-ui';

import intl from 'utils/intl';

import { getStyle } from '../utils';

class MainMenu extends Component {
  // static propTypes = {
  //   onMainMenuChange: PropTypes.func.isRequired,
  // };

  @Bind()
  handleMainMenuChange(menuId) {
    const { onMainMenuChange, menus = [] } = this.props;
    const changeMainMenu = menus.find(menu => `${menu.id}` === menuId);
    if (changeMainMenu) {
      onMainMenuChange(changeMainMenu);
    }
  }

  render() {
    const { menus, language, extraRight = null } = this.props;
    return (
      <Tabs
        type="card"
        className={getStyle('main-menu')}
        onChange={this.handleMainMenuChange}
        tabBarExtraContent={extraRight}
      >
        {menus.map(menu => (
          <Tabs.TabPane
            key={menu.id}
            tab={language ? menu.name && intl.get(menu.name).d(menu.name) : '...'}
          />
        ))}
      </Tabs>
    );
  }
}

export default MainMenu;

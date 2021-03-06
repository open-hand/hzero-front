import React, { PureComponent } from 'react';
import { Table as AntTable } from 'hzero-ui';
import intl from 'utils/intl';

const modelPrompt = 'hiam.tenantMenu.model.tenantMenu';

export default class Table extends PureComponent {
  constructor(props) {
    super(props);
    // 方法注册
    ['onCell'].forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  defaultTableRowKey = 'id';

  onCell() {
    return {
      style: {
        overflow: 'hidden',
        maxWidth: 180,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      onClick: e => {
        const { target } = e;
        if (target.style.whiteSpace === 'normal') {
          target.style.whiteSpace = 'nowrap';
        } else {
          target.style.whiteSpace = 'normal';
        }
      },
    };
  }

  render() {
    const { dataSource = [], pagination, ...others } = this.props;
    const tableProps = {
      rowKey: this.defaultTableRowKey,
      columns: [
        {
          title: intl.get(`${modelPrompt}.permissionCode`).d('权限编码'),
          dataIndex: 'code',
          width: 150,
          onCell: this.onCell,
        },
        {
          title: intl.get(`${modelPrompt}.description`).d('描述'),
          dataIndex: 'description',
          width: 180,
          onCell: this.onCell,
        },
      ],
      dataSource,
      pagination,
      bordered: true,
      ...others,
    };
    return <AntTable {...tableProps} />;
  }
}

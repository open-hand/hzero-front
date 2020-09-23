/**
 * Groups
 * @author WY <yang.wang06@hand-china.com>
 * @date 2019-06-14
 * @copyright 2019-06-14 © HAND
 */

import React, { Component } from 'react';
import { Bind } from 'lodash-decorators';
import { Table } from 'hzero-ui';

import { Button as ButtonPermission } from 'components/Permission';

import intl from 'utils/intl';
import notification from 'utils/notification';
import { createPagination, tableScrollWidth } from 'utils/utils';

import GroupsOrUnitModal from './GroupsOrUnitModal';

export default class GroupsOrUnit extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.handleSearch();
  }

  // 查询已经分配的用户
  handleSearch(pagination = {}) {
    const { queryAssignedList, receiverTypeId } = this.props;
    queryAssignedList({
      id: receiverTypeId,
      query: pagination,
    }).then(res => {
      if (res) {
        this.setState({
          selectedRowKeys: [],
          selectedRows: [],
          dataSource: res.content,
          pagination: createPagination(res),
          cachePagination: pagination,
        });
      }
    });
  }

  // 删除 已经分配的用户
  @Bind()
  delSelectedList() {
    const { removeReceiverTypeList, receiverTypeId } = this.props;
    const { selectedRows } = this.state;
    removeReceiverTypeList({
      id: receiverTypeId,
      records: selectedRows,
    }).then(res => {
      if (res) {
        notification.success();
        const { cachePagination } = this.state;
        this.handleSearch(cachePagination);
      }
    });
  }

  // 分配用户给用户组
  @Bind()
  assignList(payload) {
    const { assignListToReceiverType } = this.props;
    assignListToReceiverType(payload).then(res => {
      if (res) {
        notification.success();
        const { cachePagination } = this.state;
        this.handleSearch(cachePagination);
        this.setState({
          visible: false,
        });
      }
    });
  }

  // Table
  getColumns() {
    return [
      {
        title: intl.get('hmsg.receiverType.model.receiverType.receiver').d('接收者'),
        dataIndex: 'receiveTargetName',
      },
    ];
  }

  @Bind()
  handleRowSelectionChange(_, selectedRows) {
    this.setState({
      selectedRows,
      selectedRowKeys: selectedRows.map(r => r.receiverTypeLineId),
    });
  }

  @Bind()
  handleTableChange(page, filter, sort) {
    this.handleSearch({ page, sort });
  }

  // Button
  @Bind()
  handleAddBtnClick() {
    this.setState({
      visible: true,
    });
  }

  @Bind()
  handleDelBtnClick() {
    this.delSelectedList();
  }

  // Modal
  @Bind()
  closeModal() {
    this.setState({
      visible: false,
    });
  }

  render() {
    const {
      queryAssignedListLoading = false,
      assignListToReceiverTypeLoading = false,
      removeReceiverTypeListLoading = false,
      typeModeCode,
      receiverTypeId,
      tenantId,
      queryNoAssignUnitListLoading,
      queryNoAssignUnitList,
      queryNoAssignUserGroupListLoading,
      queryNoAssignUserGroupList,
      path,
    } = this.props;

    const { dataSource = [], selectedRowKeys = [], pagination = false, visible } = this.state;
    const columns = this.getColumns();
    const rowSelection = {
      selectedRowKeys,
      onChange: this.handleRowSelectionChange,
    };
    return (
      <>
        <div className="table-operator">
          <ButtonPermission
            permissionList={[
              {
                code: `${path}.button.add`,
                type: 'button',
                meaning: '接收组维护-新增用户组',
              },
            ]}
            htmlType="button"
            type="primary"
            onClick={this.handleAddBtnClick}
            loading={queryAssignedListLoading}
            disabled={
              removeReceiverTypeListLoading ||
              queryAssignedListLoading ||
              assignListToReceiverTypeLoading
            }
          >
            {intl.get('hzero.common.button.add').d('新增')}
          </ButtonPermission>
          <ButtonPermission
            permissionList={[
              {
                code: `${path}.button.delete`,
                type: 'button',
                meaning: '接收组维护-删除用户组',
              },
            ]}
            htmlType="button"
            onClick={this.handleDelBtnClick}
            loading={removeReceiverTypeListLoading}
            disabled={
              selectedRowKeys.length === 0 ||
              removeReceiverTypeListLoading ||
              queryAssignedListLoading ||
              assignListToReceiverTypeLoading
            }
          >
            {intl.get('hzero.common.button.delete').d('删除')}
          </ButtonPermission>
        </div>
        <Table
          bordered
          rowKey="receiverTypeLineId"
          dataSource={dataSource}
          rowSelection={rowSelection}
          pagination={pagination}
          columns={columns}
          scroll={{ x: tableScrollWidth(columns) }}
          onChange={this.handleTableChange}
        />
        {visible && (
          <GroupsOrUnitModal
            visible={visible}
            onOk={this.assignList}
            onCancel={this.closeModal}
            assignListLoading={assignListToReceiverTypeLoading}
            typeModeCode={typeModeCode}
            receiverTypeId={receiverTypeId}
            tenantId={tenantId}
            queryNoAssignUnitListLoading={queryNoAssignUnitListLoading}
            queryNoAssignUnitList={queryNoAssignUnitList}
            queryNoAssignUserGroupListLoading={queryNoAssignUserGroupListLoading}
            queryNoAssignUserGroupList={queryNoAssignUserGroupList}
          />
        )}
      </>
    );
  }
}

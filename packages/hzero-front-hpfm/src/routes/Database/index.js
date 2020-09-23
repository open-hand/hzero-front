/**
 * database - 数据库
 * @date: 2018-9-10
 * @author: CJ <juan.chen01@hand-china.com>
 * @version: 0.0.1
 * @copyright Copyright (c) 2018, Hand
 */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Bind } from 'lodash-decorators';
import { isUndefined, isEmpty } from 'lodash';

import { Header, Content } from 'components/Page';
import { Button as ButtonPermission } from 'components/Permission';

import intl from 'utils/intl';
import formatterCollections from 'utils/intl/formatterCollections';
import notification from 'utils/notification';
import { getCurrentOrganizationId, filterNullValueObject, isTenantRoleLevel } from 'utils/utils';

import TableList from './TableList';
import FilterForm from './FilterForm';
import Drawer from './Drawer';

@connect(({ database, loading }) => ({
  database,
  fetchTableListLoading: loading.effects['database/fetchTableList'],
  fetchTenantLoading: loading.effects['database/handleSearchTenant'],
  saving: loading.effects['database/editDatabase'] || loading.effects['database/createDatabase'],
  tenantId: getCurrentOrganizationId(),
  isSiteFlag: !isTenantRoleLevel(),
}))
@formatterCollections({ code: ['hpfm.database'] })
export default class Database extends PureComponent {
  form;

  /**
   * state初始化
   */
  state = {
    formValues: {},
    tableRecord: {},
    visible: false,
    isCreate: false,
    establish: false, // 模态框状态是否为创建
  };

  /**
   * render()调用后获取数据
   */
  componentDidMount() {
    this.handleSearch();
  }

  /**
   * 查询
   * @param {object} fields - 查询参数
   */
  @Bind()
  handleSearch(fields = {}) {
    const { dispatch, tenantId } = this.props;
    const fieldValues = isUndefined(this.form)
      ? {}
      : filterNullValueObject(this.form.getFieldsValue());
    dispatch({
      type: 'database/fetchTableList',
      payload: {
        page: isEmpty(fields) ? {} : fields,
        ...fieldValues,
        tenantId,
      },
    });
  }

  /**
   * 获取表格中的记录
   *
   * @param {*} record
   * @memberof FormManage
   */
  @Bind()
  getRecordData(record) {
    const { dispatch } = this.props;
    dispatch({
      type: 'database/updateState',
      payload: { databaseId: record.databaseId, datasourceId: record.datasourceId },
    });
    this.setState({
      tableRecord: { ...record },
    });
    this.showEditModal(record.databaseId);
  }

  /**
   * 保存表单中的值
   *
   * @param {*} values
   * @memberof FormManage
   */
  @Bind()
  storeFormValues(values) {
    this.setState({
      formValues: { ...values },
    });
  }

  /**
   * 关闭模态框
   *
   * @memberof FormManage
   */
  @Bind()
  onCancel() {
    const { dispatch } = this.props;
    this.setState({
      visible: false,
      isCreate: false,
      tableRecord: {},
      establish: false,
    });
    dispatch({
      type: 'database/updateState',
      payload: { databaseId: undefined, datasourceId: undefined, tenantData: {} },
    });
  }

  /**
   * 打开新增模态框
   *
   * @memberof FormManage
   */
  @Bind()
  showModal() {
    this.setState({
      visible: true,
      isCreate: true,
      establish: true,
    });
  }

  /**
   * 打开编辑模态框
   *
   * @memberof FormManage
   */
  @Bind()
  showEditModal(databaseId) {
    const { isSiteFlag } = this.props;
    this.setState({
      visible: true,
      isCreate: false,
      establish: false,
    });
    if (isSiteFlag) {
      this.handleSearchTenant({ databaseId });
    }
  }

  /**
   *  新建数据库
   *
   * @param {*} values
   * @memberof FormManage
   */
  @Bind()
  handleAdd(values) {
    const {
      dispatch,
      isSiteFlag,
      database: { pagination },
    } = this.props;
    dispatch({
      type: 'database/createDatabase',
      payload: { ...values },
    }).then((res) => {
      if (res) {
        this.handleSearch(pagination);
        notification.success();
        this.setState({
          establish: false,
          isCreate: false,
          tableRecord: res,
        });
        if (!isSiteFlag) {
          this.onCancel();
        }
      }
    });
  }

  /**
   * 编辑数据库
   *
   * @param {*} values
   * @memberof FormManage
   */
  @Bind()
  handleEdit(values) {
    const {
      dispatch,
      tenantId,
      database: { pagination },
    } = this.props;
    dispatch({
      type: 'database/editDatabase',
      payload: { ...values, tenantId },
    }).then((res) => {
      if (res) {
        this.onCancel();
        this.handleSearch(pagination);
        notification.success();
        this.onCancel();
      }
    });
  }

  /**
   *  删除数据库
   *
   * @param {*} values
   * @memberof FormManage
   */
  @Bind()
  handleDelete(values) {
    const {
      dispatch,
      tenantId,
      database: { pagination },
    } = this.props;
    dispatch({
      type: 'database/deleteDatabase',
      payload: { ...values, tenantId },
    }).then((res) => {
      if (res) {
        this.handleSearch(pagination);
        notification.success();
      }
    });
  }

  /**
   * 查询租户
   *
   * @param {*} [fields={}]
   * @memberof Database
   */
  @Bind()
  handleSearchTenant(fields = {}) {
    const {
      dispatch,
      database: { databaseId },
    } = this.props;
    dispatch({
      type: 'database/handleSearchTenant',
      payload: {
        page: isUndefined(fields.databaseId) ? fields : {},
        databaseId: isUndefined(fields.databaseId) ? databaseId : fields.databaseId,
      },
    });
  }

  /**
   * 添加租户
   *
   * @param {*} value
   * @memberof Database
   */
  @Bind()
  handleTenantOk(value) {
    const {
      dispatch,
      database: { databaseId, datasourceId, tenantPagination },
    } = this.props;
    const { tenantId } = value;
    dispatch({
      type: 'database/selectTenantOk',
      payload: { databaseId, tenantId, datasourceId },
    }).then((res) => {
      if (res) {
        notification.success();
        this.handleSearchTenant({ tenantPagination });
      }
    });
  }

  /**
   * 删除租户
   *
   * @param {*} record
   * @memberof Database
   */
  @Bind()
  handleDeleteTenant(record) {
    const {
      dispatch,
      database: { tenantPagination },
    } = this.props;
    dispatch({
      type: 'database/handleDeleteTenant',
      payload: record,
    }).then((res) => {
      if (res) {
        notification.success();
        this.handleSearchTenant({ tenantPagination });
      }
    });
  }

  /**
   * 设置Form
   * @param {object} ref - FilterForm组件引用
   */
  @Bind()
  handleBindRef(ref = {}) {
    this.form = (ref.props || {}).form;
  }

  /**
   * render
   * @returns React.element
   */
  render() {
    const {
      fetchTableListLoading,
      fetchTenantLoading,
      saving,
      tenantId,
      match,
      database: {
        databaseData = {},
        tenantData = {},
        databaseId,
        datasourceId,
        pagination,
        tenantPagination,
      },
    } = this.props;
    const { formValues = {}, tableRecord = {}, isCreate, visible, establish } = this.state;
    const filterProps = {
      onSearch: this.handleSearch,
      storeFormValues: this.storeFormValues,
      onRef: this.handleBindRef,
    };
    const listProps = {
      match,
      formValues,
      databaseData,
      pagination,
      loading: fetchTableListLoading,
      onGetRecordData: this.getRecordData,
      onDelete: this.handleDelete,
      onChange: this.handleSearch,
    };
    const drawerProps = {
      match,
      tableRecord,
      visible,
      saving,
      isCreate,
      tenantId,
      tenantData,
      databaseId,
      establish,
      datasourceId,
      tenantPagination,
      loading: fetchTenantLoading,
      anchor: 'right',
      onCancel: this.onCancel,
      onAdd: this.handleAdd,
      onEdit: this.handleEdit,
      onTenantOk: this.handleTenantOk,
      onDeleteTenant: this.handleDeleteTenant,
      onChangeTenant: this.handleSearchTenant,
    };
    return (
      <React.Fragment>
        <Header title={intl.get('hpfm.database.view.message.title.database').d('数据库设置')}>
          <ButtonPermission
            icon="plus"
            type="primary"
            permissionList={[
              {
                code: `${match.path}.button.create`,
                type: 'button',
                meaning: '数据库设置-新建',
              },
            ]}
            onClick={() => {
              this.showModal({});
            }}
          >
            {intl.get('hzero.common.button.create').d('新建')}
          </ButtonPermission>
        </Header>
        <Content>
          <div>
            <FilterForm {...filterProps} />
          </div>
          <TableList {...listProps} />
        </Content>
        <Drawer {...drawerProps} />
      </React.Fragment>
    );
  }
}

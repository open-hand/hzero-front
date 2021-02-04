import React from 'react';
import { withRouter } from 'react-router';
import { Form, TextField, Switch, Select, Lov, Password, Spin, DataSet } from 'choerodon-ui/pro';
import { Bind } from 'lodash-decorators';

import intl from 'utils/intl';
import { isTenantRoleLevel } from 'utils/utils';

import { detailDs } from '../../stores/CallServerDS';

@withRouter
export default class Drawer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isSpin: false,
      dataSource: {},
      otherFields: [],
    };
    this.newDetailDs = new DataSet(detailDs());
  }

  async componentDidMount() {
    const { isCopy, currentEditData, otherFields, isEdit } = this.props;
    this.newDetailDs.create({});
    // 新建的时候也要传给父组件
    this.props.onTest(this.newDetailDs);
    if (isCopy) {
      this.newDetailDs.get(0).set('serverCode', currentEditData.serverCode);
      this.newDetailDs.get(0).set('serverName', currentEditData.serverName);
      this.newDetailDs.get(0).set('serverTypeCode', currentEditData.serverTypeCode);
      this.newDetailDs.get(0).set('serverId', currentEditData.serverId);
      this.newDetailDs.get(0).set('enabledFlag', currentEditData.enabledFlag);
      // 复制的时候传给父组件
      this.props.formConfigDs.setQueryParameter(
        'formCode',
        `HMSG.CALL.${currentEditData.serverTypeCode}`
      );
      this.props.formConfigDs.query().then((res) => {
        const newFields = res.map((item) => ({
          name: item.itemCode,
          label: item.itemName,
          type: 'string',
          required: item.requiredFlag === 1,
        }));
        const fields = [...detailDs.fields, ...newFields];
        const init = this.newDetailDs.toData()[0];
        this.newDetailDs = new DataSet({
          ...detailDs(),
          fields,
        });
        this.newDetailDs.create(init);
        this.props.onTest(this.newDetailDs);
        this.setState({
          otherFields: res,
        });
      });
    }
    if (isEdit) {
      this.newDetailDs.setQueryParameter('serverId', currentEditData.serverId);
      await this.newDetailDs.query().then((res) => {
        if (res) {
          const ext = `${res.extParam}`;
          const dataSource = {
            ...res,
            ...JSON.parse(`${ext}`),
          };
          this.setState({
            dataSource,
            otherFields,
          });
        }
      });
      this.props.formConfigDs.setQueryParameter(
        'formCode',
        `HMSG.CALL.${currentEditData.serverTypeCode}`
      );
      this.props.formConfigDs.query().then((res) => {
        const newFields = res.map((item) => ({
          name: item.itemCode,
          label: item.itemName,
          type: 'string',
          required: item.requiredFlag === 1,
        }));
        const fields = [...detailDs.fields, ...newFields];
        this.newDetailDs = new DataSet({
          ...detailDs(),
          fields,
          data: [
            {
              ...this.state.dataSource,
            },
          ],
        });
        this.props.onTest(this.newDetailDs);
        this.setState({
          otherFields: res,
        });
      });
    }
  }

  @Bind()
  async handelChange(record) {
    const { isEdit } = this.props;
    this.props.formConfigDs.setQueryParameter('formCode', `HMSG.CALL.${record}`);
    this.props.formConfigDs.query().then((res) => {
      const newFields = res.map((item) => ({
        name: item.itemCode,
        label: item.itemName,
        type: 'string',
        required: item.requiredFlag === 1,
      }));
      const fields = [...detailDs.fields, ...newFields];
      const init = this.newDetailDs.toData()[0];
      this.newDetailDs = new DataSet({
        ...detailDs(),
        fields,
        // data: [
        //   {
        //     ...this.newDetailDs.toData()[0],
        //   },
        // ],
      });
      if (isEdit) {
        this.newDetailDs.loadData([init]);
      } else {
        this.newDetailDs.create(init);
      }
      this.props.onTest(this.newDetailDs);
      this.setState({
        otherFields: res,
      });
    });
  }

  render() {
    const { isEdit } = this.props;
    const { isSpin, otherFields } = this.state;
    return (
      <>
        <Spin spinning={isSpin}>
          <Form dataSet={this.newDetailDs} labelWidth={110}>
            {!isTenantRoleLevel() && <Lov name="tenantIdLov" disabled={isEdit} />}
            <TextField name="serverCode" disabled={isEdit} />
            <TextField name="serverName" />
            <Select name="serverTypeCode" onChange={this.handelChange} />
            <TextField name="accessKey" />
            <Password
              name="accessSecret"
              placeholder={intl.get('hzero.common.validation.notChange').d('未更改')}
            />
            {otherFields.map((item) => (
              <TextField name={item.itemCode} />
            ))}
            <Switch name="enabledFlag" />
          </Form>
        </Spin>
      </>
    );
  }
}

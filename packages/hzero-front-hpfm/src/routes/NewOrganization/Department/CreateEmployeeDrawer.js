/**
 * @since 2019-12-03
 * @author WT <tao13.wang@hand-china.com>
 * @copyright Copyright (c) 2019, Hand
 */

import React from 'react';
import { Form, SelectBox, Select, Button, Lov, TextField, Switch, DataSet } from 'choerodon-ui/pro';
import { Bind } from 'lodash-decorators';
import { WithCustomizeC7N as withCustomize } from 'components/Customize';
import intl from 'utils/intl';
import { getResponse } from 'utils/utils';

import { fetchEmployeeDetail } from '@/services/newOrganizationService';

const { Option } = Select;
@withCustomize({
  unitCode: ['HPFM.ORG_LIST.DEPARTMENT.EMPLOYEE.EDIT'],
})
export default class CreateEmployeeDrawer extends React.Component {
  componentDidMount() {
    const { type, employeeId, employeeFormDS, employeePositionFormDS } = this.props;
    if (type === 'edit') {
      fetchEmployeeDetail({
        employeeId,
        customizeUnitCode: 'HPFM.ORG_LIST.DEPARTMENT.EMPLOYEE.EDIT',
      }).then((data) => {
        const {
          list = [],
          name = '',
          gender = '',
          enabledFlag = '',
          mobile = '',
          email = '',
          employeeCode = '',
          status = '',
          objectVersionNumber,
          _token,
        } = data;
        const partTimeList = list
          .filter((item) => item.primaryPositionFlag === 0)
          .map((record) => ({
            partTimePositionId: record.positionId,
            unitId: record.unitId,
            unitName: record.unitName,
          }));
        const { unitId, unitName, positionId } = list.filter(
          (item) => item.primaryPositionFlag === 1
        )[0];
        employeeFormDS.loadData([
          {
            employeeId,
            name,
            gender,
            enabledFlag,
            mobile,
            email,
            employeeCode,
            status,
            unitId,
            unitName,
            positionId,
            objectVersionNumber,
            _token,
          },
        ]);
        employeePositionFormDS.loadData(partTimeList);
        employeePositionFormDS.map((record) => {
          record.getField('partTimePositionId').setLovPara('unitId', unitId);
          record
            .getField('partTimePositionId')
            .fetchLookup()
            .then((res) => {
              if (res && getResponse(res)) {
                record.getField('partTimePositionId').set(
                  'options',
                  new DataSet({
                    selection: 'single',
                    data: res,
                    paging: false,
                  })
                );
              }
              this.setState({});
            });
          return true;
        });
        employeeFormDS.current.getField('positionId').setLovPara('unitId', unitId);
        employeeFormDS.current
          .getField('positionId')
          .fetchLookup()
          .then((res) => {
            if (res && getResponse(res)) {
              employeeFormDS.current.getField('positionId').set(
                'options',
                new DataSet({
                  selection: 'single',
                  data: res,
                  paging: false,
                })
              );
            }
            this.setState({});
          });
      });
    } else {
      employeeFormDS.create({});
    }
  }

  @Bind()
  addPartTimePosition() {
    const { employeePositionFormDS } = this.props;
    employeePositionFormDS.create({});
    this.setState({});
  }

  @Bind()
  dataChange(item) {
    item.set('partTimePositionId', '');
    item.getField('partTimePositionId').setLovPara('unitId', item.get('unitId'));
    item
      .getField('partTimePositionId')
      .fetchLookup()
      .then((res) => {
        if (res && getResponse(res)) {
          item.getField('partTimePositionId').set(
            'options',
            new DataSet({
              selection: 'single',
              data: res,
              paging: false,
            })
          );
        }
      });
  }

  @Bind()
  positionFormItem() {
    const { employeePositionFormDS } = this.props;
    const { records } = employeePositionFormDS;
    return [
      ...records.map((item) => [
        <Lov
          record={item}
          label={intl.get('hpfm.organization.model.department.partTimeDepartment').d('兼职部门')}
          name="partTimeDepartmentLov"
          onChange={() => {
            this.dataChange(item);
          }}
        />,
        <Select
          record={item}
          label={intl.get('hpfm.organization.model.department.position').d('岗位')}
          name="partTimePositionId"
        />,
      ]),
    ];
  }

  @Bind()
  departmentLovChange() {
    const { employeeFormDS, employeePositionFormDS } = this.props;
    const { records } = employeePositionFormDS;
    employeeFormDS.current.set('positionId', '');
    employeePositionFormDS.remove(records);
    employeeFormDS.current
      .getField('positionId')
      .setLovPara('unitId', employeeFormDS.current.get('unitId'));
    employeeFormDS.current
      .getField('positionId')
      .fetchLookup()
      .then((res) => {
        if (res && getResponse(res)) {
          employeeFormDS.current.getField('positionId').set(
            'options',
            new DataSet({
              selection: 'single',
              data: res,
              paging: false,
            })
          );
        }
      });
  }

  render() {
    const { employeeFormDS, customizeForm, type } = this.props;
    const employeeCodeFlag = type !== 'create';
    return (
      <>
        {customizeForm(
          {
            code: 'HPFM.ORG_LIST.DEPARTMENT.EMPLOYEE.EDIT',
          },
          <Form dataSet={employeeFormDS}>
            <TextField name="employeeCode" disabled={employeeCodeFlag} />
            <TextField name="name" />
            <SelectBox name="gender" />
            <TextField name="mobile" />
            <TextField name="email" />
            <Lov name="departmentLov" onChange={this.departmentLovChange} />
            <Select name="positionId" />
            <SelectBox name="status">
              <Option value="ON">
                {intl.get('hpfm.organization.model.department.onPosition').d('在职')}
              </Option>
              <Option value="TRIAL">
                {intl.get('hpfm.organization.model.department.trial').d('试用')}
              </Option>
              <Option value="INTERNSHIP">
                {intl.get('hpfm.organization.model.department.practice').d('实习')}
              </Option>
              <Option value="LEAVE">
                {intl.get('hpfm.organization.model.department.leave').d('离职')}
              </Option>
            </SelectBox>
            <Switch name="enabledFlag" />
          </Form>
        )}
        <Form>
          {this.positionFormItem()}
          <Button funcType="flat" onClick={this.addPartTimePosition} icon="add" name="addPart">
            {intl.get('hpfm.organization.model.department.addPartTimeDepartment').d('添加兼职部门')}
          </Button>
        </Form>
      </>
    );
  }
}

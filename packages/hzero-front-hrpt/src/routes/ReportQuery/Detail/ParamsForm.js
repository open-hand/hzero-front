import React, { PureComponent } from 'react';
import { Form, Input, Spin, Row, Col, Button, DatePicker, InputNumber } from 'hzero-ui';
import { Bind } from 'lodash-decorators';
import moment from 'moment';

import Checkbox from 'components/Checkbox';
import Lov from 'components/Lov';
import ValueList from 'components/ValueList';

import intl from 'utils/intl';
import { getDateTimeFormat, getCurrentOrganizationId } from 'utils/utils';

import styles from './index.less';

const organizationId = getCurrentOrganizationId();
/**
 * Form.Item 组件label、wrapper长度比例划分
 */
const formLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

/**
 * 数据集查询表单
 * @extends {PureComponent} - React.PureComponent
 * @reactProps {Function} onSearch - 查询
 * @reactProps {Object} form - 表单对象
 * @return React.element
 */
@Form.create({ fieldNameProp: null })
export default class FilterForm extends PureComponent {
  constructor(props) {
    super(props);
    props.onRef(this);
    this.state = {
      dateTimeFormat: getDateTimeFormat(),
      expandForm: false,
    };
  }

  @Bind()
  toggleForm() {
    const { expandForm } = this.state;
    this.setState({
      expandForm: !expandForm,
    });
  }

  // 表单重置
  @Bind()
  handleReset() {
    const { form } = this.props;
    form.resetFields();
  }

  getCurrentComponent(item) {
    const { dateTimeFormat } = this.state;
    let component;
    switch (item.type) {
      case 'Lov': // Lov
        component = (
          <Lov
            code={item.valueSource}
            originTenantId={organizationId}
            style={{ width: `${item.width}px`, height: `${item.height}px` }}
          />
        );
        break;
      case 'Input': // 文本
        component = <Input style={{ width: `${item.width}px`, height: `${item.height}px` }} />;
        break;
      case 'Checkbox': // 勾选框
        component = <Checkbox />;
        break;
      case 'Select': // 下拉框
        component = item.multipled ? (
          <ValueList
            mode="multiple"
            style={{ width: `${item.width}px`, height: `${item.height}px` }}
            options={item.value}
            allowClear={!item.isRequired}
          />
        ) : (
          <ValueList
            style={{ width: `${item.width}px`, height: `${item.height}px` }}
            options={item.value}
            allowClear={!item.isRequired}
          />
        );
        break;
      case 'DatePicker': // 日期选择框
        component = (
          <DatePicker
            style={{ width: `${item.width}px`, height: `${item.height}px` }}
            placeholder=""
            format={this.props.dateFormat}
          />
        );
        break;
      case 'DatetimePicker': // 日期时间选择框
        component = (
          <DatePicker
            style={{ width: `${item.width}px`, height: `${item.height}px` }}
            showTime
            placeholder=""
            format={dateTimeFormat}
          />
        );
        break;
      case 'InputNumber': // 数字框
        component = (
          <InputNumber style={{ width: `${item.width}px`, height: `${item.height}px` }} />
        );
        break;
      default:
        component = <Input style={{ width: `${item.width}px`, height: `${item.height}px` }} />;
        break;
    }
    return component;
  }

  // 渲染参数组件
  @Bind()
  renderParamGroup(paramList = []) {
    const {
      form: { getFieldDecorator },
      dateFormat,
    } = this.props;
    return paramList.map((item) => {
      let { defaultValue } = item;
      if (item.type === 'Select' || item.type === 'Lov') {
        const newValue = Array.isArray(item.value) ? item.value : item.value.split(',');
        const defaultFlag = newValue.some((items) => items.value === item.defaultValue);
        if (item.multipled) {
          defaultValue = item.defaultValue && defaultFlag ? item.defaultValue.split(',') : [];
        }
        defaultValue = defaultFlag ? item.defaultValue : undefined;
      } else if (item.type === 'Checkbox') {
        defaultValue = item.defaultValue ? parseInt(item.defaultValue, 10) : undefined;
      } else if (item.type === 'DatePicker') {
        defaultValue = item.defaultValue ? moment(item.defaultValue, dateFormat) : undefined;
      }

      return (
        <Col span={8} key={item.name}>
          <Form.Item label={item.text} {...formLayout} style={{ margin: 0 }}>
            {getFieldDecorator(`${item.name}`, {
              initialValue: defaultValue,
              rules: [
                {
                  required: item.formElement === 'Checkbox' ? false : item.isRequired !== 0,
                  message: intl
                    .get('hzero.common.validation.notNull', {
                      name: item.text,
                    })
                    .d(`${item.text}不能为空`),
                },
              ],
            })(this.getCurrentComponent(item))}
          </Form.Item>
        </Col>
      );
    });
  }

  /**
   * render
   * @returns React.element
   */
  render() {
    const { fetchParamsLoading, formElements = [] } = this.props;
    const { expandForm } = this.state;
    return (
      <>
        {/* <Divider orientation="left">{intl.get('hrpt.reportQuery.view.message.reportParams').d('报表参数')}</Divider> */}
        {formElements.length !== 0 && (
          <div className={styles['model-title']}>
            {intl.get('hrpt.reportQuery.view.message.reportParams').d('报表参数')}
          </div>
        )}
        <Spin spinning={fetchParamsLoading}>
          {formElements.length > 3 ? (
            <>
              <Row type="flex" gutter={24}>
                <Col span={18}>{this.renderParamGroup(formElements.slice(0, 3))}</Col>
                {formElements.length !== 0 && (
                  <Col span={6}>
                    <div style={{ marginTop: 5 }}>
                      <Button onClick={this.toggleForm} style={{ marginRight: 10 }}>
                        {expandForm
                          ? intl.get('hzero.common.button.collected').d('收起查询')
                          : intl.get('hzero.common.button.viewMore').d('更多查询')}
                      </Button>
                      <Button onClick={this.handleReset}>
                        {intl.get('hzero.common.button.reset').d('重置')}
                      </Button>
                    </div>
                  </Col>
                )}
              </Row>
              <Row type="flex" gutter={24} style={{ display: expandForm ? '' : 'none' }}>
                <Col span={18}>{this.renderParamGroup(formElements.slice(3))}</Col>
              </Row>
            </>
          ) : (
            <Row type="flex" gutter={24}>
              <Col span={18}>{this.renderParamGroup(formElements)}</Col>

              {formElements.length !== 0 && (
                <Col span={6}>
                  <Form.Item>
                    <Button onClick={this.handleReset}>
                      {intl.get('hzero.common.button.reset').d('重置')}
                    </Button>
                  </Form.Item>
                </Col>
              )}
            </Row>
          )}
        </Spin>
      </>
    );
  }
}

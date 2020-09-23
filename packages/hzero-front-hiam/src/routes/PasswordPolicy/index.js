/**
 * passwordPolicy - 安全策略
 * @date: 2018-11-6
 * @author: CJ <juan.chen01@hand-china.com>
 * @version: 0.0.1
 * @copyright Copyright (c) 2018, Hand
 */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Button,
  Col,
  Collapse,
  Form,
  Icon,
  Input,
  InputNumber,
  Row,
  Spin,
  Switch,
  Tooltip,
} from 'hzero-ui';
import { Bind } from 'lodash-decorators';
import { isEmpty, isString } from 'lodash';
import classnames from 'classnames';
import { PASSWORD } from 'utils/regExp';

import { Content, Header } from 'components/Page';
import { Button as ButtonPermission } from 'components/Permission';

import {
  DETAIL_DEFAULT_CLASSNAME,
  EDIT_FORM_ITEM_LAYOUT,
  EDIT_FORM_ROW_LAYOUT,
  FORM_COL_3_LAYOUT,
} from 'utils/constants';
import intl from 'utils/intl';
import formatterCollections from 'utils/intl/formatterCollections';
import notification from 'utils/notification';
import { getCurrentOrganizationId } from 'utils/utils';

const FormItem = Form.Item;
const { Panel } = Collapse;

@connect(({ passwordPolicy, loading }) => ({
  passwordPolicy,
  fetchTableListLoading: loading.effects['passwordPolicy/fetchPasswordPolicyList'],
  saving: loading.effects['passwordPolicy/updatePasswordPolicy'],
  organizationId: getCurrentOrganizationId(),
}))
@Form.create({ fieldNameProp: null })
@formatterCollections({ code: ['hiam.passwordPolicy'] })
export default class PasswordPolicy extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      collapseKeys: ['passwordPolicy', 'loginPolicy'],
    };
  }

  componentDidMount() {
    this.fetchPasswordPolicyList();
  }

  /**
   * onCollapseChange - 折叠面板onChange
   * @param {Array<string>} collapseKeys - Panels key
   */
  @Bind()
  onCollapseChange(collapseKeys) {
    this.setState({
      collapseKeys,
    });
  }

  /**
   * 获取表单数据
   */
  @Bind()
  fetchPasswordPolicyList() {
    const { dispatch, organizationId, form } = this.props;
    form.resetFields();
    dispatch({
      type: 'passwordPolicy/fetchPasswordPolicyList',
      payload: organizationId,
    });
  }

  /**
   * 更新密码策略
   */
  @Bind()
  handleSave() {
    const {
      dispatch,
      form,
      passwordPolicy: { passwordPolicyList = {} },
    } = this.props;
    form.validateFields((err, values) => {
      if (isEmpty(err)) {
        dispatch({
          type: 'passwordPolicy/updatePasswordPolicy',
          payload: { ...passwordPolicyList, ...values },
        }).then((res) => {
          if (res) {
            // dispatch({
            //   type: 'passwordPolicy/updateState',
            //   payload: { passwordPolicyList: res },
            // });
            this.fetchPasswordPolicyList();
            notification.success();
          }
        });
      }
    });
  }

  /**
   * 密码到期天数input框的自定义校验条件
   * @param {object} rules
   * @param {number} value - 设置密码到期提醒的天数
   * @param {function} callback
   * @returns
   * @memberof PasswordPolicy
   */
  @Bind()
  expireRemindCheck(rules, value, callback) {
    const {
      form: { getFieldValue },
    } = this.props;
    const passwordUpdateRate = getFieldValue('passwordUpdateRate') || 0;
    if (value > passwordUpdateRate) {
      return false;
    }
    callback();
  }

  /**
   * 密码安全策略表单
   */
  renderPasswordForm() {
    const {
      form: { getFieldDecorator, getFieldValue },
      passwordPolicy: { passwordPolicyList = {} },
    } = this.props;
    return (
      <Form>
        <Row {...EDIT_FORM_ROW_LAYOUT} className="writable-row">
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.originalPassword')
                .d('新用户默认密码')}
            >
              {getFieldDecorator('originalPassword', {
                rules: [
                  {
                    required: true,
                    message: intl.get('hzero.common.validation.notNull', {
                      name: intl.get('hiam.subAccount.model.user.password').d('密码'),
                    }),
                  },
                  {
                    pattern: PASSWORD,
                    message: intl
                      .get('hzero.common.validation.password')
                      .d('至少包含数字/字母/字符2种组合,长度至少为6个字符'),
                  },
                ],
                initialValue: passwordPolicyList.originalPassword,
              })(<Input />)}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.passwordUpdateRate')
                .d('密码更新频率')}
            >
              {getFieldDecorator('passwordUpdateRate', {
                rules: [
                  {
                    required: true,
                    message: intl.get('hzero.common.validation.notNull', {
                      name: intl
                        .get('hiam.passwordPolicy.model.passwordPolicy.passwordUpdateRate')
                        .d('密码更新频率'),
                    }),
                  },
                ],
                initialValue: passwordPolicyList.passwordUpdateRate,
              })(
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  formatter={(value) => {
                    const regex = /\D/g; // 匹配除数字外的所有字符
                    const v = isString(value) ? value.replace(regex, '') : value;
                    return `${v} ${intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.day')
                      .d('天')}`;
                  }}
                />
              )}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.pwdReminderPeriod')
                .d('密码到期提醒')}
            >
              {getFieldDecorator('passwordReminderPeriod', {
                rules: [
                  {
                    required: true,
                    message: intl.get('hzero.common.validation.notNull', {
                      name: intl
                        .get('hiam.passwordPolicy.model.passwordPolicy.pwdReminderPeriod')
                        .d('密码到期提醒'),
                    }),
                  },
                  {
                    validator: this.expireRemindCheck,
                    message: intl
                      .get('hiam.passwordPolicy.view.validation.pwdExpiredRemindMsg')
                      .d('密码到期提醒天数不能大于密码更新频率天数'),
                  },
                ],
                initialValue: passwordPolicyList.passwordReminderPeriod,
              })(
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  formatter={(value) => {
                    const regex = /\D/g; // 匹配除数字外的所有字符
                    const v = isString(value) ? value.replace(regex, '') : value;
                    return `${v} ${intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.dayAgo')
                      .d('天前')}`;
                  }}
                />
              )}
            </FormItem>
          </Col>
        </Row>
        <Row {...EDIT_FORM_ROW_LAYOUT} className="writable-row">
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.minLength')
                .d('最小密码长度')}
            >
              {getFieldDecorator('minLength', {
                initialValue: passwordPolicyList.minLength,
                rules: [
                  {
                    required: true,
                    message: intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.minLength')
                      .d('最小密码长度'),
                  },
                ],
              })(
                <InputNumber
                  style={{ width: '100%' }}
                  min={6}
                  precision={0}
                  max={getFieldValue('maxLength')}
                />
              )}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.maxLength')
                .d('最大密码长度')}
            >
              {getFieldDecorator('maxLength', {
                initialValue: passwordPolicyList.maxLength,
                rules: [
                  {
                    required: true,
                    message: intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.maxLength')
                      .d('最大密码长度'),
                  },
                ],
              })(
                <InputNumber
                  style={{ width: '100%' }}
                  min={getFieldValue('minLength')}
                  precision={0}
                  max={30}
                />
              )}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.digitsCount')
                .d('最少数字数')}
            >
              {getFieldDecorator('digitsCount', {
                initialValue: passwordPolicyList.digitsCount,
                rules: [
                  {
                    required: true,
                    message: intl.get('hzero.common.validation.notNull', {
                      name: intl
                        .get('hiam.passwordPolicy.model.passwordPolicy.digitsCount')
                        .d('最少数字数'),
                    }),
                  },
                ],
              })(<InputNumber style={{ width: '100%' }} min={0} precision={0} />)}
            </FormItem>
          </Col>
        </Row>
        <Row {...EDIT_FORM_ROW_LAYOUT} className="writable-row">
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.lowercaseCount')
                .d('最少小写字母数')}
            >
              {getFieldDecorator('lowercaseCount', {
                initialValue: passwordPolicyList.lowercaseCount,
                rules: [
                  {
                    required: true,
                    message: intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.lowercaseCount')
                      .d('最少小写字母数'),
                  },
                ],
              })(<InputNumber style={{ width: '100%' }} min={0} precision={0} />)}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.uppercaseCount')
                .d('最少大写字母数')}
            >
              {getFieldDecorator('uppercaseCount', {
                initialValue: passwordPolicyList.uppercaseCount,
                rules: [
                  {
                    required: true,
                    message: intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.uppercaseCount')
                      .d('最少大写字母数'),
                  },
                ],
              })(<InputNumber style={{ width: '100%' }} min={0} precision={0} />)}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.specialCharCount')
                .d('最少特殊字符数')}
            >
              {getFieldDecorator('specialCharCount', {
                initialValue: passwordPolicyList.specialCharCount,
                rules: [
                  {
                    required: true,
                    message: intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.specialCharCount')
                      .d('最少特殊字符数'),
                  },
                ],
              })(<InputNumber style={{ width: '100%' }} min={0} precision={0} />)}
            </FormItem>
          </Col>
        </Row>
        <Row {...EDIT_FORM_ROW_LAYOUT} className="writable-row">
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={
                <span>
                  {intl
                    .get('hiam.passwordPolicy.model.passwordPolicy.notRecentCount')
                    .d('近期密码')}
                  &nbsp;
                  <Tooltip
                    title={intl
                      .get('hiam.subAccount.view.message.notRecentCount.tooltip')
                      .d('近期密码不能作为更新密码')}
                  >
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              }
            >
              {getFieldDecorator('notRecentCount', {
                initialValue: passwordPolicyList.notRecentCount,
              })(<InputNumber style={{ width: '100%' }} min={0} />)}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.notUsername')
                .d('允许与登录名相同')}
            >
              {getFieldDecorator('notUsername', { initialValue: passwordPolicyList.notUsername })(
                <Switch />
              )}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.forceModifyPassword')
                .d('强制修改初始密码')}
            >
              {getFieldDecorator('forceModifyPassword', {
                initialValue: passwordPolicyList.forceModifyPassword,
              })(<Switch />)}
            </FormItem>
          </Col>
        </Row>
        <Row {...EDIT_FORM_ROW_LAYOUT} className="writable-row">
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl.get('hzero.common.status.enable').d('启用')}
            >
              {getFieldDecorator('enablePassword', {
                initialValue: passwordPolicyList.enablePassword,
              })(<Switch />)}
            </FormItem>
          </Col>
        </Row>
      </Form>
    );
  }

  /**
   * 登录安全策略表单
   */
  renderLoginForm() {
    const {
      form: { getFieldDecorator, getFieldValue },
      passwordPolicy: { passwordPolicyList = {} },
    } = this.props;
    return (
      <Form>
        <Row {...EDIT_FORM_ROW_LAYOUT}>
          <Row {...EDIT_FORM_ROW_LAYOUT}>
            <Col {...FORM_COL_3_LAYOUT}>
              <FormItem
                {...EDIT_FORM_ITEM_LAYOUT}
                label={intl
                  .get('hiam.passwordPolicy.model.passwordPolicy.enableCaptcha')
                  .d('启用图形验证码')}
              >
                {getFieldDecorator('enableCaptcha', {
                  initialValue: passwordPolicyList.enableCaptcha,
                })(<Switch />)}
              </FormItem>
            </Col>
            <Col {...FORM_COL_3_LAYOUT}>
              <FormItem
                {...EDIT_FORM_ITEM_LAYOUT}
                label={
                  <span>
                    {intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.maxErrorTime')
                      .d('最大密码错误次数')}
                    &nbsp;
                    <Tooltip
                      title={intl
                        .get('hiam.passwordPolicy.view.message.maxErrorTime.tooltip')
                        .d('登录时密码错误超过最大密码错误次数将锁定用户')}
                    >
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </span>
                }
              >
                {getFieldDecorator('maxErrorTime', {
                  initialValue: passwordPolicyList.maxErrorTime,
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    min={getFieldValue('maxCheckCaptcha')}
                    precision={0}
                  />
                )}
              </FormItem>
            </Col>

            <Col {...FORM_COL_3_LAYOUT}>
              <FormItem
                {...EDIT_FORM_ITEM_LAYOUT}
                label={
                  <span>
                    {intl
                      .get('hiam.passwordPolicy.model.passwordPolicy.maxCheckCaptcha')
                      .d('验证码错误次数')}
                    &nbsp;
                    <Tooltip
                      title={intl
                        .get('hiam.passwordPolicy.view.message.maxCheckCaptcha.tooltip')
                        .d('登录时密码错误超过开启验证码的密码错误次数将显示图像验证码')}
                    >
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </span>
                }
              >
                {getFieldDecorator('maxCheckCaptcha', {
                  initialValue: passwordPolicyList.maxCheckCaptcha,
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={getFieldValue('maxErrorTime')}
                    precision={0}
                  />
                )}
              </FormItem>
            </Col>
          </Row>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.enableLock')
                .d('允许锁定用户')}
            >
              {getFieldDecorator('enableLock', { initialValue: passwordPolicyList.enableLock })(
                <Switch />
              )}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={
                <span>
                  {intl
                    .get('hiam.passwordPolicy.model.passwordPolicy.lockedExpireTime')
                    .d('锁定时长')}
                  &nbsp;
                  <Tooltip
                    title={intl
                      .get('hiam.passwordPolicy.view.message.lockedExpireTime.tooltip')
                      .d('用户锁定时间超过锁定时长将自动解锁')}
                  >
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              }
            >
              {getFieldDecorator('lockedExpireTime', {
                initialValue: passwordPolicyList.lockedExpireTime,
              })(
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  formatter={(value) =>
                    `${value}${intl.get('hiam.passwordPolicy.model.passwordPolicy.second').d('秒')}`
                  }
                />
              )}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.enableWebLogin')
                .d('PC端允许多处登录')}
            >
              {getFieldDecorator('enableWebMultipleLogin', {
                initialValue: passwordPolicyList.enableWebMultipleLogin,
              })(<Switch />)}
            </FormItem>
          </Col>
          <Col {...FORM_COL_3_LAYOUT}>
            <FormItem
              {...EDIT_FORM_ITEM_LAYOUT}
              label={intl
                .get('hiam.passwordPolicy.model.passwordPolicy.enableAppLogin')
                .d('移动端允许多处登录')}
            >
              {getFieldDecorator('enableAppMultipleLogin', {
                initialValue: passwordPolicyList.enableAppMultipleLogin,
              })(<Switch />)}
            </FormItem>
          </Col>
        </Row>
      </Form>
    );
  }

  render() {
    const {
      saving,
      fetchTableListLoading,
      match: { path },
    } = this.props;
    const { collapseKeys = [] } = this.state;
    return (
      <>
        <Header title={intl.get('hiam.passwordPolicy.view.message.title').d('安全策略')}>
          <ButtonPermission
            permissionList={[
              {
                code: `${path}.button.save`,
                type: 'button',
                meaning: '密码策略-保存',
              },
            ]}
            type="primary"
            icon="save"
            onClick={this.handleSave}
            loading={saving || fetchTableListLoading}
          >
            {intl.get('hzero.common.button.save').d('保存')}
          </ButtonPermission>
          <Button icon="sync" onClick={this.fetchPasswordPolicyList}>
            {intl.get('hzero.common.button.reload').d('重新加载')}
          </Button>
        </Header>
        <Content>
          <Spin
            spinning={fetchTableListLoading}
            wrapperClassName={classnames(DETAIL_DEFAULT_CLASSNAME)}
          >
            <Collapse
              className="form-collapse"
              defaultActiveKey={['passwordPolicy', 'loginPolicy']}
              onChange={this.onCollapseChange}
            >
              <Panel
                showArrow={false}
                header={
                  <>
                    <h3>
                      {intl
                        .get('hiam.passwordPolicy.view.message.subTitle.passwordPolicy')
                        .d('密码安全策略')}
                    </h3>
                    <a>
                      {collapseKeys.includes('passwordPolicy')
                        ? intl.get(`hzero.common.button.up`).d('收起')
                        : intl.get(`hzero.common.button.expand`).d('展开')}
                    </a>
                    <Icon type={collapseKeys.includes('passwordPolicy') ? 'up' : 'down'} />
                  </>
                }
                key="passwordPolicy"
              >
                {this.renderPasswordForm()}
              </Panel>
              <Panel
                showArrow={false}
                header={
                  <>
                    <h3>
                      {intl
                        .get('hiam.passwordPolicy.view.message.subTitle.loginPolicy')
                        .d('登录安全策略')}
                    </h3>
                    <a>
                      {collapseKeys.includes('loginPolicy')
                        ? intl.get(`hzero.common.button.up`).d('收起')
                        : intl.get(`hzero.common.button.expand`).d('展开')}
                      <Icon type={collapseKeys.includes('loginPolicy') ? 'up' : 'down'} />
                    </a>
                  </>
                }
                key="loginPolicy"
              >
                {this.renderLoginForm()}
              </Panel>
            </Collapse>
          </Spin>
        </Content>
      </>
    );
  }
}

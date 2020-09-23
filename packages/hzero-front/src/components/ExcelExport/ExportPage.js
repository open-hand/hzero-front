/**
 * ExportPage - 导出界面 - 将导出界面从 index.js 中提取出来
 * @author WY <yang.wang06@hand-china.com>
 * @date 2019/9/27
 * @copyright 2019/9/27 © HAND
 */

import React, { Component } from 'react';
import { Col, Divider, Form, InputNumber, Row, Select, Spin, Tree, Input } from 'hzero-ui';

import intl from 'utils/intl';

import './index.less';

export default class ExportPage extends Component {
  render() {
    const {
      exportTypeList,
      exportList,
      fetchColumnLoading,
      formItemLayout,
      queryFormItem,
      form,
      checkedKeys,
      expandedKeys,
      renderQueryForm,
      renderTreeNodes,
      onExpand,
      onSelect,
      enableAsync,
      exportAsync = false,
    } = this.props;
    return (
      <Spin spinning={fetchColumnLoading}>
        <>
          <Form>
            <Row>
              <Col span={12}>
                <Form.Item
                  {...formItemLayout}
                  label={intl.get(`hzero.common.components.export.file`).d('自定义文件名')}
                >
                  {form.getFieldDecorator('fileName', {})(<Input />)}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  {...formItemLayout}
                  label={intl.get(`hzero.common.components.export.type`).d('导出类型')}
                >
                  {form.getFieldDecorator('fillerType', {
                    initialValue:
                      exportTypeList.length > 0 ? exportTypeList[0].value : 'single-sheet',
                  })(
                    <Select>
                      {exportTypeList.map((item) => (
                        <Select.Option value={item.value} key={item.value}>
                          {item.meaning}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Form.Item
                  {...formItemLayout}
                  label={intl.get(`hzero.common.components.export.async`).d('异步')}
                >
                  {form.getFieldDecorator('async', {
                    initialValue: 'false',
                  })(
                    <Select disabled={!exportAsync || !enableAsync}>
                      <Select.Option value="false" key="false">
                        {intl.get('hzero.common.status.no').d('否')}
                      </Select.Option>
                      <Select.Option value="true" key="true">
                        {intl.get('hzero.common.status.yes').d('是')}
                      </Select.Option>
                    </Select>
                  )}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  {...formItemLayout}
                  label={intl.get(`hzero.common.components.export.maxSheet`).d('最大sheet页')}
                >
                  {form.getFieldDecorator(
                    'singleExcelMaxSheetNum',
                    {}
                  )(<InputNumber min={1} precision={0} style={{ width: '114px' }} />)}
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Form.Item
                  {...formItemLayout}
                  label={intl
                    .get(`hzero.common.components.export.singleSheet`)
                    .d('单sheet最大数量')}
                >
                  {form.getFieldDecorator(
                    'singleSheetMaxRow',
                    {}
                  )(<InputNumber min={1} precision={0} style={{ width: '114px' }} />)}
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </>
        <Divider />
        {queryFormItem && (
          <>
            <div style={{ margin: '12px auto' }}>
              {intl.get(`hzero.common.components.export.condition`).d('设置导出条件')}
            </div>
            {renderQueryForm()}
          </>
        )}
        <div style={{ margin: '12px auto' }}>
          {intl.get(`hzero.common.components.export.columns`).d('选择要导出的列')}
        </div>
        <Tree
          checkable
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          defaultExpandedKeys={expandedKeys}
          onCheck={onSelect}
          checkedKeys={checkedKeys}
        >
          {renderTreeNodes(exportList)}
        </Tree>
      </Spin>
    );
  }
}

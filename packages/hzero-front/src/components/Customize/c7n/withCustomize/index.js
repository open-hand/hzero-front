import React from 'react';
import { Bind } from 'lodash-decorators';
import { isEmpty, isArray, omit, isNil } from 'lodash';
import { DataSet, Table, Output } from 'choerodon-ui/pro';
import moment from 'moment';
import { Spin } from 'choerodon-ui';
import template from 'utils/template';
import {
  queryUnitCustConfig,
  getComponent,
  coverConfig,
  parseProps,
  transformCompProps,
  getFieldValueObject,
  selfValidator,
} from './customizeTool';

export default function withCustomize({ unitCode = [], query, manualQuery = false } = {}) {
  return (Component) => {
    class WrapIndividual extends React.Component {
      constructor(props, ...args) {
        super(props, ...args);
        this.state = {
          custConfig: {},
          loading: true,
          cacheType: {},
          cacheTable: {},
          dataMap: new Map(),
          arrayDataMap: {},
          lastUpdateUnit: '',
        };
      }

      @Bind()
      setDataMap(code, value) {
        this.state.dataMap.set(code, value);
      }

      @Bind()
      getDataValue(code) {
        return this.state.dataMap.get(code) || {};
      }

      @Bind()
      setArrayDataMap(code, value, index) {
        const { arrayDataMap } = this.state;
        if (!arrayDataMap[code]) {
          arrayDataMap[code] = new Map();
        }
        arrayDataMap[code].set(index, value);
      }

      @Bind()
      getArrayDataValue(code, index) {
        const { arrayDataMap } = this.state;
        if (!arrayDataMap[code]) {
          return {};
        }
        return arrayDataMap[code].get(index) || {};
      }

      @Bind()
      getCacheType(code) {
        return this.state.cacheType[code];
      }

      @Bind()
      getToolFuns() {
        return {
          setArrayDataMap: this.setArrayDataMap,
          getArrayDataValue: this.getArrayDataValue,
          setDataMap: this.setDataMap,
          getDataValue: this.getDataValue,
          getCacheType: this.getCacheType,
        };
      }

      componentDidMount() {
        if (manualQuery) {
          return;
        }
        this.queryUnitConfig();
      }

      @Bind()
      queryUnitConfig(params = query) {
        if (unitCode && isArray(unitCode) && unitCode.length > 0) {
          queryUnitCustConfig({ unitCode: unitCode.join(','), ...params })
            .then((res) => {
              if (res) {
                this.setState({
                  custConfig: res || {},
                });
              }
            })
            .finally(() => {
              this.setState({ loading: false });
            });
        } else {
          this.setState({ loading: false });
        }
      }

      @Bind()
      customizeForm(options = {}, form) {
        const proxyForm = form;
        const { custConfig = {}, loading = false, cacheType } = this.state;
        const { code = '', readOnly: readOnly1 } = options;
        const { dataSet = { data: [{}] } } = proxyForm.props;
        if (loading) {
          proxyForm.props.children = [];
        }
        if (!code || isEmpty(custConfig[code])) return form;
        const fieldMap = new Map();
        const formChildren = isArray(proxyForm.props.children)
          ? proxyForm.props.children
          : [proxyForm.props.children];
        formChildren.forEach((item, seq) => {
          if (item.props && item.props.name) {
            fieldMap.set(item.props.name, { item, seq });
          }
        });
        const tools = { ...this.getToolFuns(), code };
        // TODO: c7n不支持字段宽度配置
        const { maxCol = 3, fields = [], unitAlias = [], readOnly: readOnly2 } = custConfig[code];
        const readOnly = readOnly1 || readOnly2;
        const current = dataSet.current || { toData: () => ({}) };
        this.setDataMap(code, current.toData());
        const unitData = getFieldValueObject(unitAlias, this.getToolFuns(), code);
        if (!cacheType[code]) {
          // dataSet.tlsUrl = 'hpfm//v1/multi-language';
          cacheType[code] = 'form';
          dataSet.addEventListener(
            'update',
            ({ name, record, value }) => {
              const ds = dataSet.get(0) || { toData: () => ({}) };
              const data = ds.toData();
              this.setDataMap(code, data);
              fields.forEach((item) => {
                const {
                  conditionHeaderDTOs = [],
                  fieldCode,
                  lovMappings = [],
                  conValidDTO = {},
                } = item;
                const newFieldConfig = getFieldConfig({
                  required: item.required,
                  editable: item.editable,
                  ...coverConfig(conditionHeaderDTOs, tools, ['visible']),
                });
                const validators = selfValidator(conValidDTO, tools);
                const oldFieldConfig = (dataSet.getField(fieldCode) || {}).pristineProps;
                dataSet.addField(fieldCode, {
                  ...oldFieldConfig,
                  ...newFieldConfig,
                  ...validators,
                  ...parseProps(
                    omit(item, [
                      'width',
                      'fieldName',
                      'fieldCode',
                      'fixed',
                      'renderOptions',
                      'conditionHeaderDTOs',
                    ]),
                    tools,
                    oldFieldConfig
                  ),
                });
                if (lovMappings.length > 0 && name === fieldCode && typeof value === 'object') {
                  lovMappings.forEach((i) => {
                    record.set(i.targetCode, value[i.sourceCode]);
                  });
                }
              });
              this.setState({ lastUpdateUnit: `${code}${name}` });
            },
            false
          );
          dataSet.addEventListener(
            'load',
            () => {
              fields.forEach((item) => {
                const { conditionHeaderDTOs = [], fieldCode, conValidDTO = {} } = item;
                const data = (dataSet.current && dataSet.current.toData()) || {};
                this.setDataMap(code, data);
                const newFieldConfig = getFieldConfig({
                  required: item.required,
                  editable: item.editable,
                  ...coverConfig(conditionHeaderDTOs, tools, ['visible']),
                });
                const validators = selfValidator(conValidDTO, tools);
                const oldFieldConfig = (dataSet.getField(fieldCode) || {}).pristineProps;
                dataSet.addField(fieldCode, {
                  ...oldFieldConfig,
                  ...newFieldConfig,
                  ...validators,
                  ...parseProps(
                    omit(item, [
                      'width',
                      'fieldName',
                      'fieldCode',
                      'fixed',
                      'renderOptions',
                      'conditionHeaderDTOs',
                    ]),
                    this.getToolFuns(),
                    oldFieldConfig
                  ),
                });
              });
              this.setState({ lastUpdateUnit: `load${code}` });
            },
            false
          );
        }
        const proxyFields = [];
        const tempFields = fields.filter((i) => {
          const originSeq = fieldMap[i.fieldName] && fieldMap[i.fieldName].seq;
          if ((i.formRow === undefined || i.formCol === undefined) && originSeq === undefined) {
            return true;
          }
          const seq = i.formRow * maxCol + i.formCol;
          proxyFields.push({ ...i, seq: typeof seq === 'number' ? seq : originSeq });
          return false;
        });
        proxyFields.sort((p, n) => p.seq - n.seq);
        let newChildren = [];
        proxyFields.concat(tempFields).forEach((item) => {
          const {
            fieldCode,
            fieldName,
            renderOptions,
            conditionHeaderDTOs,
            renderRule,
            colSpan,
            conValidDTO = {},
            ...otherProps
          } = item;
          const oldChild = fieldMap.get(fieldCode);
          const {
            visible = item.visible,
            required = item.required,
            editable = item.editable,
          } = coverConfig(conditionHeaderDTOs, tools);
          const validators = selfValidator(conValidDTO, tools);
          const newFieldConfig = getFieldConfig({
            visible,
            required,
            editable,
          });
          if (fieldName !== undefined) {
            newFieldConfig.label = fieldName;
          }
          const oldFieldConfig = (dataSet.getField(fieldCode) || {}).pristineProps;
          dataSet.addField(fieldCode, {
            ...oldFieldConfig,
            ...newFieldConfig,
            ...validators,
            ...parseProps(otherProps, tools, oldFieldConfig),
          });
          if (visible !== 0 && visible !== undefined) {
            // 做新增扩展字段处理
            if (!oldChild && visible !== -1) {
              if (readOnly || renderOptions === 'TEXT') {
                const outputProps = {
                  name: fieldCode,
                  label: fieldName,
                  colSpan,
                };
                if (item.fieldType === 'DATE_PICKER') {
                  outputProps.renderer = ({ value }) =>
                    value && moment(value).format(item.dateFormat);
                }
                if (!isNil(renderRule)) {
                  const renderer = () => (
                    // eslint-disable-next-line react/no-danger
                    <div
                      dangerouslySetInnerHTML={{ __html: template.render(renderRule, unitData) }}
                    />
                  );
                  newChildren.push(<Output {...outputProps} renderer={renderer} />);
                } else {
                  newChildren.push(<Output {...outputProps} />);
                }
              } else {
                newChildren.push(
                  getComponent(item.fieldType, { currentData: dataSet.toData() })({
                    name: fieldCode,
                    label: fieldName,
                    ...transformCompProps(otherProps),
                  })
                );
              }
            } else if (oldChild) {
              if (item.editable !== -1) {
                oldChild.item.props.disabled = !item.editable;
              }
              if (colSpan) {
                oldChild.item.props.colSpan = colSpan;
              }
              if (item.placeholder !== undefined) {
                oldChild.item.props.placeholder = item.placeholder;
              }
              newChildren.push(oldChild.item);
            }
          }
          fieldMap.delete(fieldCode);
        });
        if (dataSet.all.length === 0) {
          dataSet.create();
        }
        newChildren = newChildren.concat(Array.from(fieldMap.values()).map((i) => i.item));
        proxyForm.props.children = newChildren;
        proxyForm.props.columns = maxCol;
        return form;
      }

      @Bind()
      customizeTable(options = {}, table) {
        const { custConfig = {}, loading = false, cacheType } = this.state;
        const { code = '', filterCode = '', readOnly: readOnly1 } = options;
        const { dataSet = {} } = table.props;
        let { columns = [] } = table.props;
        const fieldMap = new Map(); // 记录已配置的字段
        columns.forEach((item) => {
          fieldMap.set(item.name, item);
        });
        if (!code || isEmpty(custConfig[code])) {
          return table;
        }
        if (loading) {
          return (
            <Spin spinning={this.state.loading}>
              <Table dataSet={new DataSet()} columns={[]} />
            </Spin>
          );
        }
        const unitConfig = custConfig[code] || {};
        const { unitAlias = [], pageSize, fields = [], readOnly: readOnly2 } = unitConfig;
        const readOnly = readOnly1 | readOnly2;
        let { queryFieldsLimit } = table.props;
        const queryFields = {};
        if (dataSet.toData) {
          const newData = dataSet.toData() || [];
          newData.forEach((item, index) => {
            this.setArrayDataMap(code, item, index);
          });
        }
        const tools = this.getToolFuns();
        const unitData = getFieldValueObject(unitAlias, tools);
        if (!isEmpty(custConfig[filterCode])) {
          const { fields: filterFields = [], maxCol, unitAlias: unitFilterAlias = [] } = custConfig[
            filterCode
          ];
          filterFields.sort((before, after) => before.seq - after.seq);
          const { queryDataSet = {} } = dataSet.props;
          let reCreateDs = isEmpty(queryDataSet);
          if (!cacheType[filterCode]) {
            cacheType[filterCode] = 'form';
            if (!reCreateDs && !queryDataSet.reCreateDs) {
              queryDataSet.addEventListener(
                'load',
                ({ record, value, name }) => {
                  this.setDataMap(filterCode, record.toData());
                  filterFields.forEach((item) => {
                    const { fieldCode, lovMappings = [] } = item;
                    if (lovMappings.length > 0 && name === fieldCode && typeof value === 'object') {
                      lovMappings.forEach((i) => {
                        record.set(i.targetCode, value[i.sourceCode]);
                      });
                    }
                  });
                  this.setState({ lastUpdateUnit: `${filterCode}${name}` });
                },
                false
              );
            }
          }
          const searchFields = []; // 用于重新创建ds
          const oldQueryFieldsMap = {};
          const oldQueryFields = queryDataSet.fields;
          if (!isEmpty(oldQueryFields)) {
            const fieldObj = oldQueryFields.toJSON();
            Object.keys(fieldObj).forEach((i) => {
              oldQueryFieldsMap[i] = fieldObj[i].pristineProps;
            });
          }
          filterFields.forEach((item) => {
            const { fieldCode, fieldName, renderOptions, visible, renderRule, ...others } = item;
            const oldConfig = oldQueryFieldsMap[fieldCode];
            const config = { ...oldConfig, name: fieldCode };
            Object.assign(config, parseProps(item, tools, oldConfig), getFieldConfig(item));
            if (fieldName !== undefined) {
              config.label = fieldName;
            }
            const noOldElement = !oldQueryFieldsMap[fieldCode] && visible === 1;
            // 排除代码中不存在且显示属性为-1的情况
            const updateConfig = (oldQueryFieldsMap[fieldCode] && visible !== 0) || noOldElement;
            if (updateConfig) {
              searchFields.push(config);
            }
            if (!reCreateDs && updateConfig) {
              queryDataSet.addField(fieldCode, config);
            }
            if (noOldElement) {
              if (renderOptions === 'TEXT') {
                if (!isNil(renderRule)) {
                  const renderer = () => {
                    const unitFilterData = getFieldValueObject(unitFilterAlias, tools, filterCode);
                    // eslint-disable-next-line react/no-danger
                    return (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: template.render(renderRule, unitFilterData),
                        }}
                      />
                    );
                  };
                  queryFields[fieldCode] = (
                    <Output name={fieldCode} label={fieldName} renderer={renderer} />
                  );
                } else {
                  queryFields[fieldCode] = <Output name={fieldCode} label={fieldName} />;
                }
              } else {
                queryFields[fieldCode] = getComponent(item.fieldType, {
                  currentData: reCreateDs ? {} : queryDataSet.toData(),
                })(transformCompProps(others));
              }
              // eslint-disable-next-line no-param-reassign
              table.props.queryFields = { ...table.props.queryFields, ...queryFields };
            }
            if (oldQueryFieldsMap[fieldCode] && visible === 0) {
              reCreateDs = true;
            }
            delete oldQueryFieldsMap[fieldCode];
          });
          const events = {
            update: ({ record, value, name }) => {
              this.setDataMap(filterCode, record.toData());
              filterFields.forEach((item) => {
                const { fieldCode, lovMappings = [] } = item;
                if (lovMappings.length > 0 && name === fieldCode && typeof value === 'object') {
                  lovMappings.forEach((i) => {
                    record.set(i.targetCode, value[i.sourceCode]);
                  });
                }
              });
              this.setState({ lastUpdateUnit: `${filterCode}${name}` });
            },
          };
          if (reCreateDs) {
            dataSet.queryDataSet = new DataSet({
              fields: searchFields.concat(Object.values(oldQueryFieldsMap)),
              events,
            });
            dataSet.queryDataSet.reCreateDs = true;
          }
          if (dataSet.queryDataSet.all.length === 0) {
            dataSet.queryDataSet.create();
          }
          if (!dataSet.queryDataSet.customize) {
            dataSet.queryDataSet.reset();
          }
          dataSet.queryDataSet.customize = true;
          queryFieldsLimit = maxCol;
        }
        if (pageSize) {
          dataSet.pageSize = pageSize;
        }
        if (!cacheType[code]) {
          cacheType[code] = 'table';
          dataSet.addEventListener(
            'update',
            ({ record, value, name }) => {
              this.setArrayDataMap(code, record.toData(), record.index);
              fields.forEach((item) => {
                const {
                  conditionHeaderDTOs = [],
                  fieldCode,
                  lovMappings = [],
                  conValidDTO = {},
                } = item;
                const {
                  required = item.required,
                  editable = item.editable,
                } = coverConfig(conditionHeaderDTOs, { ...tools, index: record.index, code }, [
                  'visible',
                ]);
                const newFieldConfig = getFieldConfig({
                  required,
                  editable,
                });
                const validators = selfValidator(conValidDTO, {
                  ...this.getToolFuns(),
                  index: record.index,
                  code,
                });
                const oldFieldConfig = (record.getField(fieldCode) || {}).pristineProps;
                record.addField(fieldCode, {
                  ...oldFieldConfig,
                  ...newFieldConfig,
                  ...parseProps(
                    omit(item, [
                      'width',
                      'fieldName',
                      'fieldCode',
                      'fixed',
                      'renderOptions',
                      'conditionHeaderDTOs',
                    ]),
                    { ...tools, index: record.index, code },
                    oldFieldConfig
                  ),
                  ...validators,
                });
                if (lovMappings.length > 0 && name === fieldCode && typeof value === 'object') {
                  lovMappings.forEach((i) => {
                    record.set(i.targetCode, value[i.sourceCode]);
                  });
                }
              });
              this.setState({ lastUpdateUnit: `${code}${name}` });
            },
            false
          );

          dataSet.addEventListener(
            'load',
            ({ dataSet: ds }) => {
              (ds.records || []).forEach((item, index) => {
                this.setArrayDataMap(code, item.toData(), item.index);
                fields.forEach((i) => {
                  const { conditionHeaderDTOs = [], fieldCode, conValidDTO = {} } = i;
                  const {
                    required = i.required,
                    editable = i.editable,
                  } = coverConfig(conditionHeaderDTOs, { ...tools, index, code }, ['visible']);
                  const newFieldConfig = getFieldConfig({
                    required,
                    editable,
                  });
                  const validators = selfValidator(conValidDTO, {
                    ...tools,
                    index,
                    code,
                  });
                  const oldFieldConfig = (item.getField(fieldCode) || {}).pristineProps;
                  item.addField(fieldCode, {
                    ...oldFieldConfig,
                    ...newFieldConfig,
                    ...parseProps(
                      omit(i, [
                        'width',
                        'fieldName',
                        'fieldCode',
                        'fixed',
                        'renderOptions',
                        'conditionHeaderDTOs',
                      ]),
                      { ...tools, index, code },
                      oldFieldConfig
                    ),
                    ...validators,
                  });
                });
              });
              this.setState({ lastUpdateUnit: `load${code}` });
            },
            false
          );
        }
        if (fields && fields.length > 0) {
          // 根据列顺序属性排序
          fields.sort((before, after) => before.seq - after.seq);
          // 左固定前置， 右固定后置
          const leftFixedColumns = fields.filter((item) => item.fixed === 'L');
          const rightFixedColumns = fields.filter((item) => item.fixed === 'R');
          const centerFixedColumns = fields.filter(
            (item) => item.fixed !== 'L' && item.fixed !== 'R'
          );
          const newFields = leftFixedColumns.concat(centerFixedColumns).concat(rightFixedColumns);
          const newColumns = [];
          newFields.forEach((item) => {
            const {
              width,
              fieldName,
              fieldCode,
              fixed,
              renderOptions,
              conditionHeaderDTOs,
              renderRule,
              conValidDTO = {},
              fieldType,
            } = item;
            const oldCol = fieldMap.get(fieldCode);
            if (!oldCol && item.visible === -1) return;
            const {
              visible = item.visible,
              required = item.required,
              editable = item.editable,
            } = coverConfig(conditionHeaderDTOs, { ...tools, code }, ['editable', 'required']);
            const newFieldConfig = getFieldConfig({
              visible,
              required,
              editable,
            }); // ds配置覆盖
            const validators = selfValidator(conValidDTO, { ...tools, code });
            const newColumnsConfig = {
              name: fieldCode,
              ...getColumnsConfig({
                fixed,
                width,
                visible,
              }),
            };
            // 原表格columns配置覆盖
            if (fieldName !== undefined) {
              newFieldConfig.label = fieldName;
              newColumnsConfig.header = fieldName;
            }
            if (oldCol && oldCol.header) {
              if (typeof oldCol.header === 'function') {
                newColumnsConfig.header = (records, name) =>
                  oldCol.header(records, fieldName, name);
              } else if (typeof oldCol.header === 'object') {
                newColumnsConfig.header = oldCol.header;
              }
            }
            const oldFieldConfig = (dataSet.getField(fieldCode) || {}).pristineProps;
            dataSet.addField(fieldCode, {
              ...oldFieldConfig,
              ...newFieldConfig,
              ...parseProps(item, tools, oldFieldConfig),
              ...validators,
            });
            if (!oldCol) {
              const formFieldGen = (record) =>
                getComponent(item.fieldType, { currentData: record.toData() })(
                  transformCompProps(item)
                );
              newColumnsConfig.editor = false;
              if (readOnly || renderOptions === 'TEXT') {
                if (!isNil(renderRule)) {
                  newColumnsConfig.renderer = (line) => (
                    // eslint-disable-next-line react/no-danger
                    <div
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{
                        __html: template.render(renderRule, {
                          ...unitData,
                          self: line.record.toData(),
                        }),
                      }}
                    />
                  );
                } else if (fieldType === 'DATE_PICKER') {
                  newColumnsConfig.renderer = ({ value }) =>
                    value && moment(value).format(item.dateFormat);
                }
              } else if (fieldType === 'LINK') {
                newColumnsConfig.renderer = (line) => formFieldGen(line.record);
              } else {
                newColumnsConfig.editor = formFieldGen;
              }
            }
            fieldMap.delete(fieldCode);
            newColumns.push({
              ...oldCol,
              ...newColumnsConfig,
            });
          });
          // 代码中而配置中没有的字段
          columns = newColumns.concat(Array.from(fieldMap.values()));
        }
        const proxyTableProps = table.props || {};
        proxyTableProps.columns = columns;
        proxyTableProps.queryFieldsLimit = queryFieldsLimit;
        return table;
      }

      @Bind()
      customizeVTable(options = {}, table) {
        const { custConfig = {}, loading = false, cacheType, cacheTable } = this.state;
        const { code = '', dataSet = {}, readOnly: readOnly1 } = options;
        const { columns = [] } = table.props;
        const fieldMap = {}; // 记录已配置的字段
        if (!code || isEmpty(custConfig[code])) {
          return table;
        }
        if (loading) {
          return (
            <Spin spinning={this.state.loading}>
              <Table dataSet={new DataSet()} columns={[]} />
            </Spin>
          );
        }
        const unitConfig = custConfig[code] || {};
        const { unitAlias = [], fields = [], readOnly: readOnly2 } = unitConfig;
        const tools = this.getToolFuns();
        const unitData = getFieldValueObject(unitAlias, tools);
        let updateColumns = false;
        if (!cacheType[code]) {
          cacheType[code] = 'table';
          (dataSet.toData() || []).newData.forEach((item, index) => {
            this.setArrayDataMap(code, item, index);
          });
          dataSet.addEventListener(
            'update',
            ({ record, value, name }) => {
              this.setArrayDataMap(code, record.toData(), record.index);
              fields.forEach((item) => {
                const {
                  conditionHeaderDTOs = [],
                  fieldCode,
                  lovMappings = [],
                  conValidDTO = {},
                } = item;
                const {
                  required = item.required,
                  editable = item.editable,
                } = coverConfig(conditionHeaderDTOs, { ...tools, index: record.index, code }, [
                  'visible',
                ]);
                const newFieldConfig = getFieldConfig({
                  required,
                  editable,
                });
                const validators = selfValidator(conValidDTO, {
                  ...this.getToolFuns(),
                  index: record.index,
                  code,
                });
                const oldFieldConfig = (record.getField(fieldCode) || {}).pristineProps;
                record.addField(fieldCode, {
                  ...oldFieldConfig,
                  ...newFieldConfig,
                  ...parseProps(
                    omit(item, [
                      'width',
                      'fieldName',
                      'fieldCode',
                      'fixed',
                      'renderOptions',
                      'conditionHeaderDTOs',
                    ]),
                    { ...tools, index: record.index, code },
                    oldFieldConfig
                  ),
                  ...validators,
                });
                if (lovMappings.length > 0 && name === fieldCode && typeof value === 'object') {
                  lovMappings.forEach((i) => {
                    record.set(i.targetCode, value[i.sourceCode]);
                  });
                }
              });
              this.setState({ lastUpdateUnit: `${code}${name}` });
            },
            false
          );

          dataSet.addEventListener(
            'load',
            ({ dataSet: ds }) => {
              (ds.records || []).forEach((item, index) => {
                this.setArrayDataMap(code, item.toData(), item.index);
                fields.forEach((i) => {
                  const { conditionHeaderDTOs = [], fieldCode, conValidDTO = {} } = i;
                  const {
                    required = i.required,
                    editable = i.editable,
                  } = coverConfig(conditionHeaderDTOs, { ...tools, index, code }, ['visible']);
                  const newFieldConfig = getFieldConfig({
                    required,
                    editable,
                  });
                  const validators = selfValidator(conValidDTO, {
                    ...tools,
                    index,
                    code,
                  });
                  const oldFieldConfig = (item.getField(fieldCode) || {}).pristineProps;
                  item.addField(fieldCode, {
                    ...oldFieldConfig,
                    ...newFieldConfig,
                    ...parseProps(
                      omit(i, [
                        'width',
                        'fieldName',
                        'fieldCode',
                        'fixed',
                        'renderOptions',
                        'conditionHeaderDTOs',
                      ]),
                      { ...tools, index, code },
                      oldFieldConfig
                    ),
                    ...validators,
                  });
                });
              });
              this.setState({ lastUpdateUnit: `load${code}` });
            },
            false
          );
        }
        if (!cacheTable[code]) {
          cacheTable[code] = {
            columns: [],
            hiddenFields: [],
          };
          updateColumns = true;
        } else {
          const hiddenFields = cacheTable[code].columns;
          fields.forEach((item) => {
            const { fieldCode, conditionHeaderDTOs } = item;
            const { visible = item.visible } = coverConfig(
              conditionHeaderDTOs,
              { ...tools, code },
              ['editable', 'required']
            );
            if (visible === 0 && !hiddenFields.includes(fieldCode)) updateColumns = true;
          });
        }
        cacheTable[code].unitData = unitData;
        columns.forEach((item) => {
          fieldMap[item.dataIndex] = item;
        });
        if (updateColumns) {
          const readOnly = readOnly1 | readOnly2;
          cacheTable[code].hiddenFields = [];
          // 根据列顺序属性排序
          fields.sort((before, after) => before.seq - after.seq);
          let newColumns = [];
          fields.forEach((item) => {
            const {
              width,
              fieldName,
              fieldCode,
              fixed,
              renderOptions,
              conditionHeaderDTOs,
              renderRule,
              conValidDTO = {},
              fieldType,
            } = item;
            const oldCol = fieldMap[fieldCode];
            const { visible = item.visible } = coverConfig(
              conditionHeaderDTOs,
              { ...tools, code },
              ['editable', 'required']
            );
            if (!oldCol && item.visible === -1) return;
            if (visible === 0) {
              cacheTable[code].hiddenFields.push(fieldCode);
              return;
            }
            const newFieldConfig = getFieldConfig({
              visible,
            }); // ds配置覆盖
            const validators = selfValidator(conValidDTO, { ...tools, code });
            const newColumnsConfig = {
              dataIndex: fieldCode,
              key: fieldCode,
              resizable: true,
              ...getColumnsConfig({
                fixed,
                width,
                visible,
              }),
            };
            // 原表格columns配置覆盖
            if (fieldName !== undefined) {
              newFieldConfig.label = fieldName;
              newColumnsConfig.title = fieldName;
            }
            const oldFieldConfig = (dataSet.getField(fieldCode) || {}).pristineProps;
            dataSet.addField(fieldCode, {
              ...oldFieldConfig,
              ...newFieldConfig,
              ...parseProps(item, tools, oldFieldConfig),
              ...validators,
            });
            if (!oldCol) {
              const formFieldGen = ({ rowData, rowIndex, dataIndex }) => {
                const record = dataSet.get(rowIndex);
                return getComponent(item.fieldType, { currentData: rowData })({
                  ...transformCompProps(item),
                  name: dataIndex,
                  record,
                });
              };
              if (readOnly || renderOptions === 'TEXT') {
                if (!isNil(renderRule)) {
                  newColumnsConfig.render = ({ rowIndex }) => (
                    // eslint-disable-next-line react/no-danger
                    <div
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{
                        __html: template.render(renderRule, {
                          ...cacheTable[code].unitData,
                          self: dataSet.get(rowIndex).toData(),
                        }),
                      }}
                    />
                  );
                } else if (fieldType === 'DATE_PICKER') {
                  newColumnsConfig.renderer = ({ rowData, dataIndex }) =>
                    rowData[dataIndex] && moment(rowData[dataIndex]).format(item.dateFormat);
                }
              } else {
                newColumnsConfig.render = formFieldGen;
              }
            }

            delete fieldMap[fieldCode];
            newColumns.push({
              ...oldCol,
              ...newColumnsConfig,
            });
          });
          // 代码中而配置中没有的字段
          newColumns = newColumns.concat(Object.values(fieldMap));
          // 左固定前置， 右固定后置
          const leftFixedColumns = [];
          const rightFixedColumns = [];
          const centerFixedColumns = [];
          newColumns.forEach((item) => {
            if (item.fixed === 'left' || item.fixed === true) {
              leftFixedColumns.push(item);
            } else if (item.fixed === 'right') {
              rightFixedColumns.push(item);
            } else {
              centerFixedColumns.push(item);
            }
          });
          cacheTable[code].columns = leftFixedColumns
            .concat(centerFixedColumns)
            .concat(rightFixedColumns);
        }

        return React.cloneElement(table, { columns: cacheTable[code].columns });
      }

      @Bind()
      customizeCollapse(options = {}, collapse) {
        const { code } = options;
        const { configModel: config, loading } = this.state;
        if (loading) return null;
        if (!code || isEmpty(config[code])) return collapse;
        const { fields = [] } = config[code];
        fields.sort((p, n) => (p.seq === undefined || n.seq === undefined ? -1 : p.seq - n.seq));
        const childrenMap = {};
        const newChildren = [];
        const refTabs = collapse;
        const refChildren = refTabs.props.children;
        const tools = this.getToolFuns();
        if (isArray(refChildren)) {
          refChildren.forEach((i) => {
            if (i.props && i.key !== undefined) {
              childrenMap[i.key] = i;
            }
          });
        } else if (refChildren && refChildren.props && refChildren.key) {
          childrenMap[refChildren.key] = refChildren;
        }
        fields.forEach((i) => {
          const { fieldName, fieldCode, conditionHeaderDTOs } = i;
          const { visible } = {
            visible: i.visible,
            ...coverConfig(conditionHeaderDTOs, tools, ['required', 'editable']),
          };
          const targetPane = childrenMap[fieldCode];
          if (fieldName !== undefined && targetPane.props) {
            const oldHeader = targetPane.props.header;
            if (typeof oldHeader === 'function') {
              targetPane.props.header = oldHeader(fieldName);
            } else {
              targetPane.props.header = <h3>{fieldName}</h3>;
            }
          }
          if (visible !== 0) {
            newChildren.push(targetPane);
          }
          delete childrenMap[fieldCode];
        });
        Object.keys(childrenMap).forEach((i) => newChildren.push(childrenMap[i]));
        refTabs.props.children = newChildren;
        return collapse;
      }

      @Bind()
      customizeTabPane(options = {}, tabs) {
        const { code } = options;
        const { custConfig: config, loading } = this.state;
        if (loading) return null;
        if (!code || isEmpty(config[code])) return tabs;
        const { fields = [] } = config[code];
        fields.sort((p, n) => (p.seq === undefined || n.seq === undefined ? -1 : p.seq - n.seq));
        const childrenMap = {};
        const newChildren = [];
        const refTabs = tabs;
        const refChildren = refTabs.props.children;
        const tools = this.getToolFuns();
        if (isArray(refChildren)) {
          refChildren.forEach((i) => {
            if (i.props && i.key !== undefined) {
              childrenMap[i.key] = i;
            }
          });
        } else if (refChildren && refChildren.props && refChildren.key) {
          childrenMap[refChildren.key] = refChildren;
        }
        fields.forEach((i) => {
          const { fieldName, fieldCode, conditionHeaderDTOs } = i;
          const { visible } = {
            visible: i.visible,
            ...coverConfig(conditionHeaderDTOs, tools, ['required', 'editable']),
          };
          const targetPane = childrenMap[fieldCode];
          if (fieldName !== undefined && targetPane.props) {
            targetPane.props.tab = fieldName;
          }
          if (visible !== 0) {
            newChildren.push(targetPane);
          }
          delete childrenMap[fieldCode];
        });
        Object.keys(childrenMap).forEach((i) => newChildren.push(childrenMap[i]));
        refTabs.props.children = newChildren;
        return tabs;
      }

      render() {
        const { loading = true, lastUpdateUnit } = this.state;
        const newProps = {
          ...this.props,
          custLoading: loading,
          lastUpdateUnit,
          customizeTable: this.customizeTable,
          customizeVTable: this.customizeVTable,
          customizeForm: this.customizeForm,
          customizeTabPane: this.customizeTabPane,
          queryUnitConfig: this.queryUnitConfig,
        };

        return <Component {...newProps} ref={this.props.forwardRef} />;
      }
    }
    return React.forwardRef((props, ref) => <WrapIndividual {...props} forwardRef={ref} />);
  };
}

function getFieldConfig({ required, editable, visible }) {
  const newFieldConfig = { visible };
  if (required !== -1) {
    newFieldConfig.required = !!required;
  }

  if (visible === 0) {
    newFieldConfig.required = false;
  }

  if (editable !== -1 && !isNil(editable)) {
    newFieldConfig.disabled = !editable;
  }
  return newFieldConfig;
}
function getColumnsConfig({ visible, fixed, width }) {
  const newColumnsConfig = {};
  if (visible !== -1) {
    newColumnsConfig.hidden = !visible;
  }
  if (fixed === 'L') {
    newColumnsConfig.lock = 'left';
  } else if (fixed === 'R') {
    newColumnsConfig.lock = 'right';
  }
  if (width !== undefined) {
    newColumnsConfig.width = width;
  }
  return newColumnsConfig;
}

import React, { ReactNode } from 'react';
import { Form, Row, Col } from 'hzero-ui';
import { isNumber, isNil, omit } from 'lodash';
import {
  getRender,
  getFormItemComponent,
  preAdapterInitValue,
  traversalFormItems,
  adapterStandardFormIndividual,
  customizeFormRules,
  coverConfig,
  adjustRowAndCol,
  getComputeComp,
  selfValidator,
} from './customizeTool';
import { UnitConfig, FieldConfig, FormItem } from './interfaces';

const fixedMap = {
  L: 'left',
  R: 'right',
};

export function generateFormSkeleton(rows = {}, config: UnitConfig = {}, options) {
  const {
    fields = [],
    readOnly: _readOnly2,
    maxCol = 3,
    labelCol: unitLabelCol = 9,
    wrapperCol: unitWrapperCol = 15,
  } = config;
  const allConfigFields: string[] = [];
  const newFields: FieldConfig[] = [];
  fields.forEach((i: FieldConfig) => {
    allConfigFields.push(i.fieldCode);
    newFields.push(i);
  });
  const {
    form,
    dataSource = {},
    getValueFromCache,
    code,
    className,
    unitData,
    readOnly: _readOnly1,
  } = options;
  const readOnly = _readOnly1 || _readOnly2;
  const parseRows = {};
  const tempItems: FormItem[] = []; // 存放位置冲突或者未配置位置的扩展字段的FormItem
  Object.keys(rows).forEach((i) => {
    if (!allConfigFields.includes(i)) {
      newFields.push({ fieldCode: i });
    }
  });
  const baseCol = Math.floor(24 / maxCol);
  newFields.forEach((i) => {
    const {
      conditionHeaderDTOs,
      fieldType,
      fieldCode,
      fieldName,
      formRow,
      formCol,
      textMaxLength,
      textMinLength,
      renderOptions,
      labelCol,
      wrapperCol,
      renderRule,
      conValidDTO,
      dateFormat,
      colSpan,
    } = i;
    const { required, visible, editable } = coverConfig(
      { required: i.required, visible: i.visible, editable: i.editable },
      conditionHeaderDTOs,
      { getValueFromCache, code }
    );
    if (visible === 0) {
      // eslint-disable-next-line no-unused-expressions
      if (renderOptions === 'WIDGET' && form) {
        form.getFieldDecorator(fieldCode, {
          initialValue: undefined,
          rules: [{ required: false }],
        });
      }
      return;
    }
    const selfRules = selfValidator(conValidDTO, { getValueFromCache, code });
    if (!rows[fieldCode]) {
      if (visible === -1) return; // 排除保留原有逻辑的显示控制
      const newRowProps = {
        className: 'writable-row',
        // individualProps.rowProps
      };
      const newColProps = {
        span: colSpan !== undefined ? baseCol * colSpan : baseCol,
        // individualProps.colProps
      };
      let formItem;
      const formOptions = {
        fieldType,
        required,
        textMaxLength,
        textMinLength,
        fieldName,
        selfRules,
        dateFormat,
      };
      const wrapProps = {
        label: fieldName,
        className: `cust-field-${fieldCode}`,
        labelCol: { span: labelCol || unitLabelCol },
        wrapperCol: { span: wrapperCol || unitWrapperCol },
      };
      if (!isNil(renderRule)) {
        formItem = getComputeComp(renderRule, { wrapProps, unitData });
      } else {
        formItem = getFormItemComponent(
          fieldType,
          renderOptions
        )({
          form,
          readOnly,
          fieldCode,
          formOptions,
          contentProps: {
            ...i,
            style: { width: '100%' },
            getValueFromCache,
            editable,
            unitLabelCol,
            unitWrapperCol,
            dataSource,
          },
          wrapProps,
        });
      }
      adjustRowAndCol(parseRows, formItem, {
        row: formRow,
        col: formCol,
        tempItems,
        rowProps: newRowProps,
        colProps: newColProps,
      });
    } else {
      adapterStandardFormIndividual(
        { ...i, editable, selfRules, required },
        rows[fieldCode],
        parseRows,
        {
          baseCol,
          form,
          unitLabelCol,
          unitWrapperCol,
          dataSource,
          tempItems,
        }
      );
    }
  });
  const configRows: any[] = Object.keys(parseRows).sort(
    (prev, next) => Number(prev) - Number(next)
  );
  const tempRowStart = Number(configRows[configRows.length > 0 ? configRows.length - 1 : 0]) + 1;
  tempItems.forEach((item, index) => {
    const row = Math.floor(index / maxCol) + tempRowStart;
    const col = index % maxCol;
    if (!parseRows[row]) {
      parseRows[row] = {
        rowProps: {},
        formItemList: [],
      };
      configRows.push(row);
    }
    parseRows[row].rowProps = item.rowProps;
    parseRows[row].formItemList[col] = {
      colProps: item.colProps,
      formItem: item.formItem,
    };
  });
  return (
    <Form className={className || 'writable-row-custom'}>
      {configRows.map((key) => (
        <Row gutter={48} {...parseRows[key].rowProps}>
          {
            // eslint-disable-next-line func-names
            (function (row) {
              const cols: ReactNode[] = [];
              const oldCols = row.formItemList;
              for (let i = 0; i < oldCols.length; i++) {
                if (!oldCols[i] && (row.rowProps.className || '').indexOf('half-row') === -1) {
                  cols.push(<Col span={Math.floor(24 / maxCol)} />);
                } else if (oldCols[i]) {
                  const { formItem, colProps } = oldCols[i];
                  cols.push(<Col {...colProps}>{formItem}</Col>);
                }
              }
              return cols;
            })(parseRows[key])
          }
        </Row>
      ))}
    </Form>
  );
}

export function generateTableColumns(
  columns,
  config: any = {},
  { unitData, code, getValueFromCache, readOnly: _readOnly1 }
) {
  const { fields = [], readOnly: _readOnly2 } = config;
  const readOnly = _readOnly1 || _readOnly2;
  let noWidthCount = 0;
  let noneStandardSeq = columns.length;
  let scrollWidth = 0;
  const configOrder: number[] = []; // 记录租户个性化的位置信息，个性化顺序优先级高于原有配置
  const individualColumns = {}; // 个性化处理后的列对象，key值为调整后的顺序
  const columnsObj = {};
  const noConfigColumns: number[] = [];
  const allConfigFields = fields.map((i) => i.fieldCode);
  columns.forEach((i, index) => {
    if (allConfigFields.includes(i.dataIndex)) {
      columnsObj[i.dataIndex] = index;
    } else {
      scrollWidth += i.width || 0;
      noConfigColumns.push(index);
    }
  });
  // 配置拆分
  fields.forEach((i) => {
    const {
      defaultValue,
      conditionHeaderDTOs = [],
      fieldCode,
      fieldType,
      fixed,
      fieldName,
      seq,
      sorter,
      textMaxLength,
      textMinLength,
      renderOptions,
      renderRule,
      conValidDTO = {},
      dateFormat,
    } = i;
    const { visible } = coverConfig(
      { visible: i.visible },
      conditionHeaderDTOs.filter((k) => k.conType === 'visible'),
      { getValueFromCache, isGridVisible: true, currentUnitCode: code }
    );
    if (visible === 0) return;
    if (columnsObj[i.fieldCode] !== undefined) {
      const oldItem = columns[columnsObj[i.fieldCode]];
      const oldRender = oldItem.render;
      const width = i.width === undefined ? oldItem.width : i.width;
      let order = columnsObj[i.fieldCode];
      if (isNumber(seq)) {
        configOrder.push(seq - 1);
        order = seq - 1;
      }
      if (isNumber(width)) {
        oldItem.width = width;
        scrollWidth += width;
      } else noWidthCount++;
      if (fixed) {
        oldItem.fixed = fixedMap[fixed];
      }
      if (fieldName) {
        oldItem.title = fieldName;
      }
      if (sorter) {
        oldItem.sorter = true;
      }
      oldItem.render = (val, record) => {
        let meaning = record[`${fieldCode}Meaning`];
        if (meaning === undefined) meaning = record[fieldCode];
        const { _status } = record;
        if (['update', 'create'].includes(_status) && oldRender) {
          const toolsObj = {
            isGrid: true,
            targetForm: record.$form,
            targetDataSource: record,
            getValueFromCache,
            currentUnitCode: code,
          };
          const { required, editable } = coverConfig(
            { required: i.required, editable: i.editable },
            conditionHeaderDTOs.filter((k) => k.conType !== 'visible'),
            toolsObj
          );
          const selfRules = selfValidator(conValidDTO, toolsObj);
          const rules = customizeFormRules({
            ...i,
            required,
            selfRules,
            fieldName: i.fieldName || oldItem.title,
          });
          let formItem = oldRender(val, record);
          formItem = isNil(formItem) ? {} : formItem;
          traversalFormItems(formItem, {
            ...omit(i, ['fieldName']),
            defaultValue: preAdapterInitValue(fieldType, defaultValue),
            rules,
            editable,
            form: record.$form,
            dataSource: record,
          } as any);
          return formItem;
        }
        return oldRender
          ? oldRender(val, record)
          : getRender(fieldType, { precision: i.numberPrecision })(
              fieldType === 'LOV' || fieldType === 'SELECT' ? meaning : val
            );
      };
      if (individualColumns[order] === undefined) {
        individualColumns[order] = [];
      }
      individualColumns[order].push(oldItem);
    } else {
      if (visible === -1) return;
      noneStandardSeq++;
      let order = noneStandardSeq;
      if (isNumber(i.width)) {
        scrollWidth += i.width;
      } else noWidthCount++;
      if (isNumber(seq)) {
        configOrder.push(seq - 1);
        order = seq - 1;
      }
      const render = (val, record) => {
        const { _status, $form } = record;
        let meaning = record[`${fieldCode}Meaning`];
        if (meaning === undefined) meaning = record[fieldCode];
        if (!isNil(renderRule) && (renderOptions !== 'WIDGET' || readOnly)) {
          return getComputeComp(renderRule, {
            isGrid: true,
            dataSource: record,
            unitData,
            form: $form,
          });
        }
        let selfRules = {};
        const wrapProps = {
          className: `cust-field-${fieldCode}`,
        };
        const formOptions: any = {
          fieldType,
          textMaxLength,
          textMinLength,
          fieldName,
          dateFormat,
        };
        let isEdit = false;
        const contentProps = {
          ...i,
          style: { width: '100%' },
          getValueFromCache,
          isGrid: true,
          dataSource: record,
        };
        const toolsObj = {
          isGrid: true,
          targetForm: $form,
          targetDataSource: record,
          getValueFromCache,
          currentUnitCode: code,
        };
        if (['update', 'create'].includes(_status)) {
          isEdit = true;
          const { required, editable } = coverConfig(
            { required: i.required, editable: i.editable },
            conditionHeaderDTOs.filter((k) => k.conType !== 'visible'),
            toolsObj
          );
          selfRules = selfValidator(conValidDTO, toolsObj);
          formOptions.required = required;
          formOptions.selfRules = selfRules;
          contentProps.editable = editable;
        }
        return getFormItemComponent(
          fieldType,
          renderOptions,
          code
        )({
          isEdit,
          readOnly,
          form: $form,
          defaultValue,
          formOptions,
          contentProps,
          fieldCode,
          wrapProps,
        });
      };
      if (individualColumns[order] === undefined) {
        individualColumns[order] = [];
      }
      individualColumns[order].push({
        width: i.width === undefined ? 200 : i.width,
        fixed: fixedMap[fixed],
        title: fieldName,
        sorter: !!sorter,
        dataIndex: fieldCode,
        render,
      });
    }
  });
  noConfigColumns.forEach((i) => {
    if (individualColumns[i] !== undefined) {
      individualColumns[i].push(columns[i]);
    } else {
      individualColumns[i] = [columns[i]];
    }
  });
  const left: any[] = [];
  const right: any[] = [];
  const normal: any[] = [];
  Object.keys(individualColumns)
    .sort((pre, next) => Number(pre || 0) - Number(next || 0))
    .forEach((key) => {
      const item = individualColumns[key];
      // eslint-disable-next-line eqeqeq
      if (key == undefined) {
        item.forEach((i) => {
          if (i.fixed === 'left') {
            left.unshift(i);
          } else if (i.fixed === 'right') {
            right.unshift(i);
          } else {
            normal.unshift(i);
          }
        });
      } else {
        item.forEach((i) => {
          if (i.fixed === 'left') {
            left.push(i);
          } else if (i.fixed === 'right') {
            right.push(i);
          } else {
            normal.push(i);
          }
        });
      }
    });
  if (normal.length > 0 && (left.length > 0 || right.length > 0)) {
    scrollWidth -= normal[normal.length - 1].width || 0;
    noWidthCount++;
    normal[normal.length - 1].width = undefined;
  }
  return {
    noWidthCount,
    scrollWidth,
    columns: left.concat(normal).concat(right),
  };
}

export function generateFilterForm(formMap = {}, fields: FieldConfig[] = [], options) {
  const { form, unitLabelCol = 10, unitWrapperCol = 14, unitData, getValueFromCache } = options;
  const individualField: any[] = []; // 个性化处理后的列对象，key值为调整后的顺序
  const allConfigFields: string[] = [];
  const newFields: FieldConfig[] = [];
  fields.forEach((i) => {
    allConfigFields.push(i.fieldCode);
    newFields.push(i);
  });
  Object.keys(formMap).forEach((i) => {
    if (!allConfigFields.includes(i)) {
      newFields.push({ fieldCode: i });
    }
  });
  newFields.sort((pre, next) => (pre.seq || 0) - (next.seq || 0));
  // 配置拆分
  newFields.forEach((i) => {
    const {
      fieldCode,
      fieldType,
      required,
      editable,
      fieldName,
      visible,
      textMaxLength,
      textMinLength,
      labelCol,
      wrapperCol,
      defaultValue,
      renderRule,
      renderOptions,
      dateFormat,
    } = i;
    if (visible === 0) {
      // eslint-disable-next-line no-unused-expressions
      form &&
        form.getFieldDecorator(fieldCode, {
          initialValue: undefined,
          rules: [{ required: false }],
        });
      return;
    }
    if (formMap[fieldCode] !== undefined) {
      const rules = customizeFormRules(i);
      traversalFormItems(formMap[fieldCode], {
        ...i,
        defaultValue: preAdapterInitValue(fieldType, defaultValue),
        rules,
        editable,
        form,
      });
      individualField.push(formMap[fieldCode]);
    } else {
      if (visible === -1) return;
      let formItem;
      if (!isNil(renderRule)) {
        formItem = getComputeComp(renderRule, { isGrid: true, unitData });
      } else {
        formItem = getFormItemComponent(
          fieldType,
          renderOptions
        )({
          form,
          fieldCode,
          formOptions: {
            fieldType,
            required,
            textMaxLength,
            textMinLength,
            fieldName,
            dateFormat,
          },
          contentProps: {
            ...i,
            style: { width: '100%' },
            getValueFromCache,
            editable,
          },
          wrapProps: {
            label: fieldName,
            labelCol: { span: labelCol || unitLabelCol },
            wrapperCol: { span: wrapperCol || unitWrapperCol },
          },
        });
      }
      individualField.push(formItem);
    }
  });
  return individualField;
}

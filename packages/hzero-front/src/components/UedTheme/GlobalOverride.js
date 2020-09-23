/*
 * 全局样式复写，覆盖就项目中的全局样式
 * 只作用于非默认主题，即非theme2 schema
 * */
import { css } from 'styled-components';
import { getRequiredData } from '@hzero-front-ui/cfg';

function getTopFormStyle(props) {
  const { layout, inputHeight } = getRequiredData(props, 'input');
  return css`
    .ant-form-inline .ant-form-item {
      min-width: ${layout === 'vertical' ? '' : '320px'};
    }
    .more-fields-search-form {
      .ant-form-item {
        margin-bottom: 0;
        padding-bottom: 8px;
      }
      .search-btn-more {
        margin-top: ${layout === 'vertical' ? `${inputHeight}px` : ''};
      }
    }
    .c7n-form-line-with-btn {
      .c7n-form-btn {
        padding-bottom: 8px;
      }
    }
    .ant-modal-wrap.lov-modal {
      .ant-form {
        > div:not(.ant-table-wrapper) {
          .lov-modal-btn-container {
            height: initial;
            margin-top: ${layout === 'vertical' ? `${inputHeight}px` : ''};
          }
        }
      }
    }
    /* Table 内嵌表单的布局适配 */
    .c7n-pro-table-wrapper {
      > div > div {
        .c7n-pro-form + div {
          padding-bottom: 8px;
          margin-left: 8px;
          margin-top: ${layout === 'vertical' ? inputHeight : 0}px !important;
        }
      }
    }
  `;
}

function getCss(props) {
  const { primary } = getRequiredData(props, 'colors');
  return css`
    .ant-input-group-addon .ant-select-open .ant-select-selection,
    .ant-input-group-addon .ant-select-focused .ant-select-selection {
      color: ${primary};
    }
    .ant-form-explain,
    .ant-form-extra {
      margin-top: 0;
    }
  `;
}

export default css`
  /* 适配Lov */
  .lov-modal .ant-form-item.ant-form-item {
    display: block;
    margin-bottom: 8px;
    margin-top: 0px;
  }
  body {
    ${getTopFormStyle};
    ${getCss};
    .ant-btn.ant-btn-circle {
      padding: 0;
    }
    .c7n-pro-select:focus {
      box-shadow: none;
    }
    .c7n-pro-table-content {
      overflow: visible;
    }
    /* .c7n-pro-form table tbody tr {
      td.c7n-pro-field-label,
      .c7n-pro-field-label {
        box-sizing: border-box;
        padding-right: 4px;
        :after {
          content: ':' !important;
          margin-right: 0;
          width: 8px;
          order: 2;
        }
      }
    } */
    .c7n-pro-table-cell-editable {
      padding: 0 16px !important;
    }
    .c7n-pro-form.c7n-pro-form-horizontal table tbody tr td .c7n-pro-field-wrapper {
      text-align: left;
    }
    .ant-form-item-label label:after {
      margin: 0;
    }
    .c7n-pro-select-suffix .icon-search:before {
      display: block;
      font-size: 12px;
      font-family: anticon, sans-serif !important;
      content: '\\E670' !important;
    }
    .ant-modal-wrap .ant-form-inline .ant-form-item {
      min-width: initial;
    }
    .c7n-select .c7n-select-arrow .icon-arrow_drop_down,
    .c7n-pro-select-suffix .icon-baseline-arrow_drop_down {
      line-height: 0;
      font-size: 1em;
      :before {
        font-family: anticon, sans-serif !important;
        content: '\\E61D' !important;
        display: inline;
      }
    }
    .ant-card.ued-detail-card > .ant-card-body .ant-form-item {
      margin-bottom: 16px;
    }
    .ant-card.ued-detail-card-table > .ant-card-body .ant-form-item {
      margin-bottom: 0;
    }
    /* [class$='-required']:not([disabled]):not([class$='-invalid']) input:not([disabled]) {
      background-color: rgba(0, 0, 0, 0) !important;
      border: none !important;
    } */
    .ant-input-affix-wrapper .ant-input-prefix,
    .ant-input-affix-wrapper .ant-input-suffix,
    .ant-form-item-required .lov-suffix:hover .ant-input-suffix {
      background: none;
    }
  }
`;

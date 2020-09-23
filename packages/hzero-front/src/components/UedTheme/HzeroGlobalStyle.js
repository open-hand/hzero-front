/**
 * 全局样式，作用于所有主题
 */
import { createGlobalStyle, css } from 'styled-components';
// 配置中心没有导入样式，这些在配置中心使用的组件的样式手动导入一下
import 'hzero-ui/lib/anchor/style';
import 'hzero-ui/lib/switch/style';
import 'hzero-ui/lib/slider/style';

const globalCss = css`
  body {
    .c7n-form-line-with-btn {
      display: flex;
      flex-direction: row;
      padding-bottom: 8px;
      align-items: flex-end;
      .c7n-form-btn {
        display: flex;
        align-items: flex-end;
        padding-bottom: 8px;
      }
      .c7n-pro-form {
        padding-right: 8px;
        .c7n-pro-field-wrapper {
          padding-bottom: 0;
        }
      }
    }
    .form-btn-expand {
      display: flex;
      flex-flow: row nowrap;
      button {
        flex: 1;
      }
    }
    .c7n-form-float-row {
      display: flex;
      flex-flow: row nowrap;
      align-items: flex-start;
    }
  }
  .hzero-permission-btn {
    /* &&&&&& {
      &.ant-btn-primary {
        background: #1e3255;
        color: #fff;
        border-color: #1e3255;
        :hover,
        :active {
          color: #fff;
          border-color: #405477;
          background: #405477;
        }
        &.hzero-permission-btn-disabled {
          cursor: not-allowed;
          color: rgba(0, 0, 0, 0.25);
          border-color: rgba(0, 0, 0, 0.35);
        }
      }
    } */
  }
`;

export default createGlobalStyle`
  ${globalCss};
`;

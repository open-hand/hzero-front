/**
 * @date 2018-09-10
 * @author CJ <juan.chen01@hand-china.com>
 */
import { getResponse, createPagination } from 'utils/utils';

import {
  queryDatabaseList,
  createDatabase,
  editDatabase,
  deleteDatabase,
  selectTenantOk,
  queryTenantList,
  handleDeleteTenant,
} from '../services/databaseService';

export default {
  namespace: 'database',
  state: {
    databaseData: {}, // 查询数据列表
    databaseId: undefined, // 数据库id
    tenantData: {}, // 租户列表
    datasourceId: undefined, // 数据源id
    pagination: {}, // 分页信息
    tenantPagination: {}, // 租户分页信息
  },
  effects: {
    // 获取表格数据
    *fetchTableList({ payload }, { call, put }) {
      const res = yield call(queryDatabaseList, payload);
      const list = getResponse(res);
      if (list) {
        yield put({
          type: 'updateState',
          payload: {
            databaseData: list,
            pagination: createPagination(list),
          },
        });
      }
    },
    // 新建保存
    *createDatabase({ payload }, { call, put }) {
      const res = getResponse(yield call(createDatabase, { ...payload }));
      if (res) {
        yield put({
          type: 'updateState',
          payload: {
            databaseId: res.databaseId,
            datasourceId: res.datasourceId,
          },
        });
      }
      return res;
    },
    // 编辑保存
    *editDatabase({ payload }, { call }) {
      const result = yield call(editDatabase, { ...payload });
      return getResponse(result);
    },
    // 删除数据库
    *deleteDatabase({ payload }, { call }) {
      const result = yield call(deleteDatabase, payload);
      return getResponse(result);
    },
    // 查询租户
    *handleSearchTenant({ payload }, { call, put }) {
      const res = yield call(queryTenantList, payload);
      const list = getResponse(res);
      if (list) {
        yield put({
          type: 'updateState',
          payload: {
            tenantData: list,
            tenantPagination: createPagination(list),
          },
        });
      }
    },
    // 添加租户
    *selectTenantOk({ payload }, { call }) {
      const result = yield call(selectTenantOk, { ...payload });
      return getResponse(result);
    },
    // 删除租户
    *handleDeleteTenant({ payload }, { call }) {
      const result = yield call(handleDeleteTenant, { ...payload });
      return getResponse(result);
    },
  },
  reducers: {
    updateState(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
};

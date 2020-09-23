/**
 * @date: 2018-08-01
 * @author: CJ <juan.chen01@hand-china.com>
 */
import { getResponse, createPagination } from 'utils/utils';
import { getPublicKey } from 'services/api';

import {
  fetchSMSList,
  fetchServerType,
  createSMS,
  editSMS,
  deleteSMS,
} from '../services/smsConfigService';

export default {
  namespace: 'smsConfig',
  state: {
    smsData: {}, // 查询数据列表
    serverTypeList: [], // 服务类型
    pagination: {}, // 分页器
    publicKey: '', // 密码公钥
  },
  effects: {
    // 获取短信数据
    * fetchSMSList({ payload }, { call, put }) {
      const res = yield call(fetchSMSList, payload);
      const list = getResponse(res);
      if (list) {
        yield put({
          type: 'updateState',
          payload: {
            smsData: list,
            pagination: createPagination(list),
          },
        });
      }
    },
    // 获取服务类型
    * fetchServerType(_, { call, put }) {
      const response = yield call(fetchServerType);
      const list = getResponse(response);
      if (list) {
        yield put({
          type: 'updateState',
          payload: {
            serverTypeList: list,
          },
        });
      }
    },
    // 新建保存
    * createSMS({ payload }, { call }) {
      const result = yield call(createSMS, { ...payload });
      return getResponse(result);
    },
    // 编辑保存
    * editSMS({ payload }, { call }) {
      const result = yield call(editSMS, { ...payload });
      return getResponse(result);
    },
    * deleteSMS({ payload }, { call }) {
      const result = yield call(deleteSMS, { ...payload });
      return getResponse(result);
    },
    * getPublicKey(_, { call, put }) {
      const res = yield call(getPublicKey);
      if (res) {
        yield put({
          type: 'updateState',
          payload: {
            publicKey: res.publicKey,
          },
        });
      }
      return res;
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

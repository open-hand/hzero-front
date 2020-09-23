/**
 * @date: 2018-09-24
 * @author: CJ <juan.chen01@hand-china.com>
 */
import { getResponse } from 'utils/utils';
import { fetchPasswordPolicyList, updatePasswordPolicy } from '../services/passwordPolicyService';

export default {
  namespace: 'passwordPolicy',
  state: {
    passwordPolicyList: {},
  },
  effects: {
    // 获取密码策略数据
    * fetchPasswordPolicyList({ payload }, { call, put }) {
      const list = yield call(fetchPasswordPolicyList, payload);
      const res = getResponse(list);
      if (res) {
        yield put({
          type: 'updateState',
          payload: { passwordPolicyList: res },
        });
      }
    },
    // 更新
    * updatePasswordPolicy({ payload }, { call }) {
      const res = yield call(updatePasswordPolicy, payload);
      return getResponse(res);
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};

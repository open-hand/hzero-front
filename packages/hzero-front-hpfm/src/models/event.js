/**
 * @date 2018-06-25
 * @author NJQ
 */

import { getResponse, createPagination } from 'utils/utils';
import { queryIdpValue } from 'hzero-front/lib/services/api';
import eventService from '../services/eventService';

export default {
  namespace: 'event',

  state: {
    queryValue: {},
    modalVisible: false,
    ruleModalVisible: false,
    list: {},
    messageList: {}, // 消息列表
    messageTypeCode: [], // 消息类型
    pagination: {}, // 分页信息对象
  },

  effects: {
    *query({ payload }, { call, put }) {
      const response = yield call(eventService.queryEvents, payload);
      const list = getResponse(response);
      const pagination = createPagination(list);
      if (list) {
        yield put({
          type: 'updateState',
          payload: {
            list,
            pagination,
          },
        });
      }
    },

    *getEvent({ payload }, { call }) {
      const response = yield call(eventService.getEvent, payload);
      return getResponse(response);
    },

    *updateEvent({ payload }, { call }) {
      const response = yield call(eventService.updateEvent, payload);
      return getResponse(response);
    },

    *updateRule({ payload }, { call }) {
      const response = yield call(eventService.updateRule, payload);
      return getResponse(response);
    },

    *action({ method, payload }, { call }) {
      const response = yield call(eventService[method], payload);
      return getResponse(response);
    },

    // 查询消息
    *getMessageList({ payload }, { call, put }) {
      const response = yield call(eventService.queryMessages, payload);
      const list = getResponse(response);
      if (list) {
        yield put({
          type: 'updateState',
          payload: {
            messageList: list,
          },
        });
      }
    },
    // 获取消息类型
    *fetchMessageTypeCode(_, { call, put }) {
      const messageTypeCode = getResponse(yield call(queryIdpValue, 'HMSG.MESSAGE_TYPE'));
      yield put({
        type: 'updateState',
        payload: {
          messageTypeCode,
        },
      });
    },
    // 添加消息
    *createMessage({ payload }, { call }) {
      const result = yield call(eventService.createMessage, payload);
      return getResponse(result);
    },
    // 更新消息
    *updateMessage({ payload }, { call }) {
      const result = yield call(eventService.updateMessage, payload);
      return getResponse(result);
    },
    // 批量删除消息
    *deleteMessages({ payload }, { call }) {
      const response = yield call(eventService.deleteMessages, payload);
      return getResponse(response);
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

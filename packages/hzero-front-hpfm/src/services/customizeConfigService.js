/**
 * 个性化配置service
 * @date: 2019-12-15
 * @version: 0.0.1
 * @author: zhaotong <tong.zhao@hand-china.com>
 * @copyright Copyright (c) 2019, Hands
 */

import request from 'utils/request';
import { HZERO_PLATFORM } from 'utils/config';
import { getCurrentOrganizationId } from 'utils/utils';

// const mockapi = '/api/hpfm';

export async function queryCode(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/lovs/value`, {
    query: params,
  });
}
export async function queryModule(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/list/model`, {
    query: params,
  });
}

export async function queryTree(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/menu-tree`, {
    query: params,
    method: 'GET',
  });
}
export async function queryGroup(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/groupUnits`, {
    query: params,
    method: 'GET',
  });
}
export async function queryUnitDetails(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/details`, {
    query: params,
    method: 'GET',
  });
}
export async function saveFieldIndividual(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/save`, {
    body: params,
    method: 'POST',
  });
}
export async function queryFieldMapping(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/mapping/details`, {
    query: params,
    method: 'GET',
  });
}
export async function queryConditions(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/condition`, {
    query: params,
    method: 'GET',
  });
}
export async function queryRelatedUnits(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/unit/related`, {
    query: params,
    method: 'GET',
  });
}
export async function deleteFieldIndividual(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/delete`, {
    query: params,
    method: 'DELETE',
  });
}
export async function saveHeaderIndividual(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/save-header`, {
    body: params,
    method: 'POST',
  });
}
export async function querySelfValidator(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/condition-valid`, {
    query: params,
    method: 'GET',
  });
}
export async function saveSelfValidator(params = {}) {
  return request(`${HZERO_PLATFORM}/v1/${getCurrentOrganizationId()}/unit-config/condition-valid`, {
    body: params,
    method: 'POST',
  });
}

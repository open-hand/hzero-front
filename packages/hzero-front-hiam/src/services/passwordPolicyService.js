import request from 'utils/request';
import { HZERO_IAM } from 'utils/config';
import { getCurrentOrganizationId } from 'utils/utils';

const organizationId = getCurrentOrganizationId();

/**
 * 获取表单数据
 * @param {Number} organizationId 租户id
 */
export async function fetchPasswordPolicyList() {
  return request(`${HZERO_IAM}/v1/${organizationId}/password-policies`, {
    method: 'GET',
  });
}

/**
 * 更新表单数据
 * @param {Number} organizationId 租户id
 * @param {Number} id 数据id
 * @param {String} params 其他参数
 */
export async function updatePasswordPolicy(params) {
  return request(`${HZERO_IAM}/v1/${organizationId}/password-policies`, {
    method: 'PUT',
    body: params,
  });
}

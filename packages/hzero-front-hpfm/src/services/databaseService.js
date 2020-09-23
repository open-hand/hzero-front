import request from 'utils/request';
import { HZERO_PLATFORM } from 'utils/config';
import { parseParameters, isTenantRoleLevel, getCurrentOrganizationId } from 'utils/utils';

function apiPrefix() {
  return isTenantRoleLevel() ? `${getCurrentOrganizationId()}/databases` : 'databases';
}

/**
 * 查询数据库列表数据
 * @async
 * @function queryDatabaseList
 * @param {object} params - 查询条件
 * @param {!number} [params.page = 0] - 数据页码
 * @param {!number} [params.size = 10] - 分页大小
 * @returns {object} fetch Promise
 */
export async function queryDatabaseList(params) {
  const { tenantId, ...otherParams } = params;
  const param = parseParameters(otherParams);
  return request(`${HZERO_PLATFORM}/v1/${apiPrefix()}`, {
    method: 'GET',
    query: { ...param, tenantId },
  });
}

/**
 * 添加数据库信息
 * @async
 * @function createDatabase
 * @param {object} params - 请求参数
 * @param {!object} params.databaseCode - 数据源代码
 * @param {!string} params.databaseName - 数据源名称
 * @param {?number} params.datasourceName - 数据库名称
 * @param {!string} params.enabledFlag - 启用标记
 * @returns {object} fetch Promise
 */
export async function createDatabase(params) {
  return request(`${HZERO_PLATFORM}/v1/${apiPrefix()}`, {
    method: 'POST',
    body: params,
  });
}

/**
 * 编辑数据库信息
 * @async
 * @function editDatabase
 * @param {object} params - 请求参数
 * @param {!object} params.databaseCode - 数据源代码
 * @param {!string} params.databaseName - 数据源名称
 * @param {?number} params.datasourceName - 数据库名称
 * @param {!string} params.enabledFlag - 启用标记
 * @param {!string} params.databaseId - databaseId
 * @param {!string} params.objectVersionNumber - 版本号
 * @returns {object} fetch Promise
 */
export async function editDatabase(params) {
  return request(`${HZERO_PLATFORM}/v1/${apiPrefix()}`, {
    method: 'PUT',
    body: params,
  });
}
/**
 * 删除数据库信息
 * @async
 * @function deleteDatabase
 * @param {number} databaseId - 数据库Id
 * @returns {object} fetch Promise
 */
export async function deleteDatabase(params) {
  return request(`${HZERO_PLATFORM}/v1/${apiPrefix()}`, {
    method: 'DELETE',
    body: params,
  });
}
/**
 * 查询租户
 * @async
 * @function queryTenantList
 * @param {object} params - 查询条件
 * @param {!number} [params.page = 0] - 数据页码
 * @param {!number} [params.size = 10] - 分页大小
 * @returns {object} fetch Promise
 */
export async function queryTenantList(params) {
  const { databaseId, ...otherParams } = params;
  const param = parseParameters(otherParams);
  return request(`${HZERO_PLATFORM}/v1/database-tenant`, {
    method: 'GET',
    query: { ...param, databaseId },
  });
}
/**
 * 添加租户
 * @async
 * @function selectTenantOk
 * @param {object} params - 请求参数
 * @param {!object} params.databaseId - 数据库id
 * @param {!string} params.tenantId - 租户id
 * @returns {object} fetch Promise
 */
export async function selectTenantOk(params) {
  return request(`${HZERO_PLATFORM}/v1/database-tenant`, {
    method: 'POST',
    body: params,
  });
}
/**
 * 删除租户
 * @async
 * @function handleDeleteTenant
 * @param {object} params,databaseId - 请求参数
 * @param {number} databaseTenantId - 数据库租户Id
 * @returns {object} fetch Promise
 */
export async function handleDeleteTenant(params) {
  return request(`${HZERO_PLATFORM}/v1/database-tenant`, {
    method: 'DELETE',
    body: params,
  });
}

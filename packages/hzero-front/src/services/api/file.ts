/**
 * 文件相关
 * @email WY <yang.wang06@hand-china.com>
 * @creationDate 2019/12/25
 * @copyright HAND ® 2019
 */

import request from 'utils/request';
import { getIeVersion } from 'utils/browser';
import { getEnvConfig } from 'utils/iocUtils';

import {
  filterNullValueObject,
  getAccessToken,
  getCurrentOrganizationId,
  getResponse,
  isTenantRoleLevel,
} from 'utils/utils';

const { API_HOST, HZERO_FILE } = getEnvConfig();

/**
 * 获取fileList
 * {HZERO_FILE}/v1/files/{attachmentUUID}/file
 * todo {HZERO_FILE}/v1/{organizationId}/files/{attachmentUUID}/file
 * @export
 * @param {object} params 传递参数
 * @param {string} params.attachmentUUID - 文件uuid
 */
export async function queryFileList(params) {
  const tenantId = getCurrentOrganizationId();
  return request(
    `${HZERO_FILE}/v1${isTenantRoleLevel() ? `/${tenantId}/` : '/'}files/${
      params.attachmentUUID
    }/file`,
    {
      method: 'GET',
      query: params,
    }
  );
}

/**
 * 获取fileList(租户级)
 * {HZERO_FILE}/v1/{organizationId}/files/{attachmentUUID}/file
 * @export
 * @param {object} params 传递参数
 * @param {string} params.attachmentUUID - 文件uuid
 */
export async function queryFileListOrg(params) {
  const organizationId = getCurrentOrganizationId();
  return request(`${HZERO_FILE}/v1/${organizationId}/files/${params.attachmentUUID}/file`, {
    method: 'GET',
    query: params,
  });
}

/**
 * 删除文件
 * {HZERO_FILE}/v1/files/delete-by-uuidurl/not-null
 * @export
 * @param {object} params 传递参数
 * @param {string} params.bucketName - 桶
 * @param {string} params.attachmentUUID - 文件uuid
 * @param {string} params.storageCode - 存储配置编码
 * @param {string[]} params.urls - 删除文件
 */
export async function removeFileList(params) {
  const { urls, ...otherParams } = params;
  const reqUrl = `${HZERO_FILE}/v1/files/delete-by-uuidurl/not-null`;
  return request(reqUrl, {
    method: 'POST',
    body: params.urls,
    query: filterNullValueObject(otherParams),
  });
}

/**
 * 删除上传的文件
 * {HZERO_FILE}/v1/files/delete-by-url
 * {HZERO_FILE}/v1/{organizationId}/files/delete-by-url
 * @param {object} params
 * @param {string} params.bucketName
 * @param {string} params.storageCode - 存储配置编码
 */
export async function removeUploadFile(params) {
  const { urls, ...otherParams } = params;
  const tenantId = getCurrentOrganizationId();
  const reqUrl = isTenantRoleLevel()
    ? `${HZERO_FILE}/v1/${tenantId}/files/delete-by-url`
    : `${HZERO_FILE}/v1/files/delete-by-url`;
  return request(reqUrl, {
    method: 'POST',
    body: urls,
    query: filterNullValueObject(otherParams),
  });
}

/**
 * 删除attachmentUUID对应的某一个文件
 * {HZERO_FILE}/v1/files/delete-by-uuidurl
 * todo {HZERO_FILE}/v1/{organizationId}/files/delete-by-uuidurl
 * @export
 * @param {object} params 传递参数
 * @param {string} params.bucketName - 桶
 * @param {string} params.attachmentUUID - 文件uuid
 * @param {string[]} params.urls - 要删除的文件
 */
export async function removeFile(params) {
  const { urls, ...otherParams } = params;
  const tenantId = getCurrentOrganizationId();
  const reqUrl = isTenantRoleLevel()
    ? `${HZERO_FILE}/v1/${tenantId}/files/delete-by-uuidurl`
    : `${HZERO_FILE}/v1/files/delete-by-uuidurl`;
  return request(reqUrl, {
    method: 'POST',
    body: urls,
    query: filterNullValueObject(otherParams),
  });
}

/**
 * 删除attachmentUUID对应的某一个文件(租户级)
 * {HZERO_FILE}/v1/{organizationId}/files/delete-by-uuidurl
 * @export
 * @param {object} params 传递参数
 * @param {string[]} params.urls - 删除的文件
 * @param {string} params.bucketName - 桶
 * @param {string} params.attachmentUUID - 文件uuid
 */
export async function removeFileOrg(params) {
  const organizationId = getCurrentOrganizationId();
  const { bucketName, attachmentUUID, urls, ...otherParams } = params;
  return request(`${HZERO_FILE}/v1/${organizationId}/files/delete-by-uuidurl`, {
    method: 'POST',
    query: {
      bucketName,
      attachmentUUID,
      ...filterNullValueObject(otherParams),
    },
    body: urls,
  });
}

/**
 * 获取fileList
 * {HZERO_FILE}/v1/files/uuid
 * {HZERO_FILE}/v1/{organizationId}/files/uuid
 * @export
 * @param {object} params 传递参数
 */
export async function queryUUID(params) {
  const tenantId = getCurrentOrganizationId();
  return request(`${HZERO_FILE}/v1${isTenantRoleLevel() ? `/${tenantId}/` : '/'}files/uuid`, {
    method: 'POST',
    query: params,
  });
}

/**
 * 获取导出Excel的列数据
 * @export
 * @param {object} params 传递参数
 */
export async function queryColumn(params) {
  return request(`${params.requestUrl}`, {
    method: params.method,
    query: { exportType: 'COLUMN' },
  });
}

export interface DownloadFileParams {
  requestUrl: string;
  queryParams: Array<{
    name: string;
    value: any;
  }>;
  method: 'GET' | 'POST';
}

/**
 * 下载
 * @export
 * @param {object} params 传递参数
 * @param {string} params.requestUrl 下载文件请求的url
 * @param {array} params.queryParams 下载文件请求的查询参数，参数格式为：[{ name: '', value: '' }]]
 */
export async function downloadFile(params: DownloadFileParams) {
  const { requestUrl: url, queryParams, method } = params || {};
  let newUrl = !url.startsWith('/api') && !url.startsWith('http') ? `${API_HOST}${url}` : url;
  const iframeName = `${url}${Math.random()}`;

  // 构建iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('name', iframeName);
  iframe.setAttribute('id', iframeName);
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.display = 'none';

  // 构建form
  const downloadForm = document.createElement('form');
  if (getIeVersion() === -1) {
    // 如果当前浏览器不为ie
    // form 指向 iframe
    downloadForm.setAttribute('target', iframeName);
  }

  // 设置token
  const tokenInput = document.createElement('input');
  tokenInput.setAttribute('type', 'hidden');
  tokenInput.setAttribute('name', 'access_token');
  tokenInput.setAttribute('value', `${getAccessToken()}`);

  // 处理post请求时token效验
  if (method === 'POST') {
    newUrl = `${newUrl}?access_token=${getAccessToken()}`;
  }

  // 表单添加请求配置
  downloadForm.setAttribute('method', method);
  downloadForm.setAttribute('action', newUrl);
  downloadForm.appendChild(tokenInput);

  // 表单添加查询参数
  if (queryParams && Array.isArray(queryParams)) {
    queryParams.forEach((item) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', item.name);
      input.setAttribute('value', item.value);
      downloadForm.appendChild(input);
    });
  }

  document.body.appendChild(iframe);
  document.body.appendChild(downloadForm);
  downloadForm.submit();

  // setTimeout(() => {
  //   document.body.removeChild(downloadForm);
  //   document.body.removeChild(iframe);
  // }, 2500);
  return true;
}

/**
 * initiateAsyncExport 发起异步导出请求
 * @param {string} params - 参数
 */
export async function initiateAsyncExport(params) {
  const { requestUrl: url, queryParams } = params;
  let newUrl = !url.startsWith('/api') && !url.startsWith('http') ? `${API_HOST}${url}` : url;
  if (queryParams && Object.keys(queryParams).length >= 1) {
    queryParams.forEach((item) => {
      newUrl += `${newUrl.indexOf('?') >= 0 ? '&' : '?'}${item.name}=${encodeURIComponent(
        item.value
      )}`;
    });
  }
  const res = request(newUrl, {
    method: 'GET',
  });

  // FIXME: @WJC utils need fix
  // @ts-ignore
  return getResponse(res);
}

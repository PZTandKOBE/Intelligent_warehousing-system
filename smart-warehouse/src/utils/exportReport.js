/* src/utils/exportReport.js */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ElLoading, ElMessage } from 'element-plus';

// ... (保留原有的 downloadPDF 代码，以备不时之需，或者你可以选择删除) ...
// 为了代码整洁，这里不再重复展示 downloadPDF 的长代码，请保留原样即可。

/**
 * [新增] 通用下载工具：处理后端返回的下载链接
 * @param {string} url - 后端返回的文件地址 (e.g. http://api.../file.pdf)
 * @param {string} filename - (可选) 下载保存的文件名
 */
export const downloadFileFromUrl = (url, filename) => {
  if (!url) {
    ElMessage.warning('无效的下载链接');
    return;
  }
  
  // 创建隐藏的 a 标签触发下载
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  
  //设置 download 属性，浏览器会尝试下载而不是打开
  //注意：如果跨域，download 属性可能不生效，浏览器会打开新标签页预览，这也是一种预期的行为
  if (filename) link.download = filename; 
  link.target = '_blank'; 

  document.body.appendChild(link);
  link.click();
  
  // 清理 DOM
  document.body.removeChild(link);
  
  ElMessage.success('下载任务已开始');
};
/* src/utils/exportReport.js */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ElLoading, ElMessage } from 'element-plus';


/**
 *  通用下载工具：处理后端返回的下载链接
 * @param {string} url - 后端返回的文件地址 
 * @param {string} filename -下载保存的文件名
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
  if (filename) link.download = filename; 
  link.target = '_blank'; 

  document.body.appendChild(link);
  link.click();
  
  // 清理 DOM
  document.body.removeChild(link);
  
  ElMessage.success('下载任务已开始');
};
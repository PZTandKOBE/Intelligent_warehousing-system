//PDF 导出逻辑封装
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ElLoading, ElMessage } from 'element-plus';

/**
 * 将指定的 DOM 元素导出为 PDF
 * @param {string} title - 导出的文件名
 * @param {string} selector - CSS 选择器 (例如 '#report-content')
 */
export const downloadPDF = async (title, selector) => {
  const element = document.querySelector(selector);
  if (!element) {
    ElMessage.error('找不到要导出的内容');
    return;
  }

  // 1. 开启 Loading，防止用户重复点击
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在生成智能分析报告，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    // 2. 将 DOM 转换为 Canvas 图片
    // scale: 2 是为了让文字和图表更清晰 (高清截图)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true, // 允许跨域图片
      backgroundColor: '#1d1e1f', // 保证背景色是深色的
    });

    const contentWidth = canvas.width;
    const contentHeight = canvas.height;

    // 3. 计算 PDF 页面尺寸 (A4 纸比例)
    const pageHeight = (contentWidth / 592.28) * 841.89;
    let leftHeight = contentHeight;
    let position = 0;
    
    // A4 纸尺寸 [595.28, 841.89]
    const imgWidth = 595.28; 
    const imgHeight = (592.28 / contentWidth) * contentHeight;

    const pdf = new jsPDF('', 'pt', 'a4');

    // 4. 处理分页逻辑 (如果内容太长)
    if (leftHeight < pageHeight) {
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      while (leftHeight > 0) {
        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
        leftHeight -= pageHeight;
        position -= 841.89;
        if (leftHeight > 0) {
          pdf.addPage();
        }
      }
    }

    // 5. 下载文件
    pdf.save(`${title}_${new Date().getTime()}.pdf`);
    ElMessage.success('PDF 报告导出成功！');

  } catch (error) {
    console.error(error);
    ElMessage.error('导出失败，请检查控制台日志');
  } finally {
    loadingInstance.close();
  }
};
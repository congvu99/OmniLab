/**
 * Wording of the finance disclaimer, shared by the rendered block
 * (src/components/lesson/disclaimer.astro) and the speech script extractor
 * (src/lib/speech-script-extract.ts), so the page and the audio never drift.
 * Changing it also changes every affected `scriptHash` (audio regenerates).
 */
export const DISCLAIMER_LABEL = 'Miễn trừ trách nhiệm:';

export const DISCLAIMER_TEXT =
  'nội dung mang tính giáo dục, không phải tư vấn đầu tư hay khuyến nghị mua/bán sản phẩm tài chính cụ thể. ' +
  'Kiểm tra lại số liệu, quy định pháp luật và điều kiện sản phẩm tại nguồn chính thức trước khi quyết định.';

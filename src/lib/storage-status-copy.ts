/**
 * Vietnamese copy for the "Lưu trữ" row on /toi. Pure so the wording rules
 * are testable: iOS Safari (not installed to the home screen) may evict
 * site storage after ~7 days without a visit, so only the installed app or
 * non-iOS browsers are described as keeping progress.
 */
export interface StorageContext {
  persistent: boolean;
  ios: boolean;
  standalone: boolean;
}

export interface StorageCopy {
  title: string;
  detail: string;
}

export function storageStatusCopy({ persistent, ios, standalone }: StorageContext): StorageCopy {
  if (!persistent) {
    return {
      title: 'Lưu trữ tạm thời',
      detail: 'Trình duyệt đang chặn lưu trữ (chế độ riêng tư?). Tiến độ chỉ giữ đến khi đóng thẻ này.',
    };
  }
  if (standalone) {
    return {
      title: 'Lưu trữ bền',
      detail: 'Đang chạy như ứng dụng trên màn hình chính: tiến độ và mục đã lưu được giữ trên máy này.',
    };
  }
  if (ios) {
    return {
      title: 'Lưu trữ trên Safari',
      detail:
        'Safari có thể tự xoá dữ liệu nếu bạn không mở OmniLab trong 7 ngày. Cài lên màn hình chính để giữ tiến độ lâu dài.',
    };
  }
  return {
    title: 'Lưu trữ trên trình duyệt',
    detail: 'Tiến độ và mục đã lưu được giữ trên máy này, trừ khi bạn xoá dữ liệu duyệt web.',
  };
}

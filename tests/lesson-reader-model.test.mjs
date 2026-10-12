// Pure helpers behind the reader header / aside.
import { describe, expect, it } from 'vitest';
import {
  cleanSummary,
  findTitleDuplicate,
  minutesLeft,
  needsHeadingFiller,
  pad2,
  readingLeftLabel,
  shortLicenseLabel,
  shortSourceLabel,
  ringDashOffset,
} from '../src/lib/lesson-reader-model.ts';

const h = (depth, text, slug = text) => ({ depth, text, slug });

describe('findTitleDuplicate', () => {
  it('matches a first heading equal to the title (case/space-insensitive)', () => {
    expect(findTitleDuplicate([h(1, 'Bộ nhớ đệm  (Cache)'), h(2, 'Nội dung gốc')], 'Bộ nhớ đệm (Cache)')?.depth).toBe(1);
    expect(findTitleDuplicate([h(2, 'Quy trình A')], 'quy trình a')?.depth).toBe(2);
  });

  it('ignores later headings and unrelated first headings', () => {
    expect(findTitleDuplicate([h(2, 'Khác'), h(2, 'Tiêu đề')], 'Tiêu đề')).toBeNull();
    expect(findTitleDuplicate([], 'Tiêu đề')).toBeNull();
  });
});

describe('needsHeadingFiller', () => {
  it('is true only when the first visible heading skips h2', () => {
    expect(needsHeadingFiller([h(3, 'a')])).toBe(true);
    expect(needsHeadingFiller([h(2, 'a'), h(3, 'b')])).toBe(false);
    expect(needsHeadingFiller([])).toBe(false);
  });
});

describe('cleanSummary', () => {
  it('strips markdown emphasis', () => {
    expect(cleanSummary('**Học:** lịch góp tiền, kiểm tra tỷ trọng, phí giao dịch và điều kiện xem lại.')).toBe(
      'Học: lịch góp tiền, kiểm tra tỷ trọng, phí giao dịch và điều kiện xem lại.',
    );
  });

  it('drops short or scraped fragments', () => {
    expect(cleanSummary('05 / Bối cảnh Việt Nam')).toBeNull();
    expect(cleanSummary('Từ hiểu tiền đến tự ra quyết định')).toBeNull();
    expect(cleanSummary('1. Tự truy cập website chính thức, kiểm tra pháp nhân; không chỉ dùng link.')).toBeNull();
    expect(cleanSummary(undefined)).toBeNull();
  });

  it('keeps real sentences', () => {
    const s = 'Bộ nhớ đệm giúp cải thiện thời gian tải trang và giảm tải cho máy chủ.';
    expect(cleanSummary(s)).toBe(s);
  });
});

describe('reading progress readouts', () => {
  it('counts minutes left, never below 1 before the end', () => {
    expect(minutesLeft(10, 0)).toBe(10);
    expect(minutesLeft(10, 50)).toBe(5);
    expect(minutesLeft(3, 90)).toBe(1);
  });

  it('formats the aside caption', () => {
    expect(readingLeftLabel(10, 40)).toBe('còn 6 phút · 40%');
    expect(readingLeftLabel(10, 98)).toBe('đã tới cuối bài');
  });

  it('computes ring dash offsets with clamping', () => {
    expect(ringDashOffset(100, 0)).toBe(100);
    expect(ringDashOffset(100, 25)).toBe(75);
    expect(ringDashOffset(100, 150)).toBe(0);
    expect(ringDashOffset(100, -5)).toBe(100);
  });

  it('pads positions', () => {
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
  });
});

describe('short credit labels', () => {
  it('keeps the first source segment and the license name', () => {
    expect(shortSourceLabel('The System Design Primer - mục "Cache"')).toBe('The System Design Primer');
    expect(shortSourceLabel('Nguồn đơn')).toBe('Nguồn đơn');
    expect(shortLicenseLabel('CC BY 4.0 (nguyên bản: Donne Martin)')).toBe('CC BY 4.0');
    expect(shortLicenseLabel('MIT')).toBe('MIT');
    expect(shortLicenseLabel('Chưa xác định — cần user xác nhận')).toBe('Chưa xác định');
  });
});

// Encodes plan.md acceptance criterion #4 as an automated regression test:
// "cache", "bộ nhớ đệm" and "bo nho dem" must all rank the dedicated Cache
// lesson in the top 3. Fixture docs are paraphrased/shortened stand-ins for
// the real content shape (title + headings + truncated body), not the real
// copyrighted lesson text — see phase-05 report for the real-data run.
import { describe, expect, it } from 'vitest';
import { buildSearchIndex, searchLessons } from '../src/lib/search-index.ts';

const docs = [
  {
    id: 'kien-truc/chu-de/cache',
    title: 'Bộ nhớ đệm (Cache)',
    url: '/hoc/kien-truc/chu-de/cache',
    domain: 'kien-truc',
    domainTitle: 'Kiến trúc hệ thống',
    summary: 'Bộ nhớ đệm giúp cải thiện thời gian tải trang và giảm tải cho máy chủ.',
    headings: 'Cache là gì Client cache CDN Web server cache Database cache Application cache',
    text: 'Bộ nhớ đệm cache giúp giảm tải cho hệ thống bằng cách lưu lại kết quả đã tính trước đó.',
  },
  {
    id: 'kien-truc/nen-tang/caches',
    title: 'Khả năng mở rộng cho người mới - Phần 3: Bộ nhớ đệm',
    url: '/hoc/kien-truc/nen-tang/caches',
    domain: 'kien-truc',
    domainTitle: 'Kiến trúc hệ thống',
    summary: 'Bài dài về khả năng mở rộng hệ thống nói chung.',
    headings: 'Bộ nhớ đệm ứng dụng Bộ nhớ đệm cơ sở dữ liệu',
    text: 'Bài viết dài nói về khả năng mở rộng nói chung, bộ nhớ đệm bộ nhớ đệm bộ nhớ đệm được nhắc nhiều lần.',
  },
  {
    id: 'kien-truc/chu-de/load-balancer',
    title: 'Bộ cân bằng tải (Load Balancer)',
    url: '/hoc/kien-truc/chu-de/load-balancer',
    domain: 'kien-truc',
    domainTitle: 'Kiến trúc hệ thống',
    summary: 'Bộ cân bằng tải phân phối lưu lượng truy cập cho nhiều máy chủ.',
    headings: 'Load balancer là gì',
    text: 'Bộ cân bằng tải phân phối lưu lượng cho nhiều máy chủ.',
  },
  {
    id: 'tai-chinh/lo-trinh-12-tuan/tuan-03',
    title: 'Tuần 3 - Lãi kép, lạm phát và bộ đệm nhỏ',
    url: '/hoc/tai-chinh/lo-trinh-12-tuan/tuan-03',
    domain: 'tai-chinh',
    domainTitle: 'Tài chính cá nhân',
    summary: 'Lãi kép, lạm phát và vì sao nên có một khoản bộ đệm nhỏ.',
    headings: 'Lãi kép Lạm phát Bộ đệm tài chính',
    text: 'Một khoản bộ đệm nhỏ giúp bạn an tâm khi có chi phí phát sinh, không liên quan tới bộ nhớ đệm máy tính.',
  },
];

describe('MiniSearch index with foldDiacritics processTerm', () => {
  const index = buildSearchIndex(docs);

  it.each(['cache', 'bộ nhớ đệm', 'bo nho dem'])('ranks the Cache lesson in the top 3 for query %j', (query) => {
    const results = searchLessons(index, query);
    const top3Ids = results.slice(0, 3).map((r) => r.id);
    expect(top3Ids).toContain('kien-truc/chu-de/cache');
  });

  it('"cân bằng tải" and its unaccented form "can bang tai" both rank Load Balancer top', () => {
    for (const query of ['cân bằng tải', 'can bang tai']) {
      const results = searchLessons(index, query);
      expect(results[0]?.id).toBe('kien-truc/chu-de/load-balancer');
    }
  });

  it('"lãi kép" and "lai kep" both rank the finance lesson top', () => {
    for (const query of ['lãi kép', 'lai kep']) {
      const results = searchLessons(index, query);
      expect(results[0]?.id).toBe('tai-chinh/lo-trinh-12-tuan/tuan-03');
    }
  });

  it('returns [] for an empty/whitespace query instead of the whole index', () => {
    expect(searchLessons(index, '')).toEqual([]);
    expect(searchLessons(index, '   ')).toEqual([]);
  });
});

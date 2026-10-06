const request = require('supertest');

jest.mock('../common/db', () => ({ query: jest.fn() }));

const db = require('../common/db');
const app = require('../app');

describe('Stories API', () => {
  beforeEach(() => db.query.mockReset());

  test('returns paginated, filtered stories', async () => {
    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ total: 1 }]))
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ id: 1, title: 'Tiên Nghịch' }]));

    const response = await request(app).get('/stories?page=1&limit=18&search=tien&sort=views&status=completed');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
    expect(db.query.mock.calls[0][1]).toEqual(['%tien%', '%tien%']);
  });

  test('supports tri-state category filters and advanced conditions', async () => {
    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ total: 1 }]))
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ id: 2, title: 'Manga phù hợp' }]));

    const response = await request(app).get('/stories?include_cats=action,adventure&exclude_cats=horror&country=japan&min_chapters=10&sort=title');

    expect(response.status).toBe(200);
    expect(response.body.data[0].title).toBe('Manga phù hợp');
    expect(db.query.mock.calls[0][1]).toEqual(['japan', 10, ['action', 'adventure'], 2, ['horror']]);
    expect(db.query.mock.calls[0][0]).toContain('HAVING COUNT(chapter_filter.id) >= ?');
  });
});

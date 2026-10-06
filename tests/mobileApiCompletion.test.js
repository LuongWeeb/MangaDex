const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../common/db', () => ({ query: jest.fn() }));

const db = require('../common/db');
const app = require('../app');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

describe('Mobile completion API', () => {
  const token = jwt.sign({ id: 3, username: 'reader', role_id: 3, role_name: 'User' }, JWT_SECRET);

  beforeEach(() => db.query.mockReset());

  test('returns real story counts for every category through the mobile API', async () => {
    db.query.mockImplementation((sql, callback) => callback(null, [{ id: 1, name: 'Action', slug: 'action', story_count: 4 }]));

    const response = await request(app).get('/api/v1/categories');

    expect(response.status).toBe(200);
    expect(response.body.data[0].story_count).toBe(4);
    expect(db.query.mock.calls[0][0]).toContain('COUNT(DISTINCT sc.story_id) AS story_count');
    expect(db.query.mock.calls[0][0]).toContain('LEFT JOIN story_categories');
  });

  test('returns the authenticated reader’s liked stories through the mobile API', async () => {
    db.query.mockImplementation((sql, params, callback) => callback(null, [{ id: 9, title: 'Truyện đã thích' }]));

    const response = await request(app).get('/api/v1/me/likes').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].title).toBe('Truyện đã thích');
    expect(db.query.mock.calls[0][1]).toEqual([3]);
  });
});

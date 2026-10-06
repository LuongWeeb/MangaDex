const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../common/db', () => ({ query: jest.fn() }));

const db = require('../common/db');
const app = require('../app');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

describe('Comments API', () => {
  beforeEach(() => db.query.mockReset());

  test('removes HTML before saving a comment', async () => {
    db.query.mockImplementation((sql, params, callback) => callback(null, { insertId: 21 }));
    const token = jwt.sign({ id: 3, username: 'reader', role_id: 3, role_name: 'User' }, JWT_SECRET);

    const response = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ story_id: 1, content: '<script>alert(1)</script><b>Bình luận an toàn</b>' });

    expect(response.status).toBe(201);
    expect(db.query.mock.calls[0][1][3]).toBe('Bình luận an toàn');
    expect(response.body.comment.content).toBe('Bình luận an toàn');
  });
});

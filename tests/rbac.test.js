const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../common/db', () => ({ query: jest.fn() }));

const app = require('../app');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

describe('RBAC API', () => {
  const readerToken = jwt.sign({ id: 3, role_id: 3, role_name: 'User' }, JWT_SECRET);

  test('blocks Reader access to uploader endpoints', async () => {
    const response = await request(app)
      .post('/api/uploader/stories')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ title: 'Không được phép' });

    expect(response.status).toBe(403);
  });

  test('blocks Reader access to admin endpoints', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${readerToken}`);

    expect(response.status).toBe(403);
  });
});

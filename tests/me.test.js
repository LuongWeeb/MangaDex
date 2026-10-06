const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../common/db', () => ({ query: jest.fn() }));

const db = require('../common/db');
const app = require('../app');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

describe('Personal profile API', () => {
  const token = jwt.sign({ id: 3, username: 'reader', role_id: 3, role_name: 'User' }, JWT_SECRET);

  beforeEach(() => db.query.mockReset());

  test('updates valid profile information', async () => {
    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, { affectedRows: 1 }))
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ id: 3, username: 'reader', full_name: 'Độc Giả', gender: 'other', avatar_url: '/images/avatars/default.svg' }]));

    const response = await request(app)
      .put('/api/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: 'Độc Giả', gender: 'other', avatar_url: '/images/avatars/default.svg' });

    expect(response.status).toBe(200);
    expect(response.body.user.full_name).toBe('Độc Giả');
    expect(db.query.mock.calls[0][1]).toEqual(['Độc Giả', '/images/avatars/default.svg', 'other', 3]);
  });

  test('rejects an invalid avatar URL before writing', async () => {
    const response = await request(app)
      .put('/api/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatar_url: 'javascript:alert(1)' });

    expect(response.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

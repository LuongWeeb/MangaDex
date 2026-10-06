const bcrypt = require('bcryptjs');
const request = require('supertest');

jest.mock('../common/db', () => ({ query: jest.fn() }));

const db = require('../common/db');
const app = require('../app');

describe('Auth API', () => {
  beforeEach(() => db.query.mockReset());

  test('registers a valid user', async () => {
    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, []))
      .mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 10 }));

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'reader_test', email: 'reader_test@example.com', password: 'secret123' });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.username).toBe('reader_test');
  });

  test('logs in with valid credentials', async () => {
    const passwordHash = bcrypt.hashSync('secret123', 10);
    db.query.mockImplementation((sql, params, callback) => callback(null, [{
      id: 3,
      username: 'reader_test',
      email: 'reader_test@example.com',
      password_hash: passwordHash,
      avatar_url: null,
      role_id: 3,
      role_name: 'User',
      is_banned: 0
    }]));

    const response = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'reader_test', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
  });

  test('rejects an incorrect password', async () => {
    const passwordHash = bcrypt.hashSync('secret123', 10);
    db.query.mockImplementation((sql, params, callback) => callback(null, [{ password_hash: passwordHash, is_banned: 0 }]));

    const response = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'reader_test', password: 'wrong-password' });

    expect(response.status).toBe(401);
  });
});

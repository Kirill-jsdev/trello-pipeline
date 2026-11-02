import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app';

describe('GET /sum', () => {
  it('returns sum of a and b', async () => {
    const res = await request(app).get('/sum').query({ a: 2, b: 3 });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { result: 5 });
  });

  it('returns 400 for invalid params', async () => {
    const res = await request(app).get('/sum').query({ a: 'x' });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'Query params a and b must be numbers' });
  });
});

describe('GET /health', () => {
  it('AC-1: GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
  });

  it('AC-2: GET /health returns {"status":"ok"}', async () => {
    const res = await request(app).get('/health');
    assert.deepEqual(res.body, { status: 'ok' });
  });

  it('AC-3: /health endpoint has an automated test', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
  });
});

describe('GET /hello', () => {
  it('greets World by default', async () => {
    const res = await request(app).get('/hello');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { message: 'Hello, World!' });
  });

  it('greets by name', async () => {
    const res = await request(app).get('/hello').query({ name: 'Kirill' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { message: 'Hello, Kirill!' });
  });
});

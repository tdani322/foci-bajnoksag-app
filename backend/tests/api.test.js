import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRoutes from '../src/routes/api.js';

const app = express();
app.use(express.json());
app.use('/', apiRoutes);

describe('API Végpontok', () => {
  it('GET /heartbeat - visszaadja a kapcsolat státuszát', async () => {
    const response = await request(app).get('/heartbeat');
    
    expect(response.status).toBe(200);
    
    expect(response.body).toEqual({ connection: 'ok' });
  });
});
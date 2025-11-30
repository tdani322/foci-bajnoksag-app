import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRoutes from '../src/routes/api.js';

// Létrehozunk egy mini Express appot csak a teszthez
const app = express();
app.use(express.json());
app.use('/', apiRoutes);

describe('API Végpontok', () => {
  it('GET /heartbeat - visszaadja a kapcsolat státuszát', async () => {
    const response = await request(app).get('/heartbeat');
    
    // Ellenőrizzük a státuszkódot
    expect(response.status).toBe(200);
    
    // Ellenőrizzük a választ
    expect(response.body).toEqual({ connection: 'ok' });
  });
});
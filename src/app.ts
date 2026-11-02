import express from 'express';

export const app = express();

app.get('/sum', (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);
  if (req.query.a === undefined || req.query.b === undefined || Number.isNaN(a) || Number.isNaN(b)) {
    res.status(400).json({ error: 'Query params a and b must be numbers' });
    return;
  }
  res.json({ result: a + b });
});

app.get('/hello', (req, res) => {
  const name = typeof req.query.name === 'string' && req.query.name ? req.query.name : 'World';
  res.json({ message: `Hello, ${name}!` });
});

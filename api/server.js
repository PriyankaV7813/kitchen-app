const express = require('express');
const { MongoClient } = require('mongodb');
const client = require('prom-client');

const app = express();
app.use(express.json());

// Prometheus setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

const kitchenOrdersCreatedTotal = new client.Counter({
  name: 'kitchen_orders_created_total',
  help: 'Total number of kitchen orders created',
  registers: [register]
});

let ordersCollection = null;

// 🔥 FIXED DATABASE CONNECTION
async function connectDb() {
  const uri = process.env.MONGO_URI || "mongodb://mongo:27017/kitchen";

  console.log("👉 Connecting to MongoDB:", uri);

  try {
    const mongo = await MongoClient.connect(uri);
    ordersCollection = mongo.db('kitchen').collection('orders');

    console.log("✅ MongoDB connected successfully");

    return true;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    return false;
  }
}

// Middleware for metrics
function normalizeRoute(path) {
  if (path === '/metrics' || path === '/health' || path === '/ready') return path;
  if (path === '/orders' || path.startsWith('/orders')) return '/orders';
  return path;
}

app.use((req, res, next) => {
  const start = Date.now();
  const route = normalizeRoute(req.route?.path || req.path);

  res.on('finish', () => {
    const status = String(res.statusCode);
    const duration = (Date.now() - start) / 1000;

    httpRequestsTotal.inc({ method: req.method, route, status_code: status });
    httpRequestDurationSeconds.observe({ method: req.method, route, status_code: status }, duration);
  });

  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: ordersCollection ? 'connected' : 'disconnected'
  });
});

app.get('/ready', (req, res) => res.send('OK'));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/orders', async (req, res) => {
  if (!ordersCollection) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  const orders = await ordersCollection.find({}).toArray();
  res.json(orders);
});

app.post('/orders', async (req, res) => {
  if (!ordersCollection) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  const dish = req.body?.dish;

  if (!dish) {
    return res.status(400).json({ error: 'Missing dish' });
  }

  const doc = {
    dish,
    status: 'pending',
    createdAt: new Date()
  };

  const result = await ordersCollection.insertOne(doc);

  kitchenOrdersCreatedTotal.inc();

  res.status(201).json({
    _id: result.insertedId,
    ...doc
  });
});

const PORT = process.env.PORT || 3000;

// Start server
async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`🚀 Kitchen API running on port ${PORT}`);
  });
}

start();
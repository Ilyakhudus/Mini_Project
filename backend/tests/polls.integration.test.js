const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

let mongoServer
let app
const connectDB = require('../config/database')

beforeAll(async () => {
  // Load env file explicitly
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

  // If an external MONGO_URI is provided in env, use it (avoids downloading mongod binaries on CI/Windows)
  if (process.env.MONGO_URI) {
    console.log('[tests] Using MONGO_URI from environment; skipping mongodb-memory-server')
  } else {
    // Try to start an in-memory MongoDB with a timeout
    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
    try {
      mongoServer = await Promise.race([MongoMemoryServer.create(), timeout(15000)])
      process.env.MONGO_URI = mongoServer.getUri()
      console.log('[tests] Using mongodb-memory-server')
    } catch (err) {
      console.error('[tests] Failed to start mongodb-memory-server and no MONGO_URI provided. Aborting tests.')
      throw err
    }
  }

  // Set a test JWT secret
  process.env.JWT_SECRET = 'testsecret'
  await connectDB()
  app = require('../server')
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) await mongoServer.stop()
})

beforeEach(async () => {
  // Clean database between tests
  const collections = await mongoose.connection.db.collections()
  for (let collection of collections) {
    await collection.deleteMany({})
  }
})

test('full poll flow: create poll, broadcast message, attendee votes, dashboard reflects results', async () => {
  // 1) Register organizer
  const orgRes = await request(app).post('/api/auth/register').send({
    name: 'Organizer',
    email: 'org@example.com',
    password: 'password',
    role: 'organizer',
  })
  expect(orgRes.statusCode).toBe(201)
  const orgToken = orgRes.body.token

  // 2) Register attendee
  const attRes = await request(app).post('/api/auth/register').send({
    name: 'Attendee',
    email: 'att@example.com',
    password: 'password',
  })
  expect(attRes.statusCode).toBe(201)
  const attToken = attRes.body.token

  // 3) Organizer creates an event
  const eventRes = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${orgToken}`)
    .send({
      title: 'Test Event',
      date: '2026-02-01',
      time: '10:00',
      venue: 'Test Venue',
      eventType: 'seminar',
      area: 'Test Area',
    })
  expect(eventRes.statusCode).toBe(201)
  const eventId = eventRes.body.event._id

  // 4) Attendee registers for event
  const regRes = await request(app).post('/api/registrations').set('Authorization', `Bearer ${attToken}`).send({ eventId })
  expect([200, 201]).toContain(regRes.statusCode)

  // 5) Organizer creates a poll
  const pollRes = await request(app)
    .post(`/api/polls/event/${eventId}`)
    .set('Authorization', `Bearer ${orgToken}`)
    .send({
      question: 'Which option?',
      description: 'Pick one',
      options: ['A', 'B', 'C'],
    })

  expect(pollRes.statusCode).toBe(201)
  const poll = pollRes.body.data
  expect(poll.question).toBe('Which option?')

  // 6) Attendee should see poll as a message
  const messagesRes = await request(app).get('/api/messages').set('Authorization', `Bearer ${attToken}`)
  expect(messagesRes.statusCode).toBe(200)
  const messages = messagesRes.body.messages
  const pollMessage = messages.find((m) => m.messageType === 'poll' && m.event && m.event._id && m.event._id.toString() === eventId)
  expect(pollMessage).toBeDefined()
  // Ensure message references the created poll
  expect(pollMessage.pollId).toBeDefined()

  // 7) Attendee votes on message
  const voteRes = await request(app)
    .post(`/api/messages/${pollMessage._id}/vote`)
    .set('Authorization', `Bearer ${attToken}`)
    .send({ optionIndex: 0 })

  expect(voteRes.statusCode).toBe(200)
  expect(voteRes.body.success).toBe(true)

  // 8) Check Poll results endpoint
  const resultsRes = await request(app).get(`/api/polls/${poll._id}/results`).set('Authorization', `Bearer ${attToken}`)
  expect(resultsRes.statusCode).toBe(200)
  const results = resultsRes.body.data
  expect(results.totalResponses).toBe(1)
  // option 0 should have one vote
  expect(results.results[0].votes).toBe(1)

  // 9) Organizer dashboard should reflect poll results
  const dashboardRes = await request(app).get(`/api/events/${eventId}/dashboard`).set('Authorization', `Bearer ${orgToken}`)
  expect(dashboardRes.statusCode).toBe(200)
  const dashboard = dashboardRes.body.dashboard
  const dashboardPoll = dashboard.polls.find((p) => p._id.toString() === poll._id.toString())
  expect(dashboardPoll).toBeDefined()
  expect(dashboardPoll.totalResponses).toBe(1)
})
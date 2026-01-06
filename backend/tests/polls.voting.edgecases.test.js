const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

let mongoServer
let app
const connectDB = require('../config/database')

beforeAll(async () => {
  // Load env file explicitly
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

  // Prefer external MONGO_URI if available to avoid mongod binary download issues on some systems
  if (process.env.MONGO_URI) {
    console.log('[tests] Using MONGO_URI from environment; skipping mongodb-memory-server')
  } else {
    mongoServer = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongoServer.getUri()
    console.log('[tests] Using mongodb-memory-server')
  }

  process.env.JWT_SECRET = 'testsecret'

  await connectDB()
  app = require('../server')
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) await mongoServer.stop()
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()
  for (let collection of collections) {
    await collection.deleteMany({})
  }
})

test('single-select voting: changing vote replaces previous and poll blocks votes after close', async () => {
  // Setup organizer & attendee
  const orgRes = await request(app).post('/api/auth/register').send({ name: 'Org2', email: 'org2@example.com', password: 'password', role: 'organizer' })
  const orgToken = orgRes.body.token
  const attRes = await request(app).post('/api/auth/register').send({ name: 'User2', email: 'user2@example.com', password: 'password' })
  const attToken = attRes.body.token

  // Create event & register attendee
  const eventRes = await request(app).post('/api/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'E2', date: '2026-03-01', time: '12:00', venue: 'V', eventType: 'meet', area: 'A' })
  const eventId = eventRes.body.event._id
  await request(app).post('/api/registrations').set('Authorization', `Bearer ${attToken}`).send({ eventId })

  // Create poll
  const pollRes = await request(app).post(`/api/polls/event/${eventId}`).set('Authorization', `Bearer ${orgToken}`).send({ question: 'Pick', options: ['X', 'Y'] })
  const poll = pollRes.body.data

  // Get poll message
  const messagesRes = await request(app).get('/api/messages').set('Authorization', `Bearer ${attToken}`)
  const pollMsg = messagesRes.body.messages.find((m) => m.messageType === 'poll' && m.pollId)
  expect(pollMsg).toBeDefined()

  // Vote option 0
  await request(app).post(`/api/messages/${pollMsg._id}/vote`).set('Authorization', `Bearer ${attToken}`).send({ optionIndex: 0 })

  // Change vote to option 1 (single-select should replace previous vote)
  const changeRes = await request(app).post(`/api/messages/${pollMsg._id}/vote`).set('Authorization', `Bearer ${attToken}`).send({ optionIndex: 1 })
  expect(changeRes.statusCode).toBe(200)

  // Check poll results - should reflect single response for option 1
  const resultsRes2 = await request(app).get(`/api/polls/${poll._id}/results`).set('Authorization', `Bearer ${attToken}`)
  expect(resultsRes2.statusCode).toBe(200)
  expect(resultsRes2.body.data.totalResponses).toBe(1)
  expect(resultsRes2.body.data.results[0].votes).toBe(0)
  expect(resultsRes2.body.data.results[1].votes).toBe(1)

  // Organizer closes the poll
  const closeRes = await request(app).put(`/api/polls/${poll._id}/status`).set('Authorization', `Bearer ${orgToken}`).send({ isActive: false })
  expect(closeRes.statusCode).toBe(200)

  // Attempting to vote after close should be rejected
  const postClose = await request(app).post(`/api/messages/${pollMsg._id}/vote`).set('Authorization', `Bearer ${attToken}`).send({ optionIndex: 0 })
  expect(postClose.statusCode).toBe(400)
  expect(postClose.body.error).toMatch(/closed/i)

  // Verify poll is inactive
  const finalResults = await request(app).get(`/api/polls/${poll._id}/results`).set('Authorization', `Bearer ${orgToken}`)
  expect(finalResults.body.data.isActive).toBe(false)
})

test('multi-select message poll toggles votes correctly', async () => {
  // Setup organizer & attendee
  const orgRes = await request(app).post('/api/auth/register').send({ name: 'Org3', email: 'org3@example.com', password: 'password', role: 'organizer' })
  const orgToken = orgRes.body.token
  const attRes = await request(app).post('/api/auth/register').send({ name: 'User3', email: 'user3@example.com', password: 'password' })
  const attToken = attRes.body.token

  // Create event & register attendee
  const eventRes = await request(app).post('/api/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'E3', date: '2026-04-01', time: '15:00', venue: 'V', eventType: 'meet', area: 'A' })
  const eventId = eventRes.body.event._id
  await request(app).post('/api/registrations').set('Authorization', `Bearer ${attToken}`).send({ eventId })

  // Organizer sends a message-type poll with multi-select true
  const msgRes = await request(app).post(`/api/messages/event/${eventId}`).set('Authorization', `Bearer ${orgToken}`).send({
    title: 'MultiPoll',
    content: 'Choose any',
    messageType: 'poll',
    pollOptions: ['A', 'B', 'C'],
    pollMultiSelect: true,
  })
  expect(msgRes.statusCode).toBe(201)
  const msg = msgRes.body.data

  // Attendee votes option 0 and 1
  const v1 = await request(app).post(`/api/messages/${msg._id}/vote`).set('Authorization', `Bearer ${attToken}`).send({ optionIndex: 0 })
  expect(v1.statusCode).toBe(200)
  const v2 = await request(app).post(`/api/messages/${msg._id}/vote`).set('Authorization', `Bearer ${attToken}`).send({ optionIndex: 1 })
  expect(v2.statusCode).toBe(200)

  // Ensure both options now have votes
  const getMsg = await request(app).get('/api/messages').set('Authorization', `Bearer ${attToken}`)
  const found = getMsg.body.messages.find((m) => m._id === msg._id)
  expect(found).toBeDefined()
  const userVotes = found.userVotes
  expect(userVotes.sort()).toEqual([0, 1])

  // Toggling option 1 again should remove it
  const toggle = await request(app).post(`/api/messages/${msg._id}/vote`).set('Authorization', `Bearer ${attToken}`).send({ optionIndex: 1 })
  expect(toggle.statusCode).toBe(200)
  const afterToggle = await request(app).get('/api/messages').set('Authorization', `Bearer ${attToken}`)
  const found2 = afterToggle.body.messages.find((m) => m._id === msg._id)
  expect(found2.userVotes).toEqual([0])
})
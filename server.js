require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb')
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI

const express = require('express')
const port = 3000

const app = express()
app.use(express.json())
app.use(express.static('public', {index: 'false'}))

const session = require('express-session')
const bcrypt = require('bcryptjs')
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}))

const path = require('path')

// Define the number of days until the deadline for each priority level
const PRIORITY_DEADLINE_DAYS = {
  'high': 1,
  'medium': 3,
  'low': 7
}

// Function to add derived fields (here it's the deadline) to each task
const addDerivedFields = function(row) {
  const deadlineDays = PRIORITY_DEADLINE_DAYS[row.priority] ?? 5;
  const createdDate = new Date(row.created);
  const deadlineDate = new Date(createdDate);
  deadlineDate.setDate(createdDate.getDate() + deadlineDays);
  
  return {
    id: row._id.toString(),
    task: row.task,
    priority: row.priority,
    created: row.created,
    deadline: deadlineDate.toISOString().slice(0, 10)
  }
}

// Function to return the appdata with derived fields added
const withDerivedData = function() {
  return appdata.map( addDerivedFields )
}

const sendJSON = function( response, data ) {
  response.writeHead( 200, "OK", {'Content-Type': 'application/json' })
  response.end( JSON.stringify( data ) )
}

const main = async function() {
  if (!MONGO_URI) {
    throw new Error('Missing MongoDB connection string. Set MONGO_URI or MONGODB_URI in your .env file.')
  }

  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('Connected to MongoDB')

  const db = client.db('a3tasktracker')
  const tasks = db.collection('tasks')
  const users = db.collection('users')

  app.get( '/', function( req, res ) {
    if( req.session && req.session.username ) return res.redirect( '/app' )
    res.sendFile( path.join( __dirname, 'public', 'index.html' ) )
  })

  app.get( '/app', function( req, res ) {
    if( !req.session || !req.session.username ) return res.redirect( '/' )
    res.sendFile( path.join( __dirname, 'public', 'app.html' ) )
  })

  app.get('/data', async function (req, res) {
    const rows = await tasks.find({}).toArray()
    res.json(rows.map(addDerivedFields))
  })

  //Debug 
  app.get( '/whoami', function( req, res ) {
    res.json({ username: ( req.session && req.session.username ) || null })
  })

  app.post('/login', async function (req, res) {
    const username = String( req.body.username || '' ).trim()
    const password = String( req.body.password || '' )

    if( !username || !password ) {
      return res.status( 400 ).json({ error: 'Username and password are required.' })
    }

    const existingUser = await users.findOne({ username })
    
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await users.insertOne({ username, password: hashedPassword })
      req.session.username = username
      return res.json({ ok: true, created: true })
    }

    const match = await bcrypt.compare( password, existingUser.password )
    if( !match ) {
      return res.status( 401 ).json({ error: 'Incorrect password.' })
    }

    req.session.username = username
    res.json({ ok: true, created: false })
  })

  app.post('/data', async function (req, res) {
    const task = String( req.body.task || '' ).trim()
    const priority = [ 'low', 'medium', 'high' ].includes( req.body.priority ) ? req.body.priority : 'medium'
    const created = req.body.created || new Date().toISOString().slice( 0, 10 )

    if( task.length > 0 ) {
      await tasks.insertOne({ task, priority, created })
    }

    const rows = await tasks.find({}).toArray()
    res.json( rows.map( addDerivedFields ) )
  })

  app.put( '/data', async function( req, res ) {
    const update = {}
    if( req.body.task !== undefined ) update.task = String( req.body.task ).trim()
    if( req.body.priority !== undefined ) update.priority = req.body.priority
    if( req.body.created !== undefined ) update.created = req.body.created

    if( req.body.id ) {
      await tasks.updateOne( { _id: new ObjectId( req.body.id ) }, { $set: update } )
    }

    const rows = await tasks.find({}).toArray()
    res.json( rows.map( addDerivedFields ) )
  })

  app.delete( '/data', async function( req, res ) {
    if( req.body.id ) {
      await tasks.deleteOne({ _id: new ObjectId( req.body.id ) })
    }

    const rows = await tasks.find({}).toArray()
    res.json( rows.map( addDerivedFields ) )
  })

  app.listen(process.env.PORT || port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

main().catch(err => {
  console.error('Error starting the server:', err)
  process.exit(1)
})

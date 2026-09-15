const express = require('express')
const port = 3000

const app = express()
app.use(express.json())
app.use(express.static('public'))

let nextId = 4
const appdata = [
  { id: 1, task: 'Finish assignment 2', priority: 'high', created: '2026-09-05' },
  { id: 2, task: 'Read chapter 4', priority: 'medium', created: '2026-09-05' },
  { id: 3, task: 'Water the plants', priority: 'low', created: '2026-09-05' }
]

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
  
  return Object.assign( {}, row, {
    deadline: deadlineDate.toISOString().slice( 0, 10 ) // Format as YYYY-MM-DD
  })
}

// Function to return the appdata with derived fields added
const withDerivedData = function() {
  return appdata.map( addDerivedFields )
}

app.get('/data', (req, res) => {
  res.json(withDerivedData())
})

app.post('/data', (req, res) => {
  const newRow = {
    id: nextId++,
    task: String(req.body.task || '').trim(),
    priority: ['low', 'medium', 'high'].includes(req.body.priority) ? req.body.priority : 'medium',
    created: req.body.created || new Date().toISOString().slice(0, 10)
  }

  if (newRow.task.length > 0) {
    appdata.push(newRow)
  }

  res.json(withDerivedData())
})

app.put('/data', (req, res) => {
  const id = parseInt(req.body.id, 10)
  const row = appdata.find(r => r.id === id)

  if (row) {
    if (req.body.task !== undefined) row.task = String(req.body.task).trim()
    if (req.body.priority !== undefined) row.priority = req.body.priority
    if (req.body.created !== undefined) row.created = req.body.created
  }

  res.json(withDerivedData())
})

app.delete('/data', (req, res) => {
  const id = parseInt(req.body.id, 10)
  const index = appdata.findIndex(r => r.id === id)

  if (index !== -1) {
    appdata.splice(index, 1)
  }

  res.json(withDerivedData())
})

app.listen(process.env.PORT || port, () => {
  console.log(`Server is running on port ${port}`)
})

const sendJSON = function( response, data ) {
  response.writeHead( 200, "OK", {'Content-Type': 'application/json' })
  response.end( JSON.stringify( data ) )
}

const http = require( 'http' ),
      fs   = require( 'fs' ),
      // IMPORTANT: you must run `npm install` in the directory for this assignment
      // to install the mime library if you're testing this on your local machine.
      // On Render, make sure `npm install` is your build command.
      mime = require( 'mime' ),
      dir  = 'public/',
      port = 3000

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

const server = http.createServer( function( request,response ) {
  if( request.method === 'GET' ) {
    handleGet( request, response )    
  } else if( request.method === 'POST' ){
    handlePost( request, response ) 
  } else if( request.method === 'PUT' ) {
    handlePut( request, response )
  } else if( request.method === 'DELETE' ) {
    handleDelete( request, response )
  }
})

const handleGet = function( request, response ) {
  if( request.url === '/' ) {
    sendFile( response, 'public/index.html' )
  }else if( request.url === '/data' ) {
    sendJSON( response, withDerivedData() )
  }else{ // request for static file
    const filename = dir + request.url.slice( 1 )
    sendFile( response, filename )
  }
}

// Handle POST requests to add a new task
const handlePost = function( request, response ) {
  readBody( request, function( body ) {
    const newRow = {
      id: nextId++,
      task: String( body.task || '' ).trim(),
      priority: [ 'low', 'medium', 'high' ].includes( body.priority ) ? body.priority : 'medium',
      created: body.created || new Date().toISOString().slice( 0, 10 )
    }

    if( newRow.task.length > 0 ) {
      appdata.push( newRow )
    }

    sendJSON( response, withDerivedData() )
  })
}

// Handle PUT requests to update an existing task
const handlePut = function( request, response ) {
  readBody( request, function( body ) {
    const id = parseInt( body.id, 10 )
    const row = appdata.find( r => r.id === id )

    if( row ) {
      if( body.task !== undefined ) row.task = String( body.task ).trim()
      if( body.priority !== undefined ) row.priority = body.priority
      if( body.created !== undefined ) row.created = body.created
    }

    sendJSON( response, withDerivedData() )
  })
}

// Handle DELETE requests to remove a task
const handleDelete = function( request, response ) {
  readBody( request, function( body ) {
    const id = parseInt( body.id, 10 )
    const index = appdata.findIndex( r => r.id === id )

    if( index !== -1 ) {
      appdata.splice( index, 1 )
    }

    sendJSON( response, withDerivedData() )
  })
}

// Helper function to read the body of a request and parse it as JSON
const readBody = function( request, callback ) {
  let dataString = ''
  
  request.on( 'data', function( data ) {
      dataString += data 
  })

  request.on( 'end', function() {
    let parsed = {}
    try {
      parsed = dataString ? JSON.parse( dataString ) : {}
    } catch( e ) {
      parsed = {}
    }
    callback( parsed )
  })
}

const sendJSON = function( response, data ) {
  response.writeHead( 200, "OK", {'Content-Type': 'application/json' })
  response.end( JSON.stringify( data ) )
}

const sendFile = function( response, filename ) {
   const type = mime.getType( filename ) 

   fs.readFile( filename, function( err, content ) {

     // if the error = null, then we've loaded the file successfully
     if( err === null ) {

       // status code: https://httpstatuses.com
       response.writeHeader( 200, { 'Content-Type': type })
       response.end( content )

     }else{

       // file not found, error code 404
       response.writeHeader( 404 )
       response.end( '404 Error: File Not Found' )

     }
   })
}

server.listen( process.env.PORT || port )

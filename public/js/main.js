// FRONT-END (CLIENT) JAVASCRIPT HERE

let editingId = null // tracks whether the form is in "add" or "edit" mode

const elm = ( selector ) => document.querySelector( selector )

// Rendering

const renderRows = function( data ) {
  const body = elm( '#results-body' )
  const emptyMessage = elm( '#no-tasks-msg' )

  body.innerHTML = ''

  if( data.length === 0 ) {
    emptyMessage.classList.remove( 'hidden' )
    return
  }
  emptyMessage.classList.add( 'hidden' )

  data.forEach( function( row ) {
    const tr = document.createElement( 'tr' )
    tr.dataset.id = row.id

    tr.innerHTML = `
      <td>${ escapeHTML( row.task ) }</td>
      <td><span class="priority-badge priority-${ row.priority }">${ row.priority }</span></td>
      <td>${ row.created }</td>
      <td>${ row.deadline }</td>
      <td class="row-actions">
        <button type="button" class="edit-btn" data-id="${ row.id }">Edit</button>
        <button type="button" class="delete-btn" data-id="${ row.id }">Delete</button>
      </td>
    `
    body.appendChild( tr )
  })
}

const escapeHTML = function( str ) {
  const div = document.createElement( 'div' )
  div.textContent = str
  return div.innerHTML
}

// Data fetching 

const loadData = async function() {
  const response = await fetch( '/data' )
  const data = await response.json()
  renderRows( data )
  return data
}

// Form handling 

const resetForm = function() {
  editingId = null
  elm( '#task-form' ).reset()
  elm( '#created' ).valueAsDate = new Date()
  elm( '#submit-btn' ).textContent = 'Add Task'
  elm( '#cancel-edit-btn' ).classList.add( 'hidden' )
}

const startEdit = function( row ) {
  editingId = row.id
  elm( '#task' ).value = row.task
  elm( '#priority' ).value = row.priority
  elm( '#created' ).value = row.created
  elm( '#submit-btn' ).textContent = 'Save Changes'
  elm( '#cancel-edit-btn' ).classList.remove( 'hidden' )
  elm( '#task' ).focus()
}

const handleSubmit = async function( event ) {
  event.preventDefault()

  const json = {
    task: elm( '#task' ).value,
    priority: elm( '#priority' ).value,
    created: elm( '#created' ).value
  }

  let response
  if( editingId === null ) {
    response = await fetch( '/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( json )
    })
  }else{
    json.id = editingId
    response = await fetch( '/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( json )
    })
  }

  const data = await response.json()
  renderRows( data )
  resetForm()
}

const handleTableClick = async function( event ) {
  const target = event.target
  const id = parseInt( target.dataset.id, 10 )
  if( !id ) return

  if( target.classList.contains( 'delete-btn' ) ) {
    const response = await fetch( '/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const data = await response.json()
    renderRows( data )
    if( editingId === id ) resetForm()
  }

  if( target.classList.contains( 'edit-btn' ) ) {
    const data = await loadData()
    const row = data.find( r => r.id === id )
    if( row ) startEdit( row )
  }
}

window.onload = function() {
  elm( '#created' ).valueAsDate = new Date()
  elm( '#task-form' ).addEventListener( 'submit', handleSubmit )
  elm( '#results-body' ).addEventListener( 'click', handleTableClick )
  elm( '#cancel-edit-btn' ).addEventListener( 'click', resetForm )
  loadData()
}

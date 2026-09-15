// FRONT-END (CLIENT) JAVASCRIPT — main app page

let editingId = null // tracks whether the form is in "add" or "edit" mode

const el = ( selector ) => document.querySelector( selector )

const renderRows = function( data ) {
  const body = el( '#results-body' )
  const emptyMessage = el( '#empty-message' )

  body.innerHTML = ''

  if( data.length === 0 ) {
    emptyMessage.classList.remove( 'd-none' )
    return
  }
  emptyMessage.classList.add( 'd-none' )

  data.forEach( function( row ) {
    const tr = document.createElement( 'tr' )
    tr.dataset.id = row.id

    const badgeClass = {
      high: 'text-bg-danger',
      medium: 'text-bg-warning',
      low: 'text-bg-success'
    }[ row.priority ] || 'text-bg-secondary'

    tr.innerHTML = `
      <td>${ escapeHTML( row.task ) }</td>
      <td><span class="badge ${ badgeClass } text-capitalize">${ row.priority }</span></td>
      <td>${ row.created }</td>
      <td>${ row.deadline }</td>
      <td class="d-flex gap-2">
        <button type="button" class="btn btn-sm btn-outline-secondary edit-btn" data-id="${ row.id }">Edit</button>
        <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-id="${ row.id }">Delete</button>
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

const loadData = async function() {
  const response = await fetch( '/data' )

  if( response.status === 401 ) {
    window.location.href = '/'
    return []
  }

  const data = await response.json()
  renderRows( data )
  return data
}

const loadWhoAmI = async function() {
  const response = await fetch( '/whoami' )
  const data = await response.json()

  if( !data.username ) {
    window.location.href = '/'
    return
  }

  el( '#current-username' ).textContent = data.username
}

const getSelectedPriority = function() {
  const checked = document.querySelector( 'input[name="priority"]:checked' )
  return checked ? checked.value : 'medium'
}

const setSelectedPriority = function( value ) {
  const target = document.querySelector( `input[name="priority"][value="${ value }"]` )
  if( target ) target.checked = true
}

const resetForm = function() {
  editingId = null
  el( '#task-form' ).reset()
  el( '#created' ).valueAsDate = new Date()
  setSelectedPriority( 'medium' )
  el( '#submit-btn' ).textContent = 'Add Task'
  el( '#cancel-edit-btn' ).classList.add( 'd-none' )
}

const startEdit = function( row ) {
  editingId = row.id
  el( '#task' ).value = row.task
  setSelectedPriority( row.priority )
  el( '#created' ).value = row.created
  el( '#submit-btn' ).textContent = 'Save Changes'
  el( '#cancel-edit-btn' ).classList.remove( 'd-none' )
  el( '#task' ).focus()
}

const handleSubmit = async function( event ) {
  event.preventDefault()

  const json = {
    task: el( '#task' ).value,
    priority: getSelectedPriority(),
    created: el( '#created' ).value
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

  if( response.status === 401 ) {
    window.location.href = '/'
    return
  }

  const data = await response.json()
  renderRows( data )
  resetForm()
}

const handleTableClick = async function( event ) {
  const target = event.target
  const id = target.dataset.id
  if( !id ) return

  if( target.classList.contains( 'delete-btn' ) ) {
    const response = await fetch( '/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if( response.status === 401 ) {
      window.location.href = '/'
      return
    }

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

const handleLogout = async function() {
  await fetch( '/logout', { method: 'POST' })
  window.location.href = '/'
}

window.onload = function() {
  el( '#created' ).valueAsDate = new Date()
  el( '#task-form' ).addEventListener( 'submit', handleSubmit )
  el( '#results-body' ).addEventListener( 'click', handleTableClick )
  el( '#cancel-edit-btn' ).addEventListener( 'click', resetForm )
  el( '#logout-btn' ).addEventListener( 'click', handleLogout )
  loadWhoAmI()
  loadData()
}

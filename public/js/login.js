// FRONT-END (CLIENT) JAVASCRIPT — login page

const el = ( selector ) => document.querySelector( selector )

const handleLogin = async function( event ) {
  event.preventDefault()

  const username = el( '#username' ).value.trim()
  const password = el( '#password' ).value
  const errorBox = el( '#login-error' )

  errorBox.classList.add( 'd-none' )
  errorBox.textContent = ''

  const response = await fetch( '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  const data = await response.json()

  if( !response.ok ) {
    errorBox.textContent = data.error || 'Something went wrong. Try again.'
    errorBox.classList.remove( 'd-none' )
    return
  }

  if( data.created ) {
    alert( `Welcome! We didn't find an existing account for "${ username }", so we created a new one for you.` )
  }

  window.location.href = '/app'
}

window.onload = function() {
  el( '#login-form' ).addEventListener( 'submit', handleLogin )
}

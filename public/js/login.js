const submitLogin = async function( event ) {
  event.preventDefault()

  const username = document.querySelector( '#username' ).value.trim()
  const password = document.querySelector( '#password' ).value

  const response = await fetch( '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  const data = await response.json()

  if( !response.ok ) {
    document.querySelector( '#login-error' ).textContent = data.error
    return
  }

  if( data.created ) {
    alert( `New account created for "${ username }"` )
  }

  window.location.href = '/app'
}

window.onload = function() {
  document.querySelector( '#login-form' ).addEventListener( 'submit', submitLogin )
}
$( ".darkToggle" ).on("click", function() {
  if( $( "body" ).hasClass( "dark" )) {
      $( "body" ).removeClass( "dark" );
      $( ".darkToggle" ).text( "OFF" );
  } else {
      $( "body" ).addClass( "dark" );
      $( ".darkToggle" ).text( "ON" );
  }
});
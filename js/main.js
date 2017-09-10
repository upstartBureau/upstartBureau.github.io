$(document).ready(function() {
  $('#link1').on('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    $('#arrow').animate({
      opacity: '1'
    }, 500);
    $('#about').animate(
      {
        right: '0px' // or -105
      },
      {
        duration: 500, 
        ease: 'easeInSine'
      });
  });

  $('#arrow').on('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    $(this).animate({
      opacity: '0'
    });
    $('#about').animate(
      {
        right: '-100%'
      },
      {
        duration: 500, 
        ease: 'easeInSine'
      });
  });
});
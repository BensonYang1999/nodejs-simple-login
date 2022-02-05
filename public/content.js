$(document).ready(function () {
    $.get({
        url: '/username',
        success: (data) => {
            $("#h1_title").text("Hello " + data + "!");
        }
    });
    $('#btn_logout').click(() => {
        $.get('/logout', () => window.location.replace('/home.html'));
        
    })
});
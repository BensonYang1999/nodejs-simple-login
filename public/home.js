const socket = io.connect(window.location.origin);

$(document).ready(function () {
    $("#login-form").submit((event) => {
        event.preventDefault();
        // var bcrypt = dcodeIO.bcrypt;
        // $('#pwd').val(bcrypt.hashSync($('#pwd').val(), 10));
        var formData = $("#login-form").serialize();
        // socket.emit("log", formData);
        $.get({
            url: '/login',
            data: formData,
            success: (data) => {
                // console.log(data);
                if (data == 'ok')
                    window.location.replace('/content.html')
                else{
                    alert(data);
                    $('#pwd').val('');
                }
                    
            }
        })
    });
    $('#btn_register').click(() => {
        $('#register-form').show();
        $('#login-form').hide();
        $('#btn_register').hide();
    });
    $("#register-form").submit((event) => {
        event.preventDefault();
        var formData = $("#register-form").serialize();
        $.get({
            url: '/register',
            data: formData,
            success: (data) => {
                // console.log(data);
                if (data == 'ok') {
                    alert("register successful!\nplease try to login.");
                    $('#register-form').hide();
                    $('#login-form').show();
                }
                else {
                    alert(data);
                }
            }
        })
    });
});
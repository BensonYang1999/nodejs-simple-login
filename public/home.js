const socket = io.connect(window.location.origin);

$(document).ready(function () {
    $("#login-form").submit((event) => {
        event.preventDefault();
        // var bcrypt = dcodeIO.bcrypt;
        // $('#pwd').val(bcrypt.hashSync($('#pwd').val(), 10));
        var formData = $("#login-form").serialize();
        // socket.emit("log", formData);
        $.post({
            url: '/login',
            data: formData,
            success: (data) => {
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
        $('#btn_back').show();
        $('#login-form').hide();
        $('#btn_register').hide();
    });
    $('#btn_back').click(()=>{
        $('#register-form').hide();
        $('#btn_back').hide();
        $('#login-form').show();
        $('#btn_register').show();
    });
    $("#register-form").submit((event) => {
        event.preventDefault();
        var formData = $("#register-form").serialize();
        $.post({
            url: '/register',
            data: formData,
            success: (data) => {
                // console.log(data);
                if (data == 'ok') {
                    alert("Registration success!\nPlease try to login.");
                    $('#register-form').hide();
                    $('#btn_back').hide();
                    $('#login-form').show();
                }
                else {
                    alert(data);
                }
            }
        })
    });
});

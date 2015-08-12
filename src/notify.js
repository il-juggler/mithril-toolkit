module.exports = notify;

function notify (status, text) {
    if(arguments.length < 2) {
        text  = status;
        status = 'success' 
    }
    var notif = $('<div class="global-notification">' + '<div class="alert alert-' + status + '">' + text + '</div></div>');
    
    notif.appendTo($('body'));
    
    setTimeout(function () {
        notif.remove();
    },2000)
};

var socket = io(); // Notice that I’m not specifying any URL when I call io(), since it defaults to trying to connect to the host that serves the page.

        //  When a user types in a message, the server should get a chat message event.
socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
});
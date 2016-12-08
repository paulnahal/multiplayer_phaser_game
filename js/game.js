var person = prompt("Please enter your name:");

var socket = io(); // Notice that I’m not specifying any URL when I call io(), since it defaults to trying to connect to the host that serves the page.
var clients_local_list = [];
        //  When a user types in a message, the server should get a chat message event.
socket.on('clients_update_from_server', function(data){
        clients_local_list = data;
        console.log(clients_local_list);
});
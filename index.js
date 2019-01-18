"use strict";

const http = require('http');

const requestModule = require('./Modules/Request');
const header = require('./Modules/Header');

const server = http.createServer(function (request, response) {
    switch (request.method) {
        case 'GET':
            requestModule.getRequest(request, response);
            break;
        case 'POST':
            requestModule.postRequest(request, response);
            break;
        default:
            response.writeHead(501, header['plain']);
            response.end();
            break;
    }
});

server.listen(8119);

console.log('Server up on port 8119');
# Weshare

This web app aims to enable peer to peer sharing of contents using the power of WebRTC.

WebRTC enables peer to peer sharing of contents and media thus removing the need for an intermediate server. Although for establishing connection it needs to use a signalling server and a STUN server but after that the connection is peer to peer.

This project uses node server as a signalling server. Signalling server uses socket io to enable sending of signalling messages between peers. The signalling server can be found in server folder.

Frontend is written in angular 8.
Node version 12.13.x is used for signalling server.

## Contribute
* Clone the project and run <b>npm install</b>.
* Open two consoles. 
* On one console run <b>ng serve</b>.
* On the other console run <b>npm run debug</b>
* In the browser open url <b>https://localhost:<i>PORT</i></b> where PORT is by default <b>8090</b> if not set by your environment variable.

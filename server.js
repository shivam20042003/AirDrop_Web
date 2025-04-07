import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

import { WebSocketServer} from 'ws';

const wss = new WebSocketServer({ port: 8080 });


const connectedSockets = [];

wss.on("connection",(socket)=>{
    socket.on("message",(e)=>{
        const conection = JSON.parse(e.toString());
        if (conection.type==="join") {
            connectedSockets.push({socket:socket,roomId:conection.payload.roomId});   
            console.log("user got in the room ID =",conection.payload.roomId);
        }
        else if(conection.type==="chat"){
            let currUserRoom = null;
            for (let index = 0; index < connectedSockets.length; index++) {
                if (connectedSockets[index].socket==socket) {
                    currUserRoom = connectedSockets[index].roomId ;
                }
            }
            const filteredUserAsPerId = connectedSockets.filter((y)=>{
                return y.roomId == currUserRoom ;
            })
            filteredUserAsPerId.map((y)=>{
                y.socket.send(conection.payload.message);
            })
        }
    })
})

const app = next({ dev, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url || '', true);
        const { pathname } = parsedUrl;

        if (pathname === '/_next') {
            return handler(req, res);
        }

        handler(req, res, parsedUrl);
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
'use client'
import { useEffect, useState } from "react";

function Home() {

  const [roomEnt,setRoomEnt] = useState(false);
  const [socket,setSocket] = useState<WebSocket>();
  const [input,setInput] = useState<string>();
  const [messages,setMessages] = useState<string[]>([]);
  type cp = {
      type: "join",
      payload: {roomId:string} 
  }|{
      type: "chat",
      payload: {message:string}
  }
  const joiningRoom1 = () =>{
    const sendMessP:cp = {
      type:"join",
      payload:{roomId:"hollaMan123"}
    }
    socket?.send(JSON.stringify(sendMessP));
    setRoomEnt(true);
  }
  const joiningRoom2 = () =>{
    const sendMessP:cp = {
      type:"join",
      payload:{roomId:"ManRoom@@@@123"}
    }
    socket?.send(JSON.stringify(sendMessP));
    setRoomEnt(true);
  }
  const sendMess = () =>{
    const sendMessP:cp = {
      type:"chat",
      payload:{message:input?input:"no mess"}
    }
    socket?.send(JSON.stringify(sendMessP));
  }
  useEffect(()=>{
    const newSocket = new WebSocket('ws://localhost:8080');
    newSocket.onmessage = (message) => {
      setMessages(m=>[...m,message.data]);
      console.log('Message received:', message.data, message.source);
    }
    setSocket(newSocket);
  },[])

  return (
    <div className=" flex flex-col items-center justify-center">
      {!roomEnt?(<div><button onClick={joiningRoom1}>Join Chat room 1</button><button onClick={joiningRoom2}>Join Chat room 2</button></div>):(
        <div>
          {messages.map((y,index)=>{
            return(
              <p key={index}> {y} <br /></p>
            )
          })}
        <input onChange={(e)=>setInput(e.target.value)} type="text" placeholder="message....." /><button onClick={sendMess}>Send</button>
        </div>
      )}
    </div>
  )
}

export default Home

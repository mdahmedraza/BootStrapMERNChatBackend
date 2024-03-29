

const express = require('express');
const app = express();
const User = require('./models/User');
const Message = require('./models/Message');
const rooms = ['general', 'tech', 'finance', 'crypto'];
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

require('dotenv/config');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use('/users', userRoutes);

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Declare members and roomMessages outside the socket connection
let members = [];
let roomMessages = {};

async function getLastMessagesFromRoom(room) {
  let messages = await Message.aggregate([
    { $match: { to: room } },
    { $group: { _id: '$date', messagesByDate: { $push: '$$ROOT' } } }
  ]);
  return messages;
}

function sortRoomMessagesByDate(messages) {
  return messages.sort(function (a, b) {
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');

    date1 = date1[2] + date1[0] + date1[1];
    date2 = date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1;
  });
}

//socket connection...
io.on('connection', (socket) => {
  socket.on('new-user', async () => {
    members = await User.find();
    io.emit('new-user', members);
  });

  socket.on('join-room', async (newRoom, previousRoom) => {
    socket.join(newRoom);
    socket.leave(previousRoom);
    roomMessages[newRoom] = await getLastMessagesFromRoom(newRoom);
    roomMessages[newRoom] = sortRoomMessagesByDate(roomMessages[newRoom]);
    socket.emit('room-messages', roomMessages[newRoom]);
  });

  socket.on('message-room', async (room, content, sender, time, date) => {
    console.log('new message', content);
    const newMessage = await Message.create({ content, from: sender, time, date, to: room });
    roomMessages[room] = sortRoomMessagesByDate(roomMessages[room]);
    // sending message to room
    io.to(room).emit('room-messages', roomMessages[room]);
    socket.broadcast.emit('notifications', room);
  });
  app.delete('/logout', async(req, res) => {
    try{
      const {_id, newMessage}=req.body;
      const user = await User.findById(_id);
      user.status="offline",
      user.newMessage=newMessage;
      await user.save();
      const members = await User.find();
      socket.broadcast.emit('new-user', members);
      res.status(200).send();
    }catch(e){
      console.log(e);
      res.status(400).send()
    }
  })
});

app.get('/rooms', (req, res) => {
  res.json(rooms);
});

// Require your database connection
require('./connection');

server.listen(process.env.PORT, () => {
  console.log('Listening on port', process.env.PORT);
});

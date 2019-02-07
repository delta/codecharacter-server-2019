const connections = { };
const disconnectHandler = (socketId, userId) => {
  // delete socketId from connections[userId]
  delete connections[userId][socketId];
};
const { Notification } = require('../models');

module.exports.handleConnections = (socket) => {
  // get socketId and userId from cookies
  let cookies = socket.handshake.headers.cookie;
  cookies = cookies.split(';');
  let socketId;
  let userId;
  cookies.foreach((cookie) => {
    // cookies are separated by ' ' and before start of each string, spaces are stripped
    if (cookie.replace(/ /g, '').slice(0, 2) === 'io') {
      [, socketId] = cookie.split('=');
    } else if (cookie.replace(/ /g, '').slice(0, 6) === 'userId') {
      [, userId] = cookie.split('=');
    }
  });

  // save socketId to user's connections
  if (!connections[userId]) {
    connections[userId] = {};
  }
  if (!connections[userId][socketId]) {
    connections[userId][socketId] = socket;
  }

  socket.on('disconnect', disconnectHandler.bind(null, socketId, userId));
};

module.exports.sendMessage = async (userId, message, type) => {
  const { title, content } = message;
  // get socketIds of connections by userId
  if (!connections[userId]) {
    connections[userId] = {};
  }
  const socketIds = Object.keys(connections[userId]);

  // if length of socketIds is 0, add messages to notifications - sww
  if (!socketIds.length) {
    await Notification.create({
      type,
      title,
      content,
      userId,
    });
  } else {
    // send message to each socketId
    socketIds.foreach((socketId) => {
      connections[userId][socketId].emit(type, JSON.stringify(message));
    });
  }
};

module.exports.connections = connections;

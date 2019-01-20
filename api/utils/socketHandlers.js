const connections = { };
const disconnectHandler = (socketId, userId) => {
  delete connections[userId][socketId];
};
module.exports.handleConnections = (socket) => {
  let cookies = socket.handshake.headers.cookie;
  cookies = cookies.split(';');
  let socketId;
  let userId;
  cookies.map((cookie) => {
    if (cookie.replace(/ /g, '').slice(0, 2) === 'io') {
      [, socketId] = cookie.split('=');
    } else if (cookie.replace(/ /g, '').slice(0, 6) === 'userId') {
      [, userId] = cookie.split('=');
    }
    return null;
  });

  if (!connections[userId]) {
    connections[userId] = {};
  }
  if (!connections[userId][socketId]) {
    connections[userId][socketId] = socket;
  }

  socket.on('disconnect', disconnectHandler.bind(null, socketId, userId));
};

module.exports.sendMessage = (userId, message, type) => {
  const socketIds = Object.keys(connections[userId]);
  socketIds.map((socketId) => {
    connections[userId][socketId].emit(type, message);
    return null;
  });
};

module.exports.connections = connections;

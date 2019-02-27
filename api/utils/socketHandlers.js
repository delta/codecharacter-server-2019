const NotificationUtils = require('./notifications');

const connections = { };

const disconnectHandler = (socketId, userId) => {
  // delete socketId from connections[userId]
  delete connections[userId][socketId];
};

const sendMessage = (userId, message, type) => {
  // get socketIds of connections by userId
  if (!connections[userId]) return;
  const socketIds = Object.keys(connections[userId]);
  // send message to each socketId of user
  socketIds.forEach((socketId) => {
    connections[userId][socketId].emit(type, message);
  });
};

const broadcastNotification = async (notificationId, message) => {
  const userIds = Object.keys(connections);

  const deletions = [];
  userIds.forEach((userId) => {
    const socketIds = Object.keys(connections[userId]);
    // send message to each socketId of user
    socketIds.forEach((socketId) => {
      connections[userId][socketId].emit('Info', message);
    });
    deletions.push(NotificationUtils.deleteGlobalNotification(notificationId, userId));
  });

  await Promise.all(deletions);
};

const handleConnections = async (socket) => {
  try {
    // get socketId and userId from cookies
    let cookies = socket.handshake.headers.cookie;
    cookies = cookies.split(';');
    let socketId;
    let userId;
    cookies.forEach((cookie) => {
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

    try {
      const globalNotifications = await NotificationUtils.getUnreadGlobalNotifications(userId);

      const deletions = [];
      globalNotifications.forEach((notification) => {
        sendMessage(userId, notification.message, 'Info');
        deletions.push(NotificationUtils.deleteGlobalNotification(notification.id, userId));
      });

      await Promise.all(deletions);
    } catch (err) {
      console.log(err);
    }

    socket.on('disconnect', disconnectHandler.bind(null, socketId, userId));
  } catch (err) {
    console.log(err);
  }
};

const disconnectUser = (userId) => {
  if (connections[userId] === undefined) return;
  // get socketIds of connections by userId
  const socketIds = Object.keys(connections[userId]);
  // delete each socketId of user
  socketIds.forEach((socketId) => {
    disconnectHandler(socketId, userId);
  });
};

module.exports = {
  sendMessage,
  handleConnections,
  disconnectUser,
  connections,
  broadcastNotification,
};

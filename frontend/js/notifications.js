const notficationsDom = document.querySelector('.notifications')

const cleanNotifications = () => {
  addNotification('')
}

const addNotification = (message) => {
  notficationsDom.innerHTML = message;
}

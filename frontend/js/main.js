const apiHost = '__CFG_PL_WEB_API_HOST__'
const apiToken = '__CFG_PL_WEB_API_TOKEN__'
const apiUrl = `${apiHost}/?t=${apiToken}`

const execCmd = (cmd, callback, callbackArg) => {
  fetch(`${apiUrl}&cmd=${cmd}`)
    .then(r => r.json())
    .then(data => {
      callback(data.stdout, callbackArg)
    })
    .catch(err => {
      console.log(err)
      addNotification('Error: network error')
    })
}

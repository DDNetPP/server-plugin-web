let oldServerLog = ''
let oldCrashes = ''
let oldBuildError = false

const buildStatusDom = document.querySelector('#build-status')
const buildStatusWrapperDom = document.querySelector('.build-status-wrapper')
const serverLogContainerDom = document.querySelector('#server-log-container')
const crashesContainerDom = document.querySelector('#crashes-container')

serverLogContainerDom.addEventListener('click', () => {
    window.location.href = 'server_log.txt'
})
crashesContainerDom.addEventListener('click', () => {
    window.location.href = 'crashes.txt'
})

const fetchLogs = () => {
    fetch('server_log.txt')
        .then(raw => raw.text())
        .then((data) => {
            serverLogContainerDom.innerHTML = data
            if (oldServerLog !== data) {
                serverLogContainerDom.scrollTop = serverLogContainerDom.scrollHeight;
            }
            oldServerLog = data
        })
    fetch('crashes.txt')
        .then(raw => raw.text())
        .then((data) => {
            crashesContainerDom.innerHTML = data
            if (oldCrashes !== data) {
                crashesContainerDom.scrollTop = crashesContainerDom.scrollHeight;
            }
            oldCrashes = data
        })
    fetch('raw_build.txt')
        .then(raw => raw.text())
        .then((data) => {
            if (data.search("error: ") === -1) {
                if (oldBuildError || buildStatusDom.innerHTML === 'LOADING') {
                    buildStatusDom.innerHTML = 'OK'
                    buildStatusWrapperDom.style.border = '5px solid green'
                    buildStatusDom.style.color = 'green'
                }
                oldBuildError = false
            } else {
                if (!oldBuildError || buildStatusDom.innerHTML === 'LOADING') {
                    buildStatusDom.innerHTML = 'FAILING'
                    buildStatusWrapperDom.style.border = '5px solid red'
                    buildStatusDom.style.color = 'red'
                }
                oldBuildError = true
            }
        })
}

fetchLogs()
setInterval(fetchLogs, 5000)

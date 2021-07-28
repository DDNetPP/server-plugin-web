let hasDatasets = false
const graphDom = document.querySelector('.cpu')

let chartObj
const MAX_CHAR_NODES = 20

const parseCpuNodes = (nodesStr) => {
  let i = 0
  const datasets = []
  if (chartObj) {
    const currentDate = new Date()
    const timeStamp = `${currentDate.getHours()}:${currentDate.getMinutes()}`
    chartObj.data.labels.push(timeStamp);
  }
  const nodes = JSON.parse(nodesStr)
  if (nodes[0].length === 0) {
    addNotification('server offline')
    console.log('server offline:' + nodes)
    return
  }
  nodes.forEach(node => {
    // const pid = node[0]
    const cpu = parseFloat(node[1], 10)
    const name = (i === 0 && nodes.length > 1) ? 'gdb' : `__CFG_SRV_NAME__${i > 1 ? i : ''}`
    // const cpuNode = `<div class="cpu-node">id=${i} cpu=${cpu} pid=${pid}</div>`
    // graphDom.insertAdjacentHTML('beforeend', cpuNode)
    if (!hasDatasets) {
      let dataset = {
        data: [],
        label: name,
        borderColor: (i === 0 && nodes.length > 1) ? '#21a321' : '#3e95cd',
        fill: false
      }
      datasets.push(dataset)
    } else {
      addData(chartObj, name, cpu)
      if (nodes.length > 1 && i === 1 || nodes.length == 1) {
        document.title = `${cpu} %`
      }
    }
    i++
  })
  if (!hasDatasets) {
    chartObj = createChart(datasets)
    hasDatasets = true;
  }
  if (chartObj.data.datasets[0].data.length > MAX_CHAR_NODES) {
    removeOldestData(chartObj)
  }
  // all went fine notifications are currently only errors so clean here
  cleanNotifications()
}

const onTick = () => {
  execCmd('cpu', parseCpuNodes)
}

onTick()
setInterval(onTick, 3000)

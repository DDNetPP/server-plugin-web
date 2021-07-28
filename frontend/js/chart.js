const createChart = (datasets) => {
  cleanNotifications()
  return new Chart(document.getElementById("line-chart"), {
    type: 'line',
    data: {
      labels: [],
      datasets: datasets
    },
    options: {
      title: {
        display: true,
        text: 'CPU usage'
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'time'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'cpu usage'
          },
          ticks: {
            callback: function(value, index, values) {
              return `${value} %`
            }
          }
        }]
      },
      responsive: true
    }
  })
}

const addData = (chart, type, data) => {
  chart.data.datasets.forEach((dataset) => {
    if (type === dataset.label) {
      dataset.data.push(data)
    }
  })
  chart.update()
}

const removeNewestData = (chart) => {
  chart.data.labels.pop()
  chart.data.datasets.forEach((dataset) => {
    dataset.data.pop()
  })
  chart.update()
}

const removeOldestData = (chart) => {
  chart.data.labels.shift()
  chart.data.datasets.forEach((dataset) => {
    dataset.data.shift()
  })
  chart.update()
}

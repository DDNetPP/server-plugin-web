const ipByNameForm = document.querySelector('form#ip_by_name')
const ipByNameName = document.querySelector('#arg_ip_by_name')
const nameByIpForm = document.querySelector('form#name_by_ip')
const nameByIpIp = document.querySelector('#arg_name_by_ip')
const accByNameForm = document.querySelector('form#acc_by_name')
const accByNameName = document.querySelector('#arg_acc_by_name')
const nameByAccForm = document.querySelector('form#name_by_acc')
const nameByAccName = document.querySelector('#arg_name_by_acc')
const filterIpForm = document.querySelector('form#filter_ip')
const filterIpIp = document.querySelector('#arg_filter_ip')
const resultDoms = document.querySelectorAll('code')

const generateResult = (result, type) => {
  let hrefResult = ''
  result.split('\n').forEach((row) => {
    if (type === 'plain') {
      hrefResult += `${row}\n`
      return
    }
    const regexp = /( +\d+ +)(.*)/
    const m = row.match(regexp)
    if (m) {
      hrefResult += `${m[1]}<a href="?${type}=${m[2]}">${m[2]}</a>\n`
    } else {
      hrefResult += `<strong>${row}</strong>\n`
    }
  })
  return hrefResult
}

const generateResultTraffic = (result, type) => {
  let hrefResult = ''
  result.split('\n').forEach((row) => {
    const regexp = /( +\d+ +)(.*)/
    const m = row.match(regexp)
    if (m) {
      let info = ''
      let ip = m[2]
      const split = m[2].split(' ')
      if (split.length > 1) {
        info = split.slice(1).join(' ')
        ip = split[0]
      }
      hrefResult += `${m[1]}<a href="?${type}=${ip}">${ip}</a> ${info}\n`
    } else {
      hrefResult += `<strong>${row}</strong>\n`
    }
  })
  return hrefResult
}

const generateResultLogfiles = (result, ipAddr) => {
  let hrefResult = ''
  result.split('\n').forEach((row) => {
    hrefResult += `<a href="?filter_ip=${ipAddr}&logfile=${row}">${row}</a>\n`
  })
  return hrefResult
}

const showResultIp = (result, type) => {
  resultDoms[0].innerHTML = generateResult(result, type)
}

const showResultAcc = (result, type) => {
  resultDoms[1].innerHTML = generateResult(result, type)
}

const showResultFilterIp = (result, ipAddr) => {
  if(result === '') {
    resultDoms[2].innerHTML = 'No matches found in latest logfile.'
    execCmd(`get_logfiles&args=${ipAddr}`, showResultGetLogfiles, ipAddr)
    return
  }
  resultDoms[2].innerHTML = result
}

const showResultGetLogfiles = (result, ipAddr) => {
  if(result === '' || result === undefined) {
    resultDoms[2].innerHTML = 'No matches found in any logfile.'
    return
  }
  resultDoms[2].innerHTML = 'No matches found in latest logfile.\n'
  resultDoms[2].innerHTML += 'Try one of the older ones that include your search:\n'
  resultDoms[2].innerHTML += generateResultLogfiles(result, ipAddr)
}

const showResultTraffic = (result) => {
  resultDoms[3].innerHTML = generateResultTraffic(result, 'arg_name_by_ip')
}

ipByNameForm.addEventListener('submit', (event) => {
  event.preventDefault()
  resultDoms[0].innerHTML = 'loading ...'
  execCmd(`ip_by_name&args=${ipByNameName.value}`, showResultIp, 'arg_name_by_ip')
})

nameByIpForm.addEventListener('submit', (event) => {
  event.preventDefault()
  resultDoms[0].innerHTML = 'loading ...'
  execCmd(`name_by_ip&args=${nameByIpIp.value}`, showResultIp, 'arg_ip_by_name')
})

accByNameForm.addEventListener('submit', (event) => {
  event.preventDefault()
  resultDoms[1].innerHTML = 'loading ...'
  execCmd(`acc_by_name&args=${accByNameName.value}`, showResultAcc, 'arg_name_by_acc')
})

nameByAccForm.addEventListener('submit', (event) => {
  event.preventDefault()
  resultDoms[1].innerHTML = 'loading ...'
  execCmd(`name_by_acc&args=${nameByAccName.value}`, showResultAcc, 'arg_acc_by_name')
})

filterIpForm.addEventListener('submit', (event) => {
  event.preventDefault()
  resultDoms[2].innerHTML = 'loading ...'
  execCmd(`filter_ip&args=${filterIpIp.value} latest`, showResultFilterIp, filterIpIp.value)
})

const url = new URL(document.location)
const ip_by_name = url.searchParams.get('arg_ip_by_name')
const name_by_ip = url.searchParams.get('arg_name_by_ip')
const acc_by_name = url.searchParams.get('arg_acc_by_name')
const name_by_acc = url.searchParams.get('arg_name_by_acc')
const filter_ip = url.searchParams.get('filter_ip')
const logfile = url.searchParams.get('logfile')
if (ip_by_name) {
  resultDoms[0].innerHTML = 'loading ...'
  execCmd(`ip_by_name&args=${ip_by_name}`, showResultIp, 'arg_name_by_ip')
}
if (name_by_ip) {
  resultDoms[0].innerHTML = 'loading ...'
  execCmd(`name_by_ip&args=${name_by_ip}`, showResultIp, 'arg_ip_by_name')
}
if (acc_by_name) {
  resultDoms[1].innerHTML = 'loading ...'
  execCmd(`acc_by_name&args=${acc_by_name}`, showResultAcc, 'arg_name_by_acc')
}
if (name_by_acc) {
  resultDoms[1].innerHTML = 'loading ...'
  execCmd(`name_by_acc&args=${name_by_acc}`, showResultAcc, 'arg_acc_by_name')
}
if (filter_ip) {
  resultDoms[2].innerHTML = 'loading ...'
  execCmd(`filter_ip&args=${filter_ip} ${logfile || 'latest'}`, showResultFilterIp, filter_ip)
}

const onTick = () => {
  execCmd('traffic', showResultTraffic)
}

onTick()
setInterval(onTick, 5000)

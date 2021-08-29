#!/usr/bin/env node

const fs = require('fs')
const http = require('http')
const { execSync } = require('child_process')
const { performance } = require('perf_hooks')

const PORT = 9303
const HOST = `http://localhost:${PORT}`
const TOKEN = process.env.PL_WEB_API_TOKEN

class ShellCommand {
  constructor (cmd) {
    this.cmd = cmd
    this.lastCache = 0
    this.lastRequest = null
    this.lastRequest2 = null
    this.cache = ''
  }

  run (arg, arg2) {
    const timeNow = performance.now()
    const diff = timeNow - this.lastCache
    if (diff < 2000 && arg === this.lastRequest && arg2 === this.lastRequest2) {
      return this.cache
    }
    this.lastCache = timeNow
    if (arg && arg2) {
      this.lastRequest = arg
      this.lastRequest2 = arg2
      arg = Buffer.from(arg).toString('base64')
      arg2 = Buffer.from(arg2).toString('base64')
      this.cache = execSync(`${this.cmd} "$(echo "${arg}" | base64 -d)" "$(echo "${arg2}" | base64 -d)"`).toString().replace(/\n+$/, '')
    } else if (arg) {
      this.lastRequest = arg
      this.lastRequest2 = null
      arg = Buffer.from(arg).toString('base64')
      this.cache = execSync(`${this.cmd} "$(echo "${arg}" | base64 -d)"`).toString().replace(/\n+$/, '')
    } else {
      this.cache = execSync(this.cmd).toString().replace(/\n+$/, '')
    }
    return this.cache
  }
}

const ShellCpu = new ShellCommand('bash ./lib/plugins/server-plugin-web/get_cpu.sh --script')
const ShellIpByName = new ShellCommand("cd $(./lib/eval_lib.sh 'echo $LOGS_PATH_FULL') && tw_get_ip_by_name")
const ShellNameByIp = new ShellCommand("cd $(./lib/eval_lib.sh 'echo $LOGS_PATH_FULL') && tw_get_name_by_ip")
const ShellAccByName = new ShellCommand('bash ./lib/plugins/server-plugin-web/bin/tw_get_acc_by_name -a')
const ShellNameByAcc = new ShellCommand('bash ./lib/plugins/server-plugin-web/bin/tw_get_name_by_acc -a')
const ShellEcon = new ShellCommand('bash ./lib/econ.sh')
const ShellGetLatestLog = new ShellCommand('./show_log.sh --filepath')
const ShellChatByIp = new ShellCommand('bash tw_filter_ip')

const log = (msg) => {
  const ts = new Date()
    .toISOString()
    .split('.')[0]
    .replace('T', ' ')
  console.log(`[${ts}] ${msg}`)
}

log(`starting server on ${HOST} ...`)

http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  log(`request ${request.url}`)
  const url = new URL(`${HOST}${request.url}`)
  const urlParams = new URLSearchParams(url.search)
  const token = urlParams.get('t')
  if (token !== TOKEN) {
    log('  invalid token')
    response.end(JSON.stringify({ error: 'invalid token' }))
    return
  }
  const cmd = urlParams.get('cmd')
  const args = urlParams.get('args') ? urlParams.get('args').split(' ') : []
  log(`  cmd '${cmd}' args: ${JSON.stringify(args)}`)
  if (cmd === 'cpu') {
    response.end(JSON.stringify({ message: 'cpu usage', stdout: ShellCpu.run() }))
  } else if (cmd === 'traffic') {
    response.end(JSON.stringify({ message: 'traffic', stdout: fs.readFileSync('logs/traffic.txt').toString() }))
  } else if (cmd === 'ip_by_name') {
    if (args[0] === undefined) {
      response.end(JSON.stringify({ error: 'missing arg: username' }))
      return
    }
    response.end(JSON.stringify({ message: 'ips used', stdout: ShellIpByName.run(args.join(' ')) }))
  } else if (cmd === 'name_by_ip') {
    if (args[0] === undefined) {
      response.end(JSON.stringify({ error: 'missing arg: ip' }))
      return
    }
    response.end(JSON.stringify({ message: 'names used', stdout: ShellNameByIp.run(args[0]) }))
  } else if (cmd === 'acc_by_name') {
    if (args[0] === undefined) {
      response.end(JSON.stringify({ error: 'missing arg: username' }))
      return
    }
    response.end(JSON.stringify({ message: 'names used', stdout: ShellAccByName.run(args.join(' ')) }))
  } else if (cmd === 'name_by_acc') {
    if (args[0] === undefined) {
      response.end(JSON.stringify({ error: 'missing arg: account' }))
      return
    }
    response.end(JSON.stringify({ message: 'names used', stdout: ShellNameByAcc.run(args[0]) }))
  } else if (cmd === 'filter_ip') {
    if (args[0] === undefined) {
      response.end(JSON.stringify({ error: 'missing arg: ip' }))
      return
    }
    if (args[1] === undefined) {
      response.end(JSON.stringify({ error: 'missing arg: logfile' }))
      return
    }
    const logPath = ShellGetLatestLog.run()
    response.end(JSON.stringify({ message: 'filter chat', stdout: ShellChatByIp.run(args[0], logPath) }))
  } else if (cmd === 'econ') {
    if (args[0] === undefined) {
      response.end(JSON.stringify({ error: 'missing arg: command' }))
      return
    }
    response.end(JSON.stringify({ message: 'econ', stdout: ShellEcon.run(args.join(' ')) }))
  } else {
    response.end(JSON.stringify({ error: 'invalid command' }))
  }
}).listen(PORT)

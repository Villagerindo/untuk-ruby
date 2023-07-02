console.log('Starting...')

import { join, dirname } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile, existsSync, readFileSync } from 'fs'
import cfonts from 'cfonts';
import { createInterface } from 'readline'
import Helper from './lib/helper.js'

import cp, { exec as _exec } from 'child_process'
import { promisify } from 'util'
let exec = promisify(_exec).bind(cp)
global.running = ""

// https://stackoverflow.com/a/50052194
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname) // Bring in the ability to create the 'require' method
const { name, author } = require(join(__dirname, './package.json')) // https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
const { say } = cfonts
const rl = createInterface(process.stdin, process.stdout)

say('BANYU\nUNYU UNYU', {
  font: 'block',
  align: 'center',
  colors: ['yellow']
})
say(`'${name}' By Villagerindo`, {
  font: 'console',
  align: 'center',
  colors: ['yellow']
})

var isRunning = false
/**
 * Start a js file
 * @param {String} file `path/to/file`
 */
function start(file) {
  if (isRunning) return
  isRunning = true
  let args = [join(__dirname, file), ...process.argv.slice(2)]
  say([process.argv[0], ...args].join(' '), {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta']
  })
  setupMaster({
    exec: args[0],
    args: args.slice(1),
  })
  let p = fork()
  p.on('message', data => {
    console.log('[RECEIVED]', data)
    switch (data) {
      case 'debounce':
        isRunning = false
        p.process.kill('SIGINT')
        watchFile(args[0], () => {
          unwatchFile(args[0])
          exec('start cmd.exe /K node index.js')
        })

        break
      case 'reset':
        isRunning = false
        // setTimeout(function () {watchFile(args[0], () => {
        //   unwatchFile(args[0])
        //   start(file)
        // })}, 15000)
        // let check = global.running
        // if (check === "cmd") {
        //   setTimeout(function () {
        //     exec(`start C:/"Program Files"/Git/git-cmd.exe /K node index.js --git-cmd && taskkill /IM cmd.exe`)
        //   }, 20000)
        // }
        // if (check === "git-cmd") {
        //   setTimeout(function () {
        //     exec(`start cmd.exe /K node index.js --cmd && taskkill /IM git-cmd.exe`)
        //   }, 20000)
        // }

        p.process.kill('SIGINT')
        // if (existsSync("./SATU")) {
        //   exec(`start "DUA" cmd.exe /K node index.js && copy NUL DUA && del SATU && taskkill /FI "WindowTitle eq Administrator: SATU"`)
        // }
        // if (existsSync("./DUA")) {
        //   exec(`start "SATU" cmd.exe /K node index.js && copy NUL SATU && del DUA && taskkill /FI "WindowTitle eq Administrator: DUA"`)
        // }
        break
      case 'uptime':
        p.send(process.uptime())
        break
    }
  })
  p.on('disconnect', (_) => {
    isRunning = false
    console.error('Exited with code:', _)
    start(file)
  })
  p.on('exit', (_, code) => {
    isRunning = false
    console.error('Exited with code:', code)
    //if (code === 0) return
    watchFile(args[0], () => {
      unwatchFile(args[0])
      start(file)
    })
  })
  if (!Helper.opts['test'])
    if (!rl.listenerCount()) rl.on('line', line => {
      p.emit('message', line.trim())
    })
  // console.log(p)
}

start('main.js')
import { watchFile, unwatchFile, readFileSync } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import Helper from './lib/helper.js'
import Connection from './lib/connection.js'
global.owner = [
  ['6287833362646', 'Villagerindo DPA', true]
 // ["6287877151132", "Villagerindo", true]
  // [number, dia creator/owner?, dia developer?]
] // Put your number here
global.mods = [""]
global.prems = JSON.parse(readFileSync('./src/premium.json')) // Premium user has unlimited limit

global.APIs = { // API Prefix
  // name: 'https://website'
  nrtm: 'https://nurutomo.herokuapp.com',
}
global.APIKeys = { // APIKey Here
  // 'https://website': 'apikey'
}

global.multiplier = 400

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
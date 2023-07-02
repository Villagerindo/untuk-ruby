const { loading, neon, error, wm, packname, author, safelinku, cdpt } = (await import("./src/config.json", { assert: { type: "json" } })).default
import { smsg } from './lib/simple.js'
import { plugins } from './lib/plugins.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import Connection from './lib/connection.js'
import printMessage from './lib/print.js'
import Helper from './lib/helper.js'
import db, { loadDatabase } from './lib/database.js'
import Queque from './lib/queque.js'

// const { proto } = (await import('@adiwajshing/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)

/**
 * Handle messages upsert
 * @this {import('./lib/connection').Socket}
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['messages.upsert']} chatUpdate
 */
export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || new Queque()
    if (!chatUpdate)
        return
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m)
        return
    if (db.data == null)
        await loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m)
            return
        m.exp = 0
        m.limit = false
        try {
            // TODO: use loop to insert data instead of this
            let user = db.data.users[m.sender]
            if (typeof user !== 'object')
                db.data.users[m.sender] = {}
            if (user) {
                if (!isNumber(user.exp)) user.exp = 0
                if (!isNumber(user.limit)) user.limit = 10
                if (!isNumber(user.lastclaim)) user.lastclaim = 0
                if (!('registered' in user)) user.registered = false
                if (!user.registered) {
                    if (!('name' in user)) user.name = this.getName(m.sender)
                    if (!isNumber(user.age)) user.age = -1
                    if (!isNumber(user.regTime)) user.regTime = -1
                }
                if (!isNumber(user.afk)) user.afk = -1
                if (!('afkReason' in user)) user.afkReason = ''
                if (!('banned' in user)) user.banned = false
                if (!isNumber(user.level)) user.level = 0
                if (!isNumber(user.call)) user.call = 0
                if (!user.role) user.role = 'Beginner'
                if (!('customRoleName' in user)) user.customRoleName = ''
                if (!('customRole' in user)) user.customRole = false
                if (!('autolevelup' in user)) user.autolevelup = false
                if (!isNumber(user.pc)) user.pc = 0
                if (!isNumber(user.warning)) user.warning = 0
                if (!user.lang) user.lang = 'id'
                if (!user.menfess) user.menfess = []
            } else db.data.users[m.sender] = {
                exp: 0,
                limit: 10,
                lastclaim: 0,
                registered: false,
                name: this.getName(m.sender),
                age: -1,
                regTime: -1,
                afk: -1,
                afkReason: '',
                banned: false,
                level: 0,
                call: 0,
                role: 'Beginner',
                customRoleName: '',
                customRole: false,
                autolevelup: false,
                pc: 0,
                warning: 0,
                lang: 'id',
                menfess: []
            }
            let chat = db.data.chats[m.chat]
            if (typeof chat !== 'object')
                db.data.chats[m.chat] = {}
            if (chat) {
                if (!('isBanned' in chat)) chat.isBanned = false
                if (!('isNSFW' in chat)) chat.isNSFW = false
                if (!('welcome' in chat)) chat.welcome = false
                if (!('detect' in chat)) chat.detect = false
                if (!('sWelcome' in chat)) chat.sWelcome = ''
                if (!('sBye' in chat)) chat.sBye = ''
                if (!('sPromote' in chat)) chat.sPromote = ''
                if (!('sDemote' in chat)) chat.sDemote = ''
                if (!('descUpdate' in chat)) chat.descUpdate = true
                if (!('stiker' in chat)) chat.stiker = false
                if (!('delete' in chat)) chat.delete = true
                if (!('antiLink' in chat)) chat.antiLink = false
                if (!isNumber(chat.expired)) chat.expired = 0
                if (!('antiBadword' in chat)) chat.antiBadword = true
                if (!('viewonce' in chat)) chat.viewonce = true
            } else
                db.data.chats[m.chat] = {
                    isBanned: false,
                    isNSFW: false,
                    welcome: false,
                    detect: false,
                    sWelcome: '',
                    sBye: '',
                    sPromote: '',
                    sDemote: '',
                    descUpdate: true,
                    stiker: false,
                    delete: true,
                    antiLink: false,
                    expired: 0,
                    antiBadword: true,
                    viewonce: true,
                    ads: 0
                }
            let settings = db.data.settings[this.user.jid]
            if (typeof settings !== 'object') db.data.settings[this.user.jid] = {}
            if (settings) {
                if (!'anon' in settings) settings.anon = true
                if (!'anticall' in settings) settings.anticall = true
                if (!'antispam' in settings) settings.antispam = true
                if (!'antitroli' in settings) settings.antitroli = true
                if (!'backup' in settings) settings.backup = false
                if (!isNumber(settings.backupDB)) settings.backupDB = 0
                if (!'groupOnly' in settings) settings.groupOnly = false
                if (!'jadibot' in settings) settings.groupOnly = false
                if (!isNumber(settings.status)) settings.status = 0
                if (!('self' in settings)) settings.self = false
                if (!('autoread' in settings)) settings.autoread = false
                if (!('restrict' in settings)) settings.restrict = false
                if (!'chatModGroup' in settings) settings.chatModGroup = false
                if (!'chatModPrivate' in settings) settings.chatModPrivate = false
                if (!'msgtes' in settings) settings.msgtes = []
            } else db.data.settings[this.user.jid] = {
                anon: true,
                anticall: true,
                antispam: true,
                antitroli: true,
                backup: true,
                backupDB: 0,
                groupOnly: false,
                jadibot: false,
                status: 0,
                self: false,
                autoread: false,
                restrict: false,
                chatModGroup: false,
                chatModPrivate: false,
                msgtes: []
            }
        } catch (e) {
            console.error(e)
        }


        const isROwner = [this.decodeJid(this.user.id), ...global.owner.map(([number]) => number)].map(v => v?.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isOwner = isROwner || m.fromMe || "6287833362646@s.whatsapp.net"
        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isMaintenance = isROwner || m.fromMe // Hanya owner yang dapat mengakses saat maintenance
        const isBeta = isROwner || isMods || m.fromMe // Hanya owner, anggota imi, dan Moderator yang dapat mengakses Beta Version
        if (opts['nyimak'])
            return
        if (opts['git-cmd']) global.running = 'git-cmd'
        if (opts['cmd']) global.running = 'cmd'
        if (!m.fromMe && opts['self'])
            return
        if (opts['pconly'] && m.chat.endsWith('g.us'))
            return
        if (opts['gconly'] && !m.chat.endsWith('g.us') && (isPrems && m.chat.endsWith('@s.whatsapp.net')))
            return
        if (opts['swonly'] && m.chat !== 'status@broadcast')
            return
        if (typeof m.text !== 'string')
            m.text = ''
        if (opts['queque'] && m.text && !m.fromMe && !(isMods || isPrems)) {
            const id = m.id
            this.msgqueque.add(id)
            await this.msgqueque.waitQueue(id)
        }
        //    if (m.isBaileys) return
        if (m.fromMe) return
        if (m.chat.endsWith('broadcast')) return // Supaya tidak merespon di status
        let blockL = new Array(this.fetchBlocklist())
        let blockList = blockL.filter(v => v != this.user.jid)
        if (blockList.includes(m.sender)) return // Pengguna yang diblokir tidak bisa menggunakan bot
        m.exp += Math.ceil(Math.random() * 10)
        let isBlocked = blockL.filter(v => v != this.user.jid).includes(m.sender) // Apakah user diblokir?

        let usedPrefix
        let _user = db.data && db.data.users && db.data.users[m.sender]

        const groupMetadata = (m.isGroup ? await Connection.store.fetchGroupMetadata(m.chat, this.groupMetadata) : {}) || {}
        const participants = (m.isGroup ? groupMetadata.participants : []) || []
        const user = (m.isGroup ? participants.find(u => this.decodeJid(u.id) === m.sender) : {}) || {} // User Data
        const bot = (m.isGroup ? participants.find(u => this.decodeJid(u.id) == this.user.jid) : {}) || {} // Your Data
        const isRAdmin = user?.admin == 'superadmin' || false
        const isAdmin = isRAdmin || user?.admin == 'admin' || false // Is User Admin?
        const isBotAdmin = bot?.admin || false // Are you Admin?

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
        for (let name in plugins) {
            let plugin = plugins[name]
            if (!plugin)
                continue
            if (plugin.disabled)
                continue
            const __filename = join(___dirname, name)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    })
                } catch (e) {
                    // if (typeof e === 'string') continue
                    console.error(e)
                    for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                        let data = (await this.onWhatsApp(jid))[0] || {}
                        if (data.exists)
                            m.reply(`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n\`\`\`${format(e)}\`\`\``.trim(), data.jid)
                    }
                }
            }
            if (!opts['restrict'])
                if (plugin.tags && plugin.tags.includes('admin')) {
                    // global.dfail('restrict', m, this)
                    continue
                }
            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
            let match = (_prefix instanceof RegExp ? // RegExp Mode?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ? // Array?
                    _prefix.map(p => {
                        let re = p instanceof RegExp ? // RegExp in Array?
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? // String?
                        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }))
                    continue
            }
            if (typeof plugin !== 'function')
                continue
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `
                command = (command || '').toLowerCase()
                let fail = plugin.fail || global.dfail // When failed
                let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ? // Array?
                        plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof plugin.command === 'string' ? // String?
                            plugin.command === command :
                            false

                if (!isAccept)
                    continue
                m.plugin = name
                if (m.chat in db.data.chats || m.sender in db.data.users) {
                    let chat = db.data.chats[m.chat]
                    let user = db.data.users[m.sender]
                    if (name != 'owner-unbanchat.js' && chat?.isBanned)
                        return // Except this
                    if (name != 'owner-unbanuser.js' && user?.banned)
                        return
                }
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) { // Real Owner
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) { // Number Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.mods && !isMods) { // Moderator
                    fail('mods', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) { // Premium
                    fail('premium', m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) { // Group Only
                    fail('group', m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                    fail('botAdmin', m, this)
                    continue
                } else if (plugin.admin && !isAdmin) { // User Admin
                    fail('admin', m, this)
                    continue
                }
                if (plugin.private && m.isGroup) { // Private Chat Only
                    fail('private', m, this)
                    continue
                }
                if (plugin.register == true && _user.registered == false) { // Butuh daftar?
                    fail('unreg', m, this)
                    continue
                }
                if (plugin.maintenance && !isMaintenance) { // Fitur bot Maintenance atau dalam masa perbaikan
                    fail('maintenance', m, this)
                    continue
                }
                if (plugin.general && isGeneral) { // Fitur khusus non prem dan kebal opts[gconly]
                    continue
                }
                if (plugin.beta && !isBeta) { // Fitur bot Beta atau uji coba
                    fail('beta', m, this)
                    continue
                }
                if (plugin.nsfw && m.isGroup && db.data.chats[m.chat].isNSFW == false) {
                    fail('nsfw', m, this)
                    continue
                }
                let split = m.text.split(" ")
                let prefix = /^(<|[[]|[(])/.test(split[1])
                let sufix = /(>|[]]|[)])$/.test(split[1])
                if (plugin.autoGuide && prefix && sufix) {
                    if (!prefix && !sufix) return
                    let fixed = `${split[0]} ${split[1].replace(/^(<|[[]|[(])/, '').replace(/(>|[]]|[)])$/, '')}`
                    if (fixed) return await this.sendButton(m.chat, `*Gak usah pakai [ ] atau < > atau ( ), itu cuma pembatas/hiasan!*\nContoh Penggunaan:\n${fixed}`,
                        wm, null, [
                        ["ULANGI", fixed]
                    ], m)
                    continue
                }
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
                if (xp > 200)
                    m.reply('Ngecit -_-') // Hehehe
                else
                    m.exp += xp
                if (!isPrems && plugin.limit && db.data.users[m.sender].limit < plugin.limit * 1) {
                    this.reply(m.chat, `╔══ ❰ *LIMITMU HABIS!!* ❱ ═══
║ Silahkan ketik */buy* untuk 
║ menukar XPmu menjadi limit!
╠══ ❰ *UNLIMITED LIMIT* ❱ ═══
║ Dapatkan Unlimited Limit dengan
║ cara menjadi user premium.
║ Silahkan ketik */donasi*
╚══ ⸨ *Bot Evillin* ⸩ ═══`, m)
                    continue // Limit habis
                }
                if (plugin.level > _user.level) {
                    this.reply(m.chat, `diperlukan level ${plugin.level} untuk menggunakan perintah ini. Level kamu ${_user.level}`, m)
                    continue // If the level has not been reached
                }
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    isBlocked,
                    __dirname: ___dirname,
                    __filename
                }
                try {
                    await plugin.call(this, m, extra)
                    if (!isPrems)
                        m.limit = m.limit || plugin.limit || false
                } catch (e) {
                    // Error occured
                    m.error = e
                    console.error(e)
                    if (e) {
                        let text = format(e)
                        for (let key of Object.values(global.APIKeys))
                            text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
                        if (e.name)
                            for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                                let data = (await this.onWhatsApp(jid))[0] || {}
                                if (data.exists)
                                    m.reply(`*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\``.trim(), data.jid)
                            }
                        m.reply(text)
                    }
                } finally {
                    // m.reply(util.format(_user))
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                    if (m.limit)
                        m.reply(`╔══ ❰ *Limit Terpakai!* ❱ ═══
║ *${+ m.limit} Limit telah terpakai untuk*
║ *menggunakan fitur ini!*
╠══ ❰ *UNLIMITED LIMIT* ❱ ═══
║ Ingin Limitnya tidak berkurang?,
║ dapatkan Unlimited Limit dengan
║ cara menjadi user premium.
║ Silahkan ketik */donasi*
╚══ ⸨ *Bot Evillin* ⸩ ═══`)
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        if (opts['queque'] && m.text) {
            const id = m.id
            this.msgqueque.unqueue(id)
        }
        //console.log(db.data.users[m.sender])
        let user, stats = db.data.stats
        if (m) {
            if (m.sender && (user = db.data.users[m.sender])) {
                user.exp += m.exp
                user.limit -= m.limit * 1
            }

            let stat
            if (m.plugin) {
                let now = +new Date
                if (m.plugin in stats) {
                    stat = stats[m.plugin]
                    if (!isNumber(stat.total))
                        stat.total = 1
                    if (!isNumber(stat.success))
                        stat.success = m.error != null ? 0 : 1
                    if (!isNumber(stat.last))
                        stat.last = now
                    if (!isNumber(stat.lastSuccess))
                        stat.lastSuccess = m.error != null ? 0 : now
                } else
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                stat.total += 1
                stat.last = now
                if (m.error == null) {
                    stat.success += 1
                    stat.lastSuccess = now
                }
            }
        }

        try {
            if (!opts['noprint']) await printMessage(m, this)
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        if (!m.key.remoteJid.endsWith('broadcast')) // BIAR GAK LIAT STATUS
            await this.readMessages([m.key])

    }
}

/**
 * Handle groups participants update
 * @this {import('./lib/connection').Socket}
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate 
 */
export async function participantsUpdate({ id, participants, action }) {
    if (opts['self'])
        return
    if (this.isInit)
        return
    if (db.data == null)
        await loadDatabase()
    let chat = db.data.chats[id] || {}
    let text = ''
    switch (action) {
        case 'add':
        case 'remove':
            if (chat.welcome) {
                let groupMetadata = await Connection.store.fetchGroupMetadata(id, this.groupMetadata)
                for (let user of participants) {
                    let pp = './src/avatar_contact.png'
                    try {
                        pp = await this.profilePictureUrl(user, 'image')
                    } catch (e) {
                    } finally {
                        text = (action === 'add' ? (chat.sWelcome || this.welcome || Connection.conn.welcome || 'Welcome, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc?.toString() || 'unknow') :
                            (chat.sBye || this.bye || Connection.conn.bye || 'Bye, @user!')).replace('@user', '@' + user.split('@')[0])
                        this.sendFile(id, pp, 'pp.jpg', text, null, false, { mentions: [user] })
                    }
                }
            }
            break
        case 'promote':
            text = (chat.sPromote || this.spromote || Connection.conn.spromote || '@user ```is now Admin```')
        case 'demote':
            if (!text)
                text = (chat.sDemote || this.sdemote || Connection.conn.sdemote || '@user ```is no longer Admin```')
            text = text.replace('@user', '@' + participants[0].split('@')[0])
            if (chat.detect)
                this.sendMessage(id, { text, mentions: this.parseMention(text) })
            break
    }
}

/**
 * Handle groups update
 * @this {import('./lib/connection').Socket}
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate 
 */
export async function groupsUpdate(groupsUpdate) {
    if (opts['self'])
        return
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if (!id) continue
        let chats = db.data.chats[id], text = ''
        if (!chats?.detect) continue
        if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || Connection.conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
        if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || Connection.conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
        if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || Connection.conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
        if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || Connection.conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
        if (!text) continue
        await this.sendMessage(id, { text, mentions: this.parseMention(text) })
    }
}

/**
 * @this {import('./lib/connection').Socket}
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['messages.delete']} message 
 */
export async function deleteUpdate(message) {
    if (message.keys && Array.isArray(message.keys)) {
        try {
            for (const key of message.keys) {
                if (key.fromMe) continue
                const msg = Connection.store.loadMessage(key.id)
                if (!msg) continue
                let chat = db.data.chats[msg.key.remoteJid]
                if (!chat || chat.delete) continue
                const participant = msg.participant || msg.key.participant || msg.key.remoteJid
                await this.reply(msg.key.remoteJid, `
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan
Untuk mematikan fitur ini, ketik
*.enable delete*
`.trim(), msg, {
                    mentions: [participant]
                })
                this.copyNForward(msg.key.remoteJid, msg).catch(e => console.log(e, msg))
            }
        } catch (e) {
            console.error(e)
        }
    }
}


global.dfail = (type, m, conn) => {
    let msg = {
        rowner: 'Perintah ini hanya dapat digunakan oleh _*Pemilik Bot*_',
        owner: 'Perintah ini hanya dapat digunakan oleh _*Pemilik Bot*_',
        mods: 'Perintah ini hanya dapat digunakan oleh _*Moderator*_ atau _*Beta Tester*_',
        premium: '❰ *Perintah ini bukan untuk _User Gratisan!_* ❱\nJadilah User Premium dengan membeli premium di Bot Evillin, Ketik */beliprem* atau klik tombol di bawah ini untuk melihat Via Pembayarannya!',
        group: 'Perintah ini hanya dapat digunakan di grup',
        private: 'Perintah ini hanya dapat digunakan di Chat Pribadi',
        admin: 'Perintah ini hanya untuk *Admin* grup',
        botAdmin: 'Jadikan bot sebagai *Admin* untuk menggunakan perintah ini',
        unreg: 'Silahkan daftar untuk menggunakan fitur ini dengan cara mengetik:\n\n*/daftar nama.umur*\n\nContoh: */daftar Dani.21*',
        maintenance: 'Fitur ini sedang diperbaiki oleh Pemilik Bot, silahkan coba lagi nanti jika sudah diperbaiki!',
        beta: 'Fitur ini tidak tersedia di Evillin Public Version atau masih dalam tahap uji coba!',
        nsfw: 'Fitur NSFW tidak aktif pada grup ini!\nKetik /on nsfw',
        restrict: 'Fitur ini dimatikan!'
    }[type]
    if (/^r?owner$/.test(type)) return m.reply(msg)
    if (/^mods$/.test(type)) return m.reply(msg)
    if (/^timi$/.test(type)) return m.reply(msg)
    if (/^premium$/.test(type)) return m.reply(msg)
    if (/^(group|private|admin|botadmin|unreg|maintenance|beta|restrict)$/.test(type)) return m.reply(msg)
    if (/^nsfw$/.test(type)) return m.reply(msg)
}

let file = Helper.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    if (Connection.reload) console.log(await Connection.reload(await Connection.conn))
})
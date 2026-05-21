/**
 * BranlyCraft — Script de release
 * Usage : npm run release
 */

const { execSync } = require('child_process')
const readline      = require('readline')
const fs            = require('fs')
const path          = require('path')

const pkgPath = path.join(__dirname, 'package.json')
const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(res => rl.question(q, res))

// Auto-incrément de version patch  (1.0.13 → 1.0.14)
function nextVersion(v) {
    const parts = v.split('.').map(Number)
    parts[2]++
    return parts.join('.')
}

function bump(version) {
    pkg.version = version
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}

function injectNotes(title, notes) {
    const ymlPath = path.join(__dirname, 'dist', 'latest.yml')
    if (!fs.existsSync(ymlPath)) return
    let content = fs.readFileSync(ymlPath, 'utf8')
    content = content.replace(/^releaseNotes:.*$/m, '').replace(/^releaseName:.*$/m, '').trimEnd()
    content += `\nreleaseName: '${title.replace(/'/g, "\\'")}'\n`
    content += `releaseNotes: '${notes.replace(/'/g, "\\'")}'\n`
    fs.writeFileSync(ymlPath, content, 'utf8')
}

;(async () => {
    console.log('\n╔══════════════════════════════════════╗')
    console.log('║     BranlyCraft — Nouvelle release    ║')
    console.log('╚══════════════════════════════════════╝\n')

    const suggested = nextVersion(pkg.version)

    const versionInput = await ask(`Version actuelle : ${pkg.version}\nNouvelle version  [${suggested}] : `)
    const version = versionInput.trim() || suggested

    const title = await ask(`Titre des nouveautés   : `)
    if (!title.trim()) {
        console.log('\n❌ Le titre est obligatoire.')
        rl.close()
        process.exit(1)
    }

    const notes = await ask(`Contenu des nouveautés : `)
    if (!notes.trim()) {
        console.log('\n❌ Les notes sont obligatoires.')
        rl.close()
        process.exit(1)
    }

    rl.close()

    console.log(`\n📦 Bump → v${version}`)
    bump(version)

    console.log('🔨 Build en cours (npm run dist:win)...\n')
    try {
        execSync('npm run dist:win', { stdio: 'inherit' })
    } catch {
        console.error('\n❌ Build échoué.')
        process.exit(1)
    }

    console.log('\n📝 Injection des notes dans latest.yml...')
    injectNotes(title, notes)

    console.log('\n╔══════════════════════════════════════════════════════╗')
    console.log(`║  ✅ Release v${version} prête !`)
    console.log('╠══════════════════════════════════════════════════════╣')
    console.log('║  📤 Upload ces 2 fichiers sur R2 (branlycraft-launcher/) :')
    console.log(`║     • dist/BranlyCraft Launcher-setup-${version}.exe`)
    console.log('║     • dist/latest.yml')
    console.log('║')
    console.log('║  🌐 Pense à dire à Claude de pousser le site web !')
    console.log('╚══════════════════════════════════════════════════════╝\n')
})()

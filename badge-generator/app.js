import { makeBadge } from 'badge-maker'
import fs from 'fs'

const themes = {
    github: {
        labelColor: 'hsl(210, 10%, 25%)',
        color: 'hsl(210, 84%, 52%)',
        style: 'for-the-badge'
    },
    forgejo: {
        labelColor: 'hsl(210, 25%, 12%)',
        color: 'hsl(20, 96%, 41%)',
        style: 'for-the-badge',
    },
}

function getTheme(name) {
    const theme = themes[name]
    if (!theme) {
        const available = Object.keys(themes).join(', ')
        throw new Error(`Unknown theme "${name}". Available themes: ${available}`)
    }
    return theme
}

function getBadges() {
    const badgesJSON = fs.readFileSync('badges.json', 'utf8')
    return  JSON.parse(badgesJSON)
}

function generateBadges(badges, theme) {
    const svgBadges = []

    badges.forEach(badge => {
        // The validator will complain so we extract the property for later
        const file = badge.fileName
        delete badge["fileName"]

        // Parse logo to appropriate data URL
        if (badge.logoSvg) {
            const svgLogo = fs.readFileSync(`./logo/${badge.logoSvg}`, 'utf8')
            badge.logoBase64 = `data:image/svg+xml;base64,${btoa(svgLogo)}`
            delete badge["logoSvg"]
        }

        // Compose the definition with the default styling
        const badgeFormat = {
            ...theme,
            ...badge,
        }

        const svg = makeBadge(badgeFormat)
        svgBadges.push({
            fileName: file,
            svg: svg,
        })
    })

    return svgBadges
}

function createDirs(filename) {
    const directory = filename.substring(0, filename.lastIndexOf('/'))
    fs.mkdirSync(directory, { recursive: true })
}

function writeBadges(root, badges) {
    const outputRoot = root.endsWith('/') ? root : root + '/'
    badges.forEach(badge => {
        const badgePath = badge.fileName.startsWith('/') ? badge.fileName.substring(1) : badge.fileName
        const output = `${outputRoot}${badge.fileName}.svg`
        createDirs(output)
        fs.writeFileSync(output, badge.svg, { encoding: 'utf8' })
        console.log(`Successfully written ${badge.fileName}`)
    })
}

function main() {
    const themeName = process.argv[2]
    if (!themeName) {
        const available = Object.keys(themes).join(', ')
        throw new Error(`Usage: node app.js <theme>\nAvailable themes: ${available}`)
    }

    const theme = getTheme(themeName)
    const badges = getBadges()
    const svgBadges = generateBadges(badges, theme)
    writeBadges('../assets/badges', svgBadges)
}

main()

import { makeBadge } from 'badge-maker'
import fs from 'fs'
import { execSync } from 'child_process'

const themes = {
    github: {
        labelColor: 'hsl(210, 10%, 25%)',
        color: 'hsl(210, 84%, 52%)',
        logoColor: 'white',
        style: 'for-the-badge'
    },
    forgejo: {
        labelColor: 'hsl(210, 25%, 12%)',
        color: 'hsl(20, 96%, 41%)',
        logoColor: 'white',
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

function getLastReadmeUpdate() {
    const date = execSync('git log -1 --format=%ad --date=short -- ../README.md', { encoding: 'utf8' }).trim()
    if (!date) {
        throw new Error('No commits found touching README.md; is history shallow or the file untracked?')
    }
    return date
}

function getBadges() {
    const badgesJSON = fs.readFileSync('badges.json', 'utf8')
    const badges = JSON.parse(badgesJSON)

    const lastUpdate = badges.find(badge => badge.fileName === 'last-update')
    if (lastUpdate) {
        lastUpdate.message = getLastReadmeUpdate()
    }
    console.log("README.md was last updated on: " + lastUpdate.message)

    return badges
}

// Tint vendored icons regardless of whatever color they exist in
function tintLogo(svgText, color) {
    const stripped = svgText.replace(/\sfill="[^"]*"/g, '')
    return stripped.replace(/<svg\b/, `<svg fill="${color}"`)
}

// Font Awesome's brand icons ("*-brands-*") have more internal padding
// Zoom the viewBox to compensate.
const BRAND_ICON_ZOOM = 1.3

function zoomViewBox(svgText, zoom) {
    const match = svgText.match(/viewBox="([\d.\s]+)"/)
    if (!match) return svgText

    const [minX, minY, width, height] = match[1].trim().split(/\s+/).map(Number)
    const newWidth = width / zoom
    const newHeight = height / zoom
    const newMinX = minX + (width - newWidth) / 2
    const newMinY = minY + (height - newHeight) / 2

    return svgText.replace(
        /viewBox="[\d.\s]+"/,
        `viewBox="${newMinX} ${newMinY} ${newWidth} ${newHeight}"`,
    )
}

function generateBadges(badges, theme) {
    const svgBadges = []
    // The validator complains about unknown properties, extract custom options
    const logoTint = theme.logoColor
    delete theme["logoColor"]

    badges.forEach(badge => {
        const file = badge.fileName
        delete badge["fileName"]

        // Parse logo to appropriate data URL
        if (badge.logoSvg) {
            let svgLogo = fs.readFileSync(`./logo/${badge.logoSvg}`, 'utf8')

            if (badge.logoSvg.includes('-brands-')) {
                svgLogo = zoomViewBox(svgLogo, BRAND_ICON_ZOOM)
            }

            // Some marks forbid recoloring under their brand guidelines
            if (badge.tint !== false) {
                svgLogo = tintLogo(svgLogo, logoTint)
            }

            badge.logoBase64 = `data:image/svg+xml;base64,${btoa(svgLogo)}`
            delete badge["logoSvg"]
            delete badge["tint"]
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
    console.log("Selected theme: " + themeName)
    writeBadges('../assets/badges', svgBadges)
}

main()

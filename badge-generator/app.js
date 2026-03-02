import { makeBadge } from 'badge-maker'
import fs from 'fs'

const defaultFormat = {
    labelColor: '#3a3f47',
    color: '#1F6FEB',
    style: 'for-the-badge'
}

function getBadges() {
    const badgesJSON = fs.readFileSync('badges.json', 'utf8')
    return  JSON.parse(badgesJSON)
}

function generateBadges(badges) {
    const svgBadges = []

    badges.forEach(badge => {
        // The validator will complain so we extract the property for later
        const file = badge.fileName
        delete badge["fileName"]

        // Compose the definition with the default styling
        const badgeFormat = {
            ...defaultFormat,
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
    const badges = getBadges()
    const svgBadges = generateBadges(badges)
    writeBadges('../assets/badges', svgBadges)
}

main()

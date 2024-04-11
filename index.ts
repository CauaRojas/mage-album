import { $ } from 'bun'
// Define the Struct for the song
type song = {
    title: string
    start: string
    duration?: string
}
// Test if ffmpeg is installed
await $`ffmpeg -version`.quiet().catch(() => {
    console.log('Please install ffmpeg')
    process.exit(0)
})
// Test if yt-dlp is installed
await $`yt-dlp --version`.quiet().catch(() => {
    console.log('Please install yt-dlp')
    process.exit(0)
})

// Check if the user has input the correct arguments
if (Bun.argv.length < 4) {
    console.log(
        'Usage: mage-album <album-link> <timestamp-file>\
    \nExample: mage-album https://youtube.com/watch?v=1234567890 ./timestamps.txt'
    )
    process.exit(0)
}

// Regex for youtube link
const ytRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

// Regex for duration of a song
const durationRgx = /(?<!\d)\d{1,2}:\d{2}(:\d{2})?/gm

// Get the album link and timestamp file
const albumLink = Bun.argv[2]
const timestampFile = Bun.argv[3]

if (!ytRegex.test(albumLink)) {
    console.log('Invalid YouTube link')
    process.exit(0)
}

// Create a random folder to store the album
const randomName = Math.random().toString(36).substring(7)
await $`mkdir -p ${randomName}`

// Read the timestamp file
const timestamps = await $`cat ${timestampFile}`.text().catch(() => {
    console.log('Error while reading the timestamp file')
    process.exit(0)
})
const timestampArr = timestamps
    .split('\n')
    .filter((x: string) => x.length > 1)
    .map((x: string) => x.replace(/[\r\n]/g, '').trim())

// Download the album
console.log('Downloading the album...')
await $`yt-dlp --extract-audio --audio-format mp3 -o ${randomName}/%\(title\)s.%\(ext\)s ${albumLink}`
    .quiet()
    .catch(() => {
        console.log('Error while downloading the album')
        process.exit(0)
    })

const albumName = await $`ls ${randomName}/`.text().then(x =>
    x
        .split('\n')[0]
        .trim()
        .replace(/\.mp3$/, '')
)

// Create the songs array from the timestamps infos
const songs: song[] = timestampArr.map(timestamp => {
    durationRgx.lastIndex = 0
    const a = durationRgx.exec(timestamp) ?? ['', '']
    const start = a[0]
    const words = timestamp
        .split(durationRgx)
        .filter(x => x !== undefined && x.length > 1)
    // replace trailing hyphen
    const title = words[words.length - 1].trim().replace(/-$/, '').trim()
    return { start, title }
})
// Calculate duration of each song
for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    const nextSong = songs[i + 1]
    if (nextSong) {
        const start = song.start.split(':')
        const end = nextSong.start.split(':')
        const startSeconds = parseInt(start[0]) * 60 + parseInt(start[1])
        const endSeconds = parseInt(end[0]) * 60 + parseInt(end[1])
        const duration = endSeconds - startSeconds
        song.duration = duration.toString()
    }
}
console.log(songs)
console.log('Album name:', albumName)

// Create the folder for the album
await $`mkdir -p ${albumName}`

// Split the album into songs
for (const song of songs) {
    const songName = song.title.replace('/', '')

    console.log('Splitting...', songName)
    if (song.duration)
        // If the song has a duration then split it with the duration
        await $`ffmpeg -i "${randomName}/${albumName}.mp3" -ss ${song.start} -t ${song.duration} -c copy "${albumName}/${songName}.mp3"`.quiet()
    // If not then split it until the end of the file
    else
        await $`ffmpeg -i "${randomName}/${albumName}.mp3" -ss ${song.start} -c copy "${albumName}/${songName}.mp3"`.quiet()
}
// Remove the temporary folder
await $`rm -rf ${randomName}`
console.log('Done, album is available in', albumName)

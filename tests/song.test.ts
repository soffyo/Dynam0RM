import {Connection, HashKey, RangeKey, TimeToLive, Ignore} from 'src/decorators'
import * as dynamoDBConfig from './dbconfig.json'
import {Dynam0RM} from '../src'
import 'src/operators'

@Connection({dynamoDBConfig, tableName: 'Songs Custom Table Name'})
class Song extends Dynam0RM.Table {
    @HashKey
    artist: string
    @RangeKey
    title: string
    album?: string
    year?: number
    genre?: string[]
    reviews?: {good: number; bad: number;}
    @TimeToLive
    expiration?: number
    @Ignore
    extra?: string
    readonly creationDate? = Date()
}

test('Song', async function () {
    const createTable = await Song.createTable()

    const songs: Song[] = []
    const addSongInfo = async (song: Song, title: string, album: string, year: number) => {
        song.title = title
        song.album = album
        song.year = year
        song.extra = 'IGNORED EXTRA PROP'
    }
    for (let i = 0; i <= 10; i++) {
        const song = new Song()
        song.artist = 'Michael Jackson'
        switch (i) {
            case 0: await addSongInfo(song, 'Billie Jean', 'Thriller', 1982); break
            case 1: await addSongInfo(song, 'Heal the World', 'Dangerous', 1991); break
            case 2: await addSongInfo(song, 'Thriller', 'Thriller', 1982); break
            case 3: await addSongInfo(song, 'Beat It', 'Thriller', 1982); break
            case 4: await addSongInfo(song, 'Remember the Time', 'Dangerous', 1991); break
            case 5: await addSongInfo(song, 'Rock With You', 'Off the Wall', 1979); break
            case 6: await addSongInfo(song, 'You Rock My World', 'Invincible', 2001); break
            case 7: await addSongInfo(song, 'Jam', 'Dangerous', 1992); break
            case 8: await addSongInfo(song, 'Heaven Can Wait', 'Invincible', 2001); break
            case 9: await addSongInfo(song, 'Don\'t Stop \'til You Get Enough', 'Off the Wall', 1979); break
            case 10: await addSongInfo(song, 'Dirty Diana', 'Bad 25', 1987); break
        }
        songs.push(song)
    }

    const batchPut = await Song.putItems(...songs)
    await Song.make({artist: 'Nino', title: 'Popcorn & Patatine', album: 'Nu Jeans & Na Maglietta'}).save({overwrite: false})
    await Song.make({artist: 'RHCP', title: 'Scar Tissue', album: 'Californication', year: 1998}).save({overwrite: false})

    const k = await Song.query('Michael Jackson', BeginsWith('T')).scanForward()

    console.dir(k.output, {depth: null})

    await Song.destroy()
})
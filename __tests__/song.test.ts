import { Dynam0RX } from '../src'
import { Table, PartitionKey, SortKey, TimeToLive, GlobalSecondaryIndex, LocalSecondaryIndex } from 'src/decorators'
import { Global, Local } from "src/decorators/property/indexes";
import * as dynamoDBConfig from './dbconfig.json'
import * as _ from '../src/operators'

const localI = new LocalSecondaryIndex<Song>({ attributes: ['title']})
const globalI = new GlobalSecondaryIndex()

@Table({ dynamoDBConfig })
class Song extends Dynam0RX {
    @PartitionKey
    artist: string
    @SortKey
    title: string
    @Global('as').partitionKey
    album: string
    @Global('as').sortKey
    year: number
    genre?: Set<string>
    reviews? = { good: 0, bad: 0 }
    @TimeToLive
    expiration?: number
}

test('Song', async function() {
    const songs: Song[] = []
    const addSongInfo = async (song: Song, title: string, album: string, year: number) => {
        song.title = title
        song.album = album
        song.year = year
    }
    for (let i = 0; i <= 10; i++) {
        const song = new Song()
        song.artist = 'Michael Jackson'
        song.expiration = Math.floor(Date.now() / 1000) + 60000
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

    const createSongTable = await Song.createTable({ stream: 'keys-only' })
    await Song.batchPut(songs)
    const rwy = Song.primaryKey({ artist: 'Michael Jackson', title: 'Rock With You' })
    const jam = Song.primaryKey({ artist: 'Michael Jackson', title: 'Jam' })
    const upd = await jam.update({ genre: _.Add('disco', 'rock', 'pop') }).now()
    console.dir(upd, {depth: null})

    await Song.destroy()
})
import { Dynam0RX } from '../src'
import { Table, PartitionKey, SortKey, LocalSecondaryIndex, GlobalSecondaryIndex } from '../src/decorators'
import op, {Increment, Decrement, Append, Remove, AttributeExists, Greater, Add, Delete } from '../src/operators';
import * as dynamoDBConfig from './dbconfig.json'
import * as symbol from '../src/private/symbols'
import {sortKey} from "src/decorators/property/primarykey";

const myLocalIndex = new LocalSecondaryIndex<Song>()
const anotherLocalIndex = new LocalSecondaryIndex()
const anotherAnotherLocalIndex = new LocalSecondaryIndex()
const anotherGlobalIndex = new GlobalSecondaryIndex<_table2>()
const myGlobalIndex = new GlobalSecondaryIndex<_table1>()

@Table({ dynamoDBConfig })
class Song extends Dynam0RX {
    @PartitionKey
    artist: string
    @SortKey
    title: string
    album: string
    @myLocalIndex.sortKey
    year: number
    genre: Set<string>
    reviews?: {
        good: number
        bad: number
    }
}

@Table({ dynamoDBConfig })
class _table1 extends Dynam0RX {
    @PartitionKey
    pk: string
    @sortKey
    b1: number
    c1?: string
    d1?: number
}

@Table({ dynamoDBConfig })
class _table2 extends Dynam0RX {
    @anotherAnotherLocalIndex.sortKey
    @anotherGlobalIndex.sortKey
    c2?: string
    @anotherLocalIndex.sortKey
    @anotherGlobalIndex.partitionKey
    d2?: number
    @SortKey
    b2: number
    @PartitionKey
    a2: string
}

test('Song', async function() {
    const createSong = await Song.init()
    const createTable1 = await _table1.init()

    await Song.make({
        artist: 'Michael Jackson',
        title: 'Thriller',
        album: 'Thriller',
        year: 1982,
        genre: new Set(['rock', 'pop'])
    }).save()

    const bj = new Song()
    bj.artist = 'Michael Jackson'
    bj.title = 'Billie Jean'
    bj.album = 'Thriller'
    bj.year = 1985
    bj.genre = new Set()
    bj.genre.add('si')
    bj.reviews.good = 200
    await bj.save()

    //console.dir(await Song.scan(), { depth: null })

    //@ts-ignore
    const pk = Song.primaryKey({ artist: 'Mich', year: 'd' }).get()
    console.log(await pk)

    console.dir(await Song.scan(), { depth: null })
})
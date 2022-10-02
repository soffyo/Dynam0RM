import { Dynam0RX, Schema, partitionKey, sortKey, localIndex, globalIndex } from "../src";
import o from "../src/operators";
import * as dynamoDBConfig from "./dbconfig.json"
import * as symbol from "../src/definitions/symbols"

const glob1 = new globalIndex("asnaeb")
const glob2 = new globalIndex("senesi")

const local = new localIndex<Song>({ attributes: ['year'], keys_only: true, name: 'asnaeb' })

@Schema({ dynamoDBConfig })
class Song extends Dynam0RX<Song> {
    @partitionKey
    artist: string
    @sortKey
    title: string
    year: number
    album: string
    @local.index
    test_string?: string
    test_number?: number
    genre: string[]
    reviews? = {
        good: 0,
        bad: 0,
        trending: false
    }
}

test("Song", async function() {
    await Song.init()
    
    const thriller = new Song()

    thriller.artist = "Michael Jackson"
    thriller.title = "Thriller"
    thriller.year = 1982
    thriller.album = "Thriller"
    thriller.genre = ["Disco", "Pop"]
    thriller.reviews.bad = 23
    thriller.reviews.good = 800800800

    await thriller.save()

    const billieJean = new Song()

    billieJean.artist = "Michael Jackson"
    billieJean.title = "Billie Jean"
    billieJean.year = 1972
    billieJean.album = "Thriller"
    billieJean.genre = ["Disco", "Funk"]

    await billieJean.save()

    const shout = new Song({
        artist: "Tears for Fears",
        title: "Shout",
        year: 1985,
        album: "Songs from the Big Chair",
        genre: ["Indie", "R&B", "Soul"],
        test_string: "b"
    })

    await shout.save()

    const test = new Song({
        artist: "Michael Jackson",
        title: "Dummy Title",
        album: "Dummy Album",
        year: 1990,
        genre: ["dummy"],
        test_number: 0,
        test_string: "a"
    })

    await test.save() 

    const testy = new Song({
        artist: "Michael Jackson",
        title: "Dummy Body",
        album: "Album",
        year: 1990,
        genre: ["dummy"],
    })

    await testy.save() 

    //const k = await Song.query({ artist: "Michael Jackson", year: o.greater(1972) })

    //console.log(k)

    console.log((await local.scan()))

    //console.dir(await Song.scan(), { depth: null })

    await Song.drop()  
})
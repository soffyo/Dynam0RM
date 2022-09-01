import { Dynam0RX, Schema, partitionKey, sortKey } from "../src";
import o, { greater_equal, lesser, not_equal, equal, lesser_equal, attribute_exists, begins_with } from "../src/operators";
import * as dynamoDBConfig from "./dbconfig.json"

@Schema({ dynamoDBConfig })
class Song extends Dynam0RX {
    @partitionKey
    artist: string
    @sortKey
    title: string
    year: number
    album: string
    genre: string[]
    reviews: {
        good: number
        bad: number
        trending: boolean
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
    thriller.reviews.bad = 0
    thriller.reviews.good = 0

    await thriller.save()

    const billieJean = new Song()

    billieJean.artist = "Michael Jackson"
    billieJean.title = "Billie Jean"
    billieJean.year = 1982
    billieJean.album = "Thriller"
    billieJean.genre = ["Disco", "Funk"]

    await billieJean.save()

    const shout = new Song({
        artist: "Tears for Fears",
        title: "Shout",
        year: 1985,
        album: "Songs from the Big Chair",
        genre: ["Indie", "R&B", "Soul"]
    })

    await shout.save()

    const thrillerK = Song.primaryKey({ artist: "Michael Jackson", title: "Thriller" })

    thrillerK.attributes.album = "AZUNA" 

    await thrillerK.update()

    console.log(await thrillerK.get())
    //console.dir(await Song.scan(), { depth: null })

    await Song.drop()
})
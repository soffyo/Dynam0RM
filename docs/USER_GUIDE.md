# User guide

* [Introduction](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#introduction)
* [Define a Schema](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#define-a-schema)
* [Methods](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#methods)
  * [Init](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#init)
  * [Instance Methods](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#instance-methods)
    * [Put](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#put)
    * [Save](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#save)
  * [PrimaryKey](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#primarykey)
    * [Get](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#get)
    * [Delete](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#delete)
      * [Conditional Delete](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditional-delete)
    * [Update](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#update)
      * [Conditional Update](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditional-update)
  * [Drop](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#drop)
  * [BatchPut](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#batchput)
  * [BatchGet](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#batchget)
  * [BatchDelete](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#batchdelete)
  * [Query](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#query)
* [Components](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#importing)
  * [Dynam0RX Class](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#dynam0rx-class)
  * [Decorators](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#decorators)
    * [Schema](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#schema)
    * [PartitionKey](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#partitionkey)
    * [SortKey](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#sortkey)
  * [Conditions Operators](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditions-operators)
## Introduction
This guide will focus on Dynam0RX client workflow, covering all its methods and some of the use cases. Things that are strictly related to DynamoDB basic concepts will not be covered as the guide is meant for developers who already have an idea of what DynamoDB is. However, you will find useful links to the original documentation, pointing you in the right direction if you need to learn more about it. 

Look at this guide as a walkthrough, to be read from start to finish.
## Define a Schema
As seen on the [main page](https://github.com/soffyo/Dynam0RX#how-does-it-work), we will be working on *Schemas*. To define a schema, we need to create a new class
```typescript
class Song {
    artist: string
    title: string
    year: number
    genre: string[]
    reviews: {
        good: number
        bad: number
        trending: boolean
    }
}
```
As is, the class we just created isn't doing anything else than defining a schema type. This will be the structure of the data we will be putting on the table. But we need to tell Dynam0RX that this class refers to a table. To do this, we'll apply the [Decorators](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#decorators) 
```typescript
@Schema()
class Song {
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
```
The decorators tell our client that class `Song` refers to a table that contains data with this shape. Plus, we define this table's *[Primary Key Schema](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_KeySchemaElement.html)* with `partitionKey` and `sortKey` decorators. Only one thing's left to do and we'll be good to go: we need to *extend* our class
```typescript
@Schema()
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
```
We added `extends Dynam0RX` clause, which is needed to tell typescript that our class have a constructor and all the **methods** we're going to use in the following sections. From now on, we'll be working on this class we just defined and refer to it in all the following code examples.
## Methods
The majority of our methods will be *static methods*
### Init
```typescript
await Song.init()
```
This will just create the table for the first time (if it doesn't already exist). The table we just created will be named after the class identifier (`Song` in our case). If we wanted to give it a different name, we could have done it by passing it to the `@Schema` decorator. You can find more about it in the [Decorators paragraph](https://github.com/soffyo/Dynam0RX#decorators).
`init` method can be called with a single optional parameter which is a table configuration object with the following properties:
* **throughput**: *[ProvisionedThroughput object](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ProvisionedThroughput.html)*. If not specified, DynamoDB "PAY PER REQUEST" mode will be used for this table. 
* **stream**: *[StreamViewType string](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_StreamSpecification.html)*. If not specified, streams will be disabled for this table. 
* **infrequent**: *boolean*. Defaults to *false* if not specified. If *true*, `STANDARD_INFREQUENT_ACCESS` mode is used.
```typescript
// Example init() with a full configuration object

await Song.init({
    stream: "NEW_AND_OLD_IMAGES",
    infrequent: true,
    throughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
})
```
> For info about tables configuration, refer to the [DynamoDB documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.html).
### Instance methods
When we talk about an *instance* in this guide, we refer to a possible iteration of the schema defined by the class. Instances have methods which can be used to work with them.
#### Put
Now we can start creating instances and put them to the table, let's create a `Song`
```typescript
const thriller = new Song()

thriller.artist = "Michael Jackson"
thriller.title = "Thriller"
thriller.year = 1982
thriller.album = "Thriller"
thriller.genre = ["Disco", "Pop"]

// or we can simply define the properties directly while constructing the instance

const thriller = new Song({
    artist: "Michael Jackson",
    title: "Thriller",
    year: 1982,
    album: "Thriller"
    genre: ["Disco", "Funk"]
})
```
When we're done, we can `put` it 
```typescript
await thriller.put()
```
This will only succeed if an instance with the same *Primary key* doesn't already exist, otherwise, the operation will fail.
#### Save
Let's say after some other code, we need to change some property of the instance we just `put` to the table.
```typescript
thriller.reviews.good = 400

await thriller.save()
```
> *You can update nested properties even if they have not been defined yet. See [Nested Objects](https://github.com/soffyo/Dynam0RX#nested-objects) below.
> 
The reviews will now be saved to the original instance on the table we put before. Otherwise, if we didn't put `thriller` before, `save` would have put a new instance including the *reviews.good* value we just added to it to the table. Another example
```typescript
const billieJean = new Song()

billieJean.artist = "Michael Jackson"
billieJean.title = "Billie Jean"
billieJean.year = 1982
billieJean.album = "Thriller"
billieJean.genre = ["Disco", "Funk"]

await billieJean.save()

// Now "Billie Jean" is present on the table
```
The difference between `put` and `save` is that both will put a new instance to the table if one with the same *Primary key* isn't found but while `put` will fail if an instance with the same *Primary Key* **is** found, `save` will instead update it with the given values.
> #### Nested objects
> When Updating nested objects, you can define *not yet existent* properties using dot notation
> ```typescript
> billieJean.reviews.good = 334
> billieJean.reviews.bad = 57
>
> // Will be the same as
>
> billieJean.reviews = {
>    good: 334,
>    bad: 57
> }
> ```
> Normally, Javascript won't let you do this because `reviews` is not yet defined on `billieJean` but here you can. This feature comes in handy when you don't want to define the whole object but be **careful**: this will allow you to bypass type checking on optionality of properties. Given the two examples above, they do the exact same thing but while the first is valid Typescript code, the second isn't. That's because `reviews` have `trending` as a non optional property which we didn't include. DynamoDB, on the other side, have no optional/required attributes, so use this feature according to your needs.
### Primary Key 
Instance methods are methods that work on instances we already have record for but how do we work on an instance from the table? As we know, to call something from a DynamoDB table we need a *Primary key*
```typescript
const lmrKey = Song.primaryKey({ artist: "R.E.M.", title: "Losing My Religion" })
```
Now `key` holds a reference to the instance relative to this *Primary key* on the table. Let's explore what methods are available on it
#### Get
We most likely want to retrieve the full instance from the table
```typescript
const losingMyReligion = await key.get()
```

```
value of losingMyReligion {
    artist: "R.E.M.",
    title: "Losing My Religion",
    year: 1991,
    album: "Out Of Time",
    genre: ["Indie", "Alternative", "Pop"],
    reviews: {
        good: 1324,
        bad: 435
    }
} 
```
Here, `losingMyReligion` will contain the full instance including `put()` and `save()` methods. Let's add `"Rock"` to the `genre`s list
```typescript
losingMyReligion.genre = [...losingMyReligion.genre, "Rock"]

await losingMyReligion.save()
```
### Delete
Deleting an instance is just as simple
```typescript
await lmrKey.delete()
```
But what if we want to delete the instance only if it has certain properties with certain values without `get`ing it first? DynamoDB supports conditions, allowing performing conditional checks and write operations in *one single* database call.
#### Conditional Delete
```typescript
const shout2000Key = Song.PrimaryKey({ artist: "Disturbed", title: "Shout 2000" })

await shout2000Key.delete({ year: not_equal(2000) })

// Will only delete "Shout 2000" if the year is wrong (The song came out in 2000)
```
A detailed description of possible conditions and how to use them can be found later in this guide, in the [Conditions section](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditions).
### Update
We can use `update` to make changes to an existent instance only if it is already present on the table. If no matching instance is found, the operation will fail. Let's say that we made a mistake when writing the *Primary key*
```typescript
const thrillerKey = new Song({ artist: "Michael Jckson", title: "Thriller" }) // <-- There is a typo!! We missed the a in "Jckson".

thrillerKey.reviews.bad =  140

await thrillerKey.update() // <-- This will fail, preventing creating a new "Thriller" with wrong named artist "Michael Jckson".
```
If we used `save()`, it would've created a new instance with wrong data while `update()` will fail for not finding a matching *Primary key*
#### Conditional Update
Conditional updates are possible as well, being one very useful feature of DynamoDB. Let's use `shout2000Key` the *dummy instance* we created before
```typescript
thrillerKey.role = ["ADMIN"]

await thrillerKey.update({
    reviews: {
        good: greater_equal(1000)
        bad: lesser(100)
    }
})
```
Will update `jim` only if its `email` field contains "dynam0rx.com" and its `info.age` field has a value greater than `18`. If one of the conditions is not met, the operation will fail.
## Static Methods
What we have seen before were called *Instance Methods* because they are executed on *instances* of the `User` class but at the top of this guide we have already met a *Static Method*. 

Static methods can be tought as methods meant to work with the whole table rather than with a single instance. 
### Drop
Similarly, if some time in the future we'll need to delete the table entirely with all its content, we will do
```typescript
await User.drop()
```
### BatchPut
Previously, we put a single instance to the table with `put` or `save` but it is possible to insert many instances at one time, together in a single operation
```typescript
const johnny = new User()
const mark = new User()
const andy = new User()

johnny.username = "johnny33"
johnny.id = 204
johnny.info = { 
    realname: "John",
    age: 54
}
johnny.role: ["EDITOR"]

mark.username = "mark93"
...
...

andy.username = "andy44"
...
...

await User.batchPut([johnny, mark, andy])
```
> **Careful:** BatchPut operations will overwrite any existing instances of the items we are putting. 
### BatchGet
Similarly, we can retrieve a collection of instances in one single operation
```typescript
const bobID = { id: 10 }
const jimID = { id: 85 }
const jackieID = { id: 50 }

// Plain objects can be used in place of instances

const collection = await User.batchGet([bobID, jimID, jackieID])
```
Variable `collection` will be an array containing the full instances for `bob`, `jim` and `jackie` we had put before. For example we can do
```typescript
collection[0].username = "bob1990"

await collection[0].save()
```
And `bob` will have its *username* field updated in the database.
### BatchDelete
Of course, we can delete multiple items at a time
```typescript
await User.batchDelete([bobID, jimID, jackieID])

// We used plain objects but instances can be used too
```
### Scan
We can also retrieve *every* item present on the table
```typescript
await User.scan()
```
> **Attention:** On very big tables, this operation can be he quite *heavy*

Or we can limit the number of items we'd like to retrieve
```typescript
await User.scan(100)

// Will only retrieve the first 100 instances
```
### Query
Let's put our `User` table aside and take a look at a different type of data structure
```typescript
@Schema({ tableName: "Articles" })
class Article extends Dynam0RX {
    @partitionKey
    readonly slug: "slug" = "slug"
    @sortKey
    id: number
    author: User
    content: { title: string, body: string }
}
```
Unlike before, here we have used `@sortKey` decorator too, which will create a full *Primary Key*. 
> You'll learn more about [Decorators](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#decorators) in the dedicated section.

Plus, our partition key is already assigned with a `readonly` clause and a literal type. This means that every instance in this table will have a *partition key* of type `string` and with a value of `"slug"`. The reason we designed our schema like this is because we plan to use `query` method on this table to retrieve the data. Let's see how does it work
```typescript
const articles = await Article.query({ slug: "slug", id: between(10,20) })
```
As we already know, every element on the `Articles` table have the same *partition key* and a unique *sort key*. The `query` method performs a search on elements with the same *partition key*, based on the *sort key* value. In the example above, an array containing all the instances with an `id` field between `10` and `20` will be returned. Of course this is only one of the many ways that DynamoDB *Query* functionality can be used.
### Update
TODO - Update the table
## Components 
Dynam0RX consists of three main components that can be imported from the package:
* [Dynam0RX Class](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#dynam0rx-class)
* [Decorators](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#decorators)
* [Conditional Operators](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditional-operators)

Now that we know how to use them, let's see how to import each one of them in our project.

### Dynam0RX Class
As we've seen before, when we define a *Schema* we create a new class. For all the methods to be available on this *schema-class*, as seen in the above examples, we need our class to extend the main `Dynam0RX` class.
```typescript
import { Dynam0RX } from "dynam0rx" 

class User extends Dynam0RX {
    // All the props here...
}
```
This allows `User` to inherit all the methods we've seen before and we need to make it work. Think of `Dynam0RX` class as an *abstract* class, not meant to be constructed but only to be extended by other classes. 
> It is **mandatory** for *Schema*s to extend `Dynam0RX` main class.

### Decorators
Decorators are a fundamental part of this client. They serve the purpose of defining what is a class and what its properties are for DynamoDB.
#### Schema
`@Schema()` is a *class decorator*. It **must** be used on top of a class to declare that the class itself defines a DynamoDB table. This decorator determines how the client will connect to the DynamoDB service and the DynamoDB connection configurations. 
```typescript
import { Schema } from "dynam0rx/decorators"

@Schema()
class User extends Dynam0RX {
    // All the other props...
}
```
It accepts a configuration object, consisting of the following properties:
* **tableName**: The name of the table. If not specified, the class's identifier will be used (in this case *User*) as the table name.
* **dynamoDBConfig**: a complete [DynamoDBCLientConfig object](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/dynamodbclientconfig.html)
```typescript
const dynamoDBConfig = {
    region: "eu-central-1"
    endpoint: "http://localhost:3000"
    credentials: {
        secretAccessKey: "some secret key"
        accessKeyId: "some key id"
    }
} 

@Schema({ tableName: "My Users Table", dynamoDBConfig })
class User extends Dynam0RX {
    // All the other props...
}
```
> For info about DynamoDBClientConfig object, refer to the DynamoDB documentation

#### PartitionKey
`partitionKey` decorator has to be applied on top of only one of a *Schema* decorated class's properties, defining its *partition key*. Using this decorator is **mandatory** as a *partition key* is necessary for constructing a DynamoDB *Primary key*
```typescript
import { Schema, partitionKey } from "dynam0rx/decorators"

@Schema()
class User extends Dynam0RX {
    @partitionKey
    id: number
    // All the other props...
}
```
With this setup, instances from this table can be retrieved by just calling their `id` filed.
#### SortKey
The sort key is an optional part of a DynamoDB *Primary key* so using this decorator is **optional** as well.
```typescript
import { Schema, partitionKey, sortKey } from "dynam0rx/decorators"

@Schema()
class Article extends Dynam0RX {
    @partitionKey
    author: string
    @sortKey
    title: string
    // All the other props...
}
```
To retrieve instances from this table, we will need to call both `author` and `title` fields value.
### Conditions
Earlier on this guide, we have seen the use of conditions on some methods in the form of functions. To be used, these functions need to be imported from the package's `/operators` path
```typescript
import { equal } from "dynam0rx/operators"

await something.delete({ id: equal(119) })
```
They can also be imported as an object to help keep the `import` section of your files clean
```typescript
import operators from "dynam0rx/operators"

await something.delete({
    id: operators.equal(119),
    name: operators.begins_with("R"),
    info: {
        content: operators.contains("some content in between"),
        date: operators.greater_equal(30082022),
        author: {
            // They can be used on deeply nested objects
            name: operators.attribute_exists(true),
            articles: operators.size({ ">": 30 })
        }
    }
})
```
It is possible to use multiple conditions together
```typescript
{
    id: { ...attribute_type("number"), ...between(10,13) },
    name: { ...begins_with("Hor"), ...contains("j"), ...attribute_type("string") }
}
```
These are comparison logics that DynamoDB implements in its conditional operations. To learn about what each one of them does, refer to the [Original documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html). *Hint*: their names are quite descriptive!
#### Conditional Operators
* `equal()` 
* `not_equal()`
* `greater()` 
* `greater_equal()`
* `lesser()` 
* `lesser_equal()` 
* `between()`
* `_in()` 
* `contains()`
* `attribute_type()`
* `attribute_exists()` 
* `size()`





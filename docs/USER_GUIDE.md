# User guide

* [Introduction](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#introduction)
* [Define a Schema](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#define-a-schema)
* [Instance Methods](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#instance-methods)
  * [Put](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#put)
  * [Save](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#save)
  * [Get](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#get)
  * [Delete](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#delete)
     * [Conditional Delete](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditional-delete)
  * [Update](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#update)
    * [Conditional Update](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditional-update)
* [Static Methods](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#static-methods)
  * [Initialize](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#initialize)
  * [Update](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#update-1)
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
This guide will focus on Dynam0RX client workflow, covering all its methods and some of the use cases. Things that are strictly related to DynamoDB basic concepts will not be covered as the guide is meant for developers who already have an idea of what DynamoDB is. However, you will find useful links to the original documentation, pointing you in the right direction if you need to learn more about DynamoDB. 
## Define a Schema
As seen on the [main page](https://github.com/soffyo/Dynam0RX#how-does-it-work), we will be working on *Schemas*.
## Instance Methods
When we talk about an *instance* in this guide, we refer to a possible iteration of the schema defined by the class. Instances have methods which can be used to work with them. In this guide we will refer to the `User` class from [before](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#define-a-schema)
>### *Create the table first*
>To create the Table we will just do
>```typescript
>await User.init()
>```
> This will create a table at DynamoDB named *User*.
> More about this method will be covered in the [*Static Methods*](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#static-methods) part of the guide.
### Put
Now we can start creating instances and put them to the table, let's create a `User`
```typescript
const bob = new User()

bob.id = 10
bob.username = "bob90"
bob.email = "soffyo@dynam0rx.com"
bob.info = {
    realname: "Robert",
    age: 32
}
bob.role = ["ADMIN", "USER"]

// or we can simply define the properties directly while constructing the instance

const bob = new User({
    username: "bob90",
    id: 10,
    email: "bob@dynam0rx.com",
    info: {
        realname: "Robert",
        age: 32
    },
    role: ["ADMIN", "USER"]
})
```
When we're done, we can `put` it 
```typescript
await bob.put()
```
This will only succeed if an instance with the same *Primary key* doesn't already exist, otherwise, the operation will fail.
### Save
Let's say after some other code, we need to change some property of the instance we just `put` to the table.
```typescript
bob.email = "bob.new.email@dynam0rx.com"

await bob.save()
```
The new email address will now be saved to the original instance on the tab;e we put before. Otherwise, if we didn't put `bob` before, `save` would have put a new instance to the table like in the following example
```typescript
const jackie = new User()

jackie.id = 50
jackie.username = "jackie87"
jackie.email = "jackie@dynam0rx.com"
jackie.info = {
    realname: "Jack",
    age: 35
}
jackie.role = ["USER"]

await jackie.save()

// Now "jackie" is present on the table
```
The difference between `put` and `save` is that the first puts an instance only if one with the same *Primary key* isn't found on the table while the latter puts an instance to the table as well but if one instance with the same *Primary key* is found, it is then updated (not overwritten) with the new properties.
### Get
How do we retrieve an instance we don't have acces to in our code but that is present on the table? Let's see how we can create a *dummy instance* by only declaring the *Primary key* on it, then use it to retrieve the full instance with `get`
```typescript
const keyforJim = new User({ id: 85 })

const jim = await keyforJim.get()
```
Here, variable `jim` will contain all the properties relative to the *Primary Key* we defined (`id: 85`): a complete instance of `User` with all it's methods attached to it so we can work with them
```typescript
/*
    Example value of the variable "jim":

    User {
        username: "jim119"
        id: 85
        email: "jim@dynam0rx.com"
        info: {
            realname: "Jim",
            age: 25
        }
        role: ["USER"]
    }
*/

jim.info.realname = "James"

await jim.save()
```
### Delete
Deleting an instance is just as simple
```typescript
await jim.delete()
```
But what if we want to delete the instance only when certain conditions are met? Let's say we want to access a record that's already present on the table and delete it only if it has certain properties with certain value. We must `get` it first, then check for some conditions in our code and then `delete` it. This would result in *two* calls to the database, increasing the traffic volume. That's why DynamoDB supports conditions, allowing performing conditional checks and write operations in *one single* database call.
#### Conditional Delete
```typescript
await keyforJim.delete({
    info: {
        age: between(20,30)
    },
    role: contains("ADMIN")
})

// Will fail because "jim"'s role field from before doesn't contain "ADMIN"
// Notice how we used "keyforJim" which shows us that only a primary key is needed.
```
A detailed description of possible conditions and how to use them can be found later in this guide, in the [Conditions section](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md#conditions).
### Update
We can use `update` to make changes on an existent instance only if it is already present on the table. If no matching instance is found, the operation will fail. Let's say that the following *Primary key*, `id: 300` doesn't exist on the table
```typescript
const mary = new User({ id: 300 }) // <-- This primary key is not present on the table

mary.username = "mary003"

await mary.update() // <-- This will fail, because "id: 300" wasn't already present and user "mary" will not be created.
```
#### Conditional Update
Conditional updates are also supported as they are one of the most useful feature of DynamoDB. Let's use `keyforJim` the *dummy instance* we created before
```typescript
keyforJim.role = ["ADMIN"]

await keyforJim.update({
    email: contains("dynam0rx.com"),
    info: {
        age: greater(18)
    }
})
```
Will update `jim` only if its `email` field contains "dynam0rx.com" and its `info.age` field has a value greater than `18`. If one of the conditions is not met, the operation will fail.
## Static Methods
What we have seen before were called *Instance Methods* because they are executed on *instances* of the `User` class but at the top of this guide we have already met a *Static Method*. 

Static methods can be tought as methods meant to work with the whole table rather than with a single instance. 
### Initialize
```typescript
await User.init()
```
This method wasn't executed on an instance of `User` but on `User` itself. Just think of the `User` class as a representation of the table and the data type that will populate it: the above method will just create the table for the first time (if it doesn't already exist). It accepts a single optional parameter which is a configuration object for the table with the following properties:
* **throughput**: *[ProvisionedThroughput object](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ProvisionedThroughput.html)*. If not specified, DynamoDB "PAY PER REQUEST" mode will be used for this table. 
* **stream**: *[StreamViewType string](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_StreamSpecification.html)*. If not specified, streams will be disabled for this table. 
* **infrequent**: *boolean*. Defaults to *false* if not specified. If *true*, `STANDARD_INFREQUENT_ACCESS` mode is used.
```typescript
const tableConfig = {
    stream: "NEW_AND_OLD_IMAGES",
    infrequent: true,
    throughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
}

await User.init(tableConfig)
```
> For info about tables configuration, refer to the DynamoDB documentation.
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
This has to be applied on top of a *Schema* decorated class's property, defining its *partition key*. Using this decorator is **mandatory** as a *Primary key* must consist at least of a *partition key*
```typescript
import { partitionKey } from "dynam0rx/decorators"

@Schema()
class User extends Dynam0RX {
    @partitionKey
    id: number
    // All the other props...
}
```
With this setup, instances from this tables can be retrieved by just calling their *id* filed.
#### SortKey
The sort key is an optional part of a DynamoDB *Primary key*. Using this decorator is **optional** as a DynamoDB *Primary key* can consist of a *partition key* AND a *sort key*
```typescript
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
#### Conditions Operators
#### Query Operators
#### Update Operators





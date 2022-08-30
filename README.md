# Dynam0RX 
## What it is
Dynam0RX is an ORM client for *Amazon DynamoDB*. It provides an API which allows to define *schemas* and enables a clean and fast workflow based on *classes*. [DynamoDB API]() can be very tedious and writing many similar tasks or complicated conditional operations can quickly become painful: that is why this client was created. It is completely based on and bound to Typescript, providing type safety and preventing errors, accelerating the process of working with DynamoDB.
## How does it work
It makes use of Javascript classes and Typescript decorators to define strongly typed *Schemas* from which [*Primary keys*]() can be inferred thanks to Reflect Metadata. It is just as simple as defining a class with its properties and applying the appropriate decorators:
```typescript
@Schema()
class User extends Dynam0RX {
    @partitionKey
    id: number
    username: string
    email: string
    info: {
        realname: string
        age: number
    }
    role: string[]
}
```
This is all that's needed to start working with the schema. Now it is possible to perform all the operations supported by DynamoDB on `User`. 

## User guide - Instance Methods
Let's walk through all the main basic operations one would normally perform on this schema.
### Initialize
To create the Table we will just do
```typescript
await User.init()
```
This will create a table at DynamoDB named *User*. 
If we wanted to give it a different name, we would've passed the `{ tableName }` argument to the `@Schema` decorator
```typescript
@Schema({ tableName: "Users Table" })
```
> This has been included in the *Instance Methods* section for ease of reading but it belogs to the [*Static Methods*]() part of the guide.
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
When we're done, we can *put* it 
```typescript
await bob.put()
```
This will only succeed if an instance with the same *Primary key* doesn't already exist, otherwise, the operation will fail.
### Save
Let's say we made a mistake and we want to change some property of the instance we just `put` to the table.
```typescript
bob.email = "bob.new.email@dynam0rx.com"

await bob.save()
```
The new email address will now be saved to the original record because we had put `bob` to the table before. Otherwise, if we didn't put `bob` before, `save` would have generated a new record and put it to the table like in the following example
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
```
The difference between `put` and `save` is that the first puts an instance only if it doesn't already exists while the latter put an instance if it doesn't already exists or updates the existent instance with its properties.
### Get
How do we retrieve data we don't have a record for but we (or someone else) put to the table earlier? Let's see how we can create a *dummy* instance by only declaring the *Primary key* on it, then retrieve the full instance using `get`
```typescript
const keyforJim = new User({ id: 85 })

const jim = await keyforJim.get()
```
Here, variable `jim` is an instance of `User` and it has all it's methods attached to it so we can work with them
```typescript
/*
    Example value for variable "jim":

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
But what if we want to delete the instance only when certain conditions are met? Let's say we want to access a record that's already present on the table and delete it only if it has certain properties with certain value. We must `get` it first, then check for our conditions and then `delete` it. This would result in *two* calls to the database, increasing the traffic volume. That's why DynamoDB supports conditions, allowing performing conditional checks and write operations in *one single* database call.
#### Conditional Delete
```typescript
await keyforJim.delete({
    info: {
        age: between(20,30)
    },
    role: contains("ADMIN")
})

// Will fail because "jim"'s role field doesn't contain "ADMIN"
```
A detailed description of possible conditions and how to use them can be found [later in this guide]().
### Update
We can update an existent instance only if it is already present on the table. If no matching instance is found, the operation will fail. Conditional updates are also supported as they are one of the most useful feature of DynamoDB
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
## User guide - Static Methods
What we have seen before were called *Instance Methods* because they are executed on *instances* of the `User` class but at the top of this guide we have already met a `Static Method`
### Initialize
```typescript
await User.init()
```
This method wasn't executed on an instance of `User` but on `User` itself. Just think of the `User` class as a representation of the table and the data type that will populate it: the above method will just create the table for the first time.
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
>To learn more about DynamoDB *Key Schema* system, refer to the documentation.

Plus, our partition key is already assigned with a `readonly` clause and a literal type. This means that every instance in this table will have a *partition key* of type `string` and with a value of `"slug"`. The reason we designed our schema like this is because we plan to use `query` method on this table to retrieve the data. Let's see how does it work
```typescript
const articles = await Article.query({ slug: "slug", id: between(10,20) })
```
As we already know, every element on the `Articles` table have the same *partition key* and a unique *sort key*. `Query` method performs a search on elements with the same *partition key* based on the *sort key* value. In the example above, an array containing all the instances with an `id` field between `10` and `20` will be returned 


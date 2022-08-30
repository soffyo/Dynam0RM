# Dynam0RX 
## What it is
Dynam0RX is an ORM client for *Amazon DynamoDB*. It provides an API which allows to define *schemas* and enables a clean and fast workflow based on *classes*. [DynamoDB API]() can be very tedious and writing many similar tasks or complicated conditional operations can quickly become painful: that is why this client was created. It is completely based on and bound to Typescript, providing type safety and preventing errors, accelerating the process of working with DynamoDB.
## How does it work
It makes use of Javascript classes and Typescript decorators to define strongly typed *Schemas* from which [*Primary keys*]() can be inferred thanks to Reflect Metadata. It is just as simple as defining a class with its properties and applying the appropriate decorators:
```typescript
@Schema()
class User extends Dynam0RX {
    @partitionKey
    username: string
    @sortKey
    id: number
    email: string
    info: {
        realname: string
        age: number
    }
    role: string[]
}
```
This is all that's needed to start working with the schema. Now it is possible to perform all the operations supported by DynamoDB on `User`. 

## **API** - Instance Methods
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

user.username = "bob90"
user.id = 10
user.email = "soffyo@dynam0rx.com"
user.info = {
    realname: "Robert",
    age: 32
}
user.role = ["ADMIN", "USER"]

// or we can simply define the properties directly while constructing the instance

const bob = new User({
    username: "bob90",
    id: 10,
    email: "bob@dynam0rx.com",
    info: {
        realname: "Robert",
        age: 32
    }
    role: ["ADMIN", "USER"]
})
```
When we're done, we can *put* it 
```typescript
await bob.put()
```
This will only succeed if an instance with the same *primary key* doesn't already exist, otherwise, the operation will fail.
### Save
Let's say we made a mistake and we want to change some property of the instance we just `put` to the table.
```typescript
bob.email = "bob.new.email@dynam0rx.com"

await bob.save()
```
The new email address will now be saved to the original record because we had put `bob` to the table before. Otherwise, if we didn't put `bob` before, `save` would have generated a new record and put it to the table like in the following example
```typescript
const jackie = new User()

jackie.username = "jackie87"
jackie.id = 50
jackie.email = "jackie@dynam0rx.com"
jackie.info = {
    realname: "Jack",
    age: 35
}
jackie.role = ["USER"]

await jackie.save()
```
The difference between `put` and `save` is that the first puts an instance only if it doesn't already exists while the latter put an instance if it doesn't already exists, otherwise updated the existent instance with its properties.
### Get
How do we retrieve data we don't have a record for but we (or someone else) put to the table earlier? Let's see how we can create a *dummy* instance by only declaring the *Primary key* on it, the retrieve the full instance using `get`
```typescript
const keyforJim = new User({ username: "jim119", id: 85 })

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
## **API** - Static Methods
TODO

# What it is
Dynam0RX is an ORM client for *Amazon DynamoDB*. It provides an API which allows to define *schemas* and enables a clean and fast workflow based on *classes*. [DynamoDB API](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Operations_Amazon_DynamoDB.html) can be very tedious and writing many similar tasks or complicated conditional operations can quickly become painful: that is why this client was created. It is completely based on and bound to Typescript, providing type safety and preventing errors, accelerating the process of working with DynamoDB.
# How does it work
It makes use of Javascript classes and Typescript decorators to define strongly typed *Schemas* from which every operation can be performed with type safety. It is just as simple as defining a class with its properties and applying the appropriate decorators. This is all that's needed to start working with the schemas
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


await User.init()

const user = new User()

user.id = 0
user.username = "~soffyo"
user.email = "soffyo@dynam0rx.com"
user.info = {
    realname = "Robert",
    age: 31
}
role = ["FOUNDER","ROOT"]

await user.save()

user.info.realname = "Bob"
user.info.age = 32

await user.save()

await user.delete()
``` 
A detailed explanation of how this client works can be found in the **[User Guide](https://github.com/soffyo/Dynam0RX/blob/main/docs/USER_GUIDE.md)**.

# Development
## Who mantains this project?
I am a single person and I have created this client from scatch. I initially started it for personal use only but it evolved in something I think everyone could find useful and use as well.
## Contributing
If you have found a bug, want to discuss about some feature you think should be added to this project, or just want to share some opinion you can do it here on github or contact me directly. I will be happy to hear from you! :)
## Known Issues
As of today, there are some limitations due to the actual state of typescript decorators implementation. The aim of this client is to remain as simple as possible for the end user with a minimal and easy to remember API. This has led to some developement compromises.
### Partition Key and Sort Key `name:type` cannot be inferred
Let's consider the following Schema
```typescript
{
    @partitionKey
    artist: string
    @sortKey
    song: string
}
```
When we use a method which involves *Primary keys*, like `batchGet` on it, it will be only partially typed
```typescript
batchGet([{ artist: "Michael Jackson" }])
```
This request is not valid because we needed to declare for ex. `{ artist: "Michael Jackson", song: "Thriller" }` but the typescript compiler will not error here.
#### Why?
The actual implementation, can only tell the typescript compiler that a primary key must be composed of at least one and at most two top level keys from the schema type, which are either of type *string* or *number* but there is actually no clean way to tell typescript which key is the partition key and which one is - if existent - the sort key without overcomplicating the external API. A look at the actual `PrimaryKeys` type implementation: quite bloated!
```typescript
type Valueof<T> = T[keyof T]
type Only<T,K extends keyof T> = Pick<T,K> & { [P in Exclude<keyof T,K>]?: never }

type PrimaryKeys<T extends Record<string,any>> = Valueof<{
    [K in keyof OmitMethods<T>]-?: T[K] extends (string|number) ? Only<T,K> | Valueof<{
            [L in Exclude<keyof T,K>]+?: T[L] extends (string|number) ? Only<T,K|L> : never
    }> : never
}>
```
The room for type errors is in reality very limited here. You *have* to know what the primary key of your schema is *anyway*! This seems **temporarily** acceptable.
#### It will be fixed
This compromise was accepted only for one reason: it will be fixed in the future. As decorators have made it to Stage 3, Typescript [plans to implement](https://github.com/microsoft/TypeScript/issues/48885) the new proposal, along with *typed* decorators. In a future where decorators are able to make the compiler aware of added classes's properties and change the type of classes, this will be easily addressed.






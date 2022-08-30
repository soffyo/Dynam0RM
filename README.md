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




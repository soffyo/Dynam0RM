import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb"

new TransactWriteCommand({
    TransactItems: [
        {
            Put: {
                Item: {},
                TableName: ''
            },
            Update: {
                TableName: '',
                Key: {},
                UpdateExpression: ''
            }
        }
    ]
})
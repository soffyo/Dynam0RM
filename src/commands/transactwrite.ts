import { TransactWriteCommand, PutCommandInput, UpdateCommandInput, DeleteCommandInput } from "@aws-sdk/lib-dynamodb"

class Transaction<T> {
    private readonly Put: PutCommandInput[] = []
    private readonly Update: UpdateCommandInput[] = []
    private readonly Delete: DeleteCommandInput[] = []
}

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
            },
            Delete: {
                TableName: '',
                Key: {}
            },
            ConditionCheck: {
                ConditionExpression: '',
                TableName: '',
                Key: {}
            }
        }
    ]
})
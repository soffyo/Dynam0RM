import {TestEnvironment} from 'jest-environment-node'
import {ChildProcess, spawn} from 'node:child_process'
import {EnvironmentContext, JestEnvironmentConfig} from '@jest/environment'

export default class DynamoDBEnvironment extends TestEnvironment {
    readonly #dynamodb: ChildProcess

    public constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
        super(config, context)

        const args = [
            '-Djava.library.path=./DynamoDBLocal_lib',
            '-jar ./DynamoDBLocal.jar',
            '-inMemory'
        ]
        this.#dynamodb = spawn('java', args, {cwd: './dynamodb_local', shell: true})
    }

    public async setup() {
        await super.setup()
        await new Promise((resolve, reject) => {
            let stdout = ''
            this.#dynamodb?.stdout?.on('data', data => {
                stdout += `${data}`
                if (stdout.match(/CorsParams/)) setTimeout(x => resolve(x), 1000)
            })
            this.#dynamodb?.stderr?.on('data', data => {
                console.log(`${data}`)
                reject(`${data}`)
            })
        })
    }

    public async teardown() {
        if (this.#dynamodb?.pid) process.kill(this.#dynamodb.pid)
        await new Promise(res => this.#dynamodb.on('exit', data => res(data)))
        await super.teardown()
    }

    public getVmContext() {
        return super.getVmContext()
    }
}
import {AsyncResource} from 'node:async_hooks'
import {EventEmitter} from 'node:events'
import {TsWorker} from '@asnaeb/ts-worker'
import {cpus} from 'node:os'

const kTaskInfo = Symbol('kTaskInfo')
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent')

type Callback<T> = (error: Error, result: T) => void

class WorkerPoolTaskInfo<T> extends AsyncResource {
    public constructor(private readonly callback: Callback<T>) {
        super('WorkerPoolTaskInfo')
    } 

    done(error: Error | null, result: any) {
        this.runInAsyncScope(this.callback, null, error, result)
        this.emitDestroy()
    }
}

class WorkerWithTask<T> extends TsWorker {
    public [kTaskInfo]?: WorkerPoolTaskInfo<T> | null
}

export class WorkerPool<I, O = I> extends EventEmitter {
    readonly #path: string
    readonly #workers: WorkerWithTask<O>[]
    readonly #freeWorkers: WorkerWithTask<O>[]
    readonly #tasks: {task: I, callback: Callback<O>}[]

    public readonly threads: number

    public constructor(path: string, threads?: number) {
        super()
        this.#path = path
        this.threads = threads ?? cpus().length
        this.#workers = []
        this.#freeWorkers = []
        this.#tasks = []

        for (let i = 0; i < this.threads; i++) this.#addNewWorker()

        this.on(kWorkerFreedEvent, () => {
            if (this.#tasks.length > 0) {
                const firstTask = this.#tasks.shift()
                if (firstTask) this.runTask(firstTask.task, firstTask.callback)
            }
        })
    }

    #addNewWorker() {
        const worker = new WorkerWithTask(this.#path)
        worker.on('message', result => {
            worker[kTaskInfo]?.done(null, result)
            worker[kTaskInfo] = null
            this.#freeWorkers.push(worker)
            this.emit(kWorkerFreedEvent)
        })
        worker.on('error', (error) => {
            if (worker[kTaskInfo]) worker[kTaskInfo].done(error, null)
            else this.emit('error', error)
            this.#workers.splice(this.#workers.indexOf(worker), 1)
            this.#addNewWorker()
        })

        this.#workers.push(worker)
        this.#freeWorkers.push(worker)
        this.emit(kWorkerFreedEvent)
    }

    public runTask(task: I, callback: Callback<O>) {
        if (this.#freeWorkers.length === 0) {
            this.#tasks.push({task, callback})
            return
        }

        const worker = this.#freeWorkers.pop()
        if (worker) {
            worker[kTaskInfo] = new WorkerPoolTaskInfo(callback)
            worker.postMessage(task)
        }
    }

    public close() {
        for (const worker of this.#workers) worker.terminate()
    }
}
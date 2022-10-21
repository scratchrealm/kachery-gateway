import * as fs from 'fs'
import { LogItem } from "../../src/types/LogItem"
import firestoreDatabase from "./firestoreDatabase"
import { computeObjectSha1, copyObject, deleteObject, listObjects, objectExists } from "./s3Helpers"

const main = async () => {
    const googleCredentials = fs.readFileSync('googleCredentials.json', {encoding: 'utf-8'})
    process.env['GOOGLE_CREDENTIALS'] = googleCredentials
    const db = firestoreDatabase()

    const wasabiCredentials = fs.readFileSync('wasabiCredentials.json', {encoding: 'utf-8'})
    const bucket = {uri: 'wasabi://kachery-cloud?region=us-east-1', credentials: wasabiCredentials}

    const logItemsCollection = db.collection('kachery-gateway.logItems')
    
    const uploadedItems = await listObjects(bucket, 'uploads/sha1/')
    for (let item of uploadedItems) {
        const requestTimestamp = Date.now()
        const hash = item.Key.split('/')[5]
        console.info('=======================================')
        console.info(`sha1://${hash} (${item.Size})`)
        const h = hash
        const key2 = `sha1/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${hash}`
        if (await objectExists(bucket, key2)) {
            console.info('Already exists. Deleting.')
            await deleteObject(bucket, item.Key)
            const logItem: LogItem = {
                request: {
                    type: 'deleteUploadBecauseAlreadyExists',
                    hashAlg: 'sha1',
                    hash,
                    objectKey: item.Key,
                    size: item.Size
                },
                response: {},
                requestHeaders: {},
                requestTimestamp,
                elapsed: Date.now() - requestTimestamp
            }
            await logItemsCollection.add(logItem)
        }
        else if (item.Size > 100 * 1000 * 1000) {
            console.info('Too large. Skipping.')
        }
        else {
            const hash0 = await computeObjectSha1(bucket, item.Key)
            if (hash0 === hash) {
                console.info('Accepting object')
                await copyObject(bucket, item.Key, key2)
                console.info('Deleting object')
                await deleteObject(bucket, item.Key)
                const logItem: LogItem = {
                    request: {
                        type: 'acceptUpload',
                        hashAlg: 'sha1',
                        hash,
                        objectKey: item.Key,
                        destKey: key2,
                        size: item.Size
                    },
                    response: {},
                    requestHeaders: {},
                    requestTimestamp,
                    elapsed: Date.now() - requestTimestamp
                }
                await logItemsCollection.add(logItem)
            }
            else {
                console.warn(`HASH MISMATCH: ${hash0} <> ${hash}`)
                await deleteObject(bucket, item.Key)
                const logItem: LogItem = {
                    request: {
                        type: 'deleteUploadBecauseHashMismatch',
                        hashAlg: 'sha1',
                        hash,
                        hashComputed: hash0,
                        objectKey: item.Key,
                        size: item.Size
                    },
                    response: {},
                    requestHeaders: {},
                    requestTimestamp,
                    elapsed: Date.now() - requestTimestamp
                }
                await logItemsCollection.add(logItem)
            }
        }
    }
}

main()
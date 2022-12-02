import { useCallback, useEffect, useState } from "react"
import guiApiRequest from "../common/guiApiRequest"
import useErrorMessage from "../errorMessageContext/useErrorMessage"
import { useGithubAuth } from "../GithubAuth/useGithubAuth"
import { AddResourceRequest, DeleteResourceRequest, GetResourcesRequest, isAddResourceResponse, isDeleteResourceResponse, isGetResourcesResponse } from "../types/GuiRequest"
import { Resource } from "../types/Resource"
import useRoute from "./useRoute"

const useResources = () => {
    const [resources, setResources] = useState<Resource[] | undefined>(undefined)
    const { userId, accessToken } = useGithubAuth()
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const refreshResources = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])
    const {setErrorMessage} = useErrorMessage()

    useEffect(() => {
        ; (async () => {
            setErrorMessage('')
            setResources(undefined)
            if (!userId) return
            let canceled = false
            const req: GetResourcesRequest = {
                type: 'getResources',
                userId,
                auth: { userId, githubAccessToken: accessToken }
            }
            const resp = await guiApiRequest(req, { reCaptcha: false, setErrorMessage })
            if (!resp) return
            if (!isGetResourcesResponse(resp)) {
                console.warn(resp)
                throw Error('Unexpected response')
            }
            console.log(resp)
            if (canceled) return
            setResources(resp.resources)
            return () => { canceled = true }
        })()
    }, [userId, accessToken, refreshCode, setErrorMessage])

    const {setRoute} = useRoute()

    const addResource = useCallback((resourceName: string, proxyUrl: string, o: {navigateToResourcePage?: boolean}) => {
        if (!userId) return
            ; (async () => {
                const req: AddResourceRequest = {
                    type: 'addResource',
                    resourceName,
                    ownerId: userId,
                    proxyUrl,
                    auth: { userId, githubAccessToken: accessToken }
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isAddResourceResponse(resp)) {
                    throw Error('Unexpected response')
                }
                if (o.navigateToResourcePage) {
                    setRoute({page: 'resource', resourceName})
                }
                refreshResources()
            })()
    }, [userId, accessToken, refreshResources, setErrorMessage, setRoute])

    const deleteResource = useCallback((resourceName: string) => {
        if (!userId) return
            ; (async () => {
                const req: DeleteResourceRequest = {
                    type: 'deleteResource',
                    resourceName,
                    ownerId: userId,
                    auth: { userId, githubAccessToken: accessToken }
                }
                const resp = await guiApiRequest(req, { reCaptcha: true, setErrorMessage })
                if (!resp) return
                if (!isDeleteResourceResponse(resp)) {
                    throw Error('Unexpected response')
                }
                refreshResources()
            })()
    }, [userId, accessToken, refreshResources, setErrorMessage])

    return { resources, refreshResources, addResource, deleteResource }
}

export default useResources
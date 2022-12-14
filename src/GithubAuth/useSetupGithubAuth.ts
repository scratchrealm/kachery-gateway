import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { getGitHubTokenInfoFromLocalStorage, setGitHubTokenInfoToLocalStorage } from '../MainWindow/ApplicationBar/PersonalAccessTokenWindow'
import { GithubAuthData } from './GithubAuthContext'

type GithubLoginStatus ={
	status: 'checking' | 'logged-in' | 'not-logged-in'
	accessToken?: string
    isPersonalAccessToken?: boolean
}

const useSetupGithubAuth = (): GithubAuthData => {
    const [loginStatus, setLoginStatus] = useState<GithubLoginStatus>({status: 'checking'})
    const [userName, setUserName] = useState('')
    useEffect(() => {
		// polling
		const intervalId = setInterval(() => {
			const tokenInfo = getGitHubTokenInfoFromLocalStorage()
			if (tokenInfo?.token) {
				setLoginStatus({
					status: 'logged-in',
					accessToken: tokenInfo.token,
                    isPersonalAccessToken: tokenInfo.isPersonalAccessToken
				})
			}
			else {
				setLoginStatus({
					status: 'not-logged-in'
				})
			}
		}, 1000)
		return () => {
			clearInterval(intervalId)
		}
	}, [])
    useEffect(() => {
		if (loginStatus.accessToken) {
			const tokenInfo = getGitHubTokenInfoFromLocalStorage()
			const u = tokenInfo?.userId
			const elapsed = Date.now() - (tokenInfo?.userIdTimestamp || 0)
			if ((u) && (elapsed < 1000 * 60 * 10)) {
				setUserName(u)
			}
			else {
				axios.get(`https://api.github.com/user`, {headers: {Authorization: `token ${loginStatus.accessToken}`}}).then(resp => {
					setGitHubTokenInfoToLocalStorage({
						...tokenInfo,
						userId: resp.data.login,
						userIdTimestamp: Date.now()
					})
					setUserName(resp.data.login)
				})
			}
		}
	}, [loginStatus.accessToken])

    const clearAccessToken = useCallback(() => {
        setGitHubTokenInfoToLocalStorage({})
    }, [])

    return {
        signedIn: loginStatus.status === 'logged-in',
        userId: userName,
        accessToken: loginStatus.accessToken,
        isPersonalAccessToken: loginStatus.isPersonalAccessToken,
        loginStatus: loginStatus.status,
        clearAccessToken
    }
}

export default useSetupGithubAuth
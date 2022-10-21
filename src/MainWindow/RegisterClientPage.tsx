import { Button, Table, TableBody, TableCell, TableRow } from '@material-ui/core';
import guiApiRequest from '../common/guiApiRequest';
import { useSignedIn } from '../components/googleSignIn/GoogleSignIn';
import useRoute from './useRoute';
import useErrorMessage from '../errorMessageContext/useErrorMessage';
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import EditableTextField from './EditableTextField';
import { NodeId, Signature } from '../types/keypair';
import { AddClientRequest } from '../types/GuiRequest';

type Props = {
    clientId: NodeId
    signature: Signature
    label: string
}

type Status = 'waiting' | 'starting' | 'running' | 'error' | 'finished'

const RegisterClientPage: FunctionComponent<Props> = ({clientId, signature, label}) => {
    const {userId, googleIdToken, signedIn} = useSignedIn()
    const [status, setStatus] = useState<Status>('waiting')
    const { errorMessage, setErrorMessage } = useErrorMessage()
    const { setRoute } = useRoute()

    const handleRegister = useCallback(() => {
        setStatus('starting')
    }, [])

    const [editLabel, setEditLabel] = useState<string>('')
    useEffect(() => {
        setEditLabel(label)
    }, [label])
    const handleLabelChange = useCallback((x: string) => {
        setEditLabel(x)
    }, [])

    useEffect(() => {
        if (!userId) return
        if (!googleIdToken) return
        ;(async () => {
            if (status === 'starting') {
                setStatus('running')
                const req: AddClientRequest = {
                    type: 'addClient',
                    clientId,
                    ownerId: userId,
                    label: editLabel,
                    verificationDocument: {
                        type: 'addClient'
                    },
                    verificationSignature: signature,
                    auth: {
                        userId,
                        googleIdToken
                    }
                }
                const response = await guiApiRequest(req, {reCaptcha: true, setErrorMessage})
                if (response) {
                    setStatus('finished')
                }
                else {
                    setStatus('error')
                }
            }
        })()
    }, [status, userId, clientId, setErrorMessage, signature, googleIdToken, setRoute, editLabel])

    const submitOkay = useMemo(() => {
        if (!userId) return false
        if (!label) return false
        return true
    }, [label, userId])

    if (!signedIn) {
        return (
            <div>
                <h2>Register a client</h2>
                <p>To associate this client with your user, you must first log in above.</p>
            </div>
        )
    }

    return (
        <div>
            <h2>Register a client</h2>
            <p>You are associating this client with your logged in user and a kachery-cloud project.</p>
            <p>Complete this form and then click the REGISTER CLIENT button below.</p>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Client ID</TableCell>
                        <TableCell>{clientId}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>{userId}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Label</TableCell>
                        <TableCell><EditableTextField value={editLabel} onChange={handleLabelChange} /></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <div>
                <Button disabled={(!submitOkay) || (status !== 'waiting')} onClick={handleRegister}>
                    Register client
                </Button>
            </div>
            {
                (status === 'running') && (
                    <p>Please wait...</p>
                )
            }
            {
                (status === 'finished') && (
                    <p>Your client was successfully registered.</p>
                )
            }
            {
                status === 'error' && (
                    <p><span style={{color: 'red'}}>Error registering client: {errorMessage}</span></p>
                )
            }
        </div>
    )
}

export default RegisterClientPage
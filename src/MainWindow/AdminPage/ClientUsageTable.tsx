import { FunctionComponent, useMemo } from "react";
import NiceTable from "../../components/NiceTable/NiceTable";
import formatByteCount from "../../misc/formatByteCount";

type Props ={
	clientUsage: {[key: string]: {uploadCount: number, uploadSize: number, downloadCount: number, downloadSize: number, fallbackDownloadCount: number, fallbackDownloadSize: number, ownerId: string}}
}

const columns = [
	{key: 'clientId', label: 'Client'},
	{key: 'ownerId', label: 'Owner'},
	{key: 'numFilesUpload', label: 'Num. files upload'},
	{key: 'sizeUpload', label: 'Size upload'},
	{key: 'numFilesDownload', label: 'Num. files download'},
	{key: 'sizeDownload', label: 'Size download'},
	{key: 'numFilesFallbackDownload', label: 'Num. files download (fallback)'},
	{key: 'sizeFallbackDownload', label: 'Size download (fallback)'}
]

const ClientUsageTable: FunctionComponent<Props> = ({clientUsage}) => {
	const clientIds = useMemo(() => (Object.keys(clientUsage).sort()), [clientUsage])
	const rows = useMemo(() => (
		clientIds.map(clientId => ({
			key: clientId,
			columnValues: {
				clientId: `${clientId.slice(0, 6)}...`,
				ownerId: clientUsage[clientId].ownerId,
				numFilesUpload: clientUsage[clientId].uploadCount,
				sizeUpload: formatByteCount(clientUsage[clientId].uploadSize),
				numFilesDownload: clientUsage[clientId].downloadCount,
				sizeDownload: formatByteCount(clientUsage[clientId].downloadSize),
				numFilesFallbackDownload: clientUsage[clientId].fallbackDownloadCount,
				sizeFallbackDownload: formatByteCount(clientUsage[clientId].fallbackDownloadSize),
			}
		}))
	), [clientUsage, clientIds])
	return (
		<NiceTable
			columns={columns}
			rows={rows}
		/>
	)
}

export default ClientUsageTable

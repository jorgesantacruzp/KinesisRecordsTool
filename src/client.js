const {ipcRenderer: ipc, remote} = require('electron')

const configPanel= 'configPanel'
const resultsPanel = 'resultsPanel'

showConfig()

document.addEventListener('DOMContentLoaded', ()=>{
	hideLoading()
	ipc.send('load-config',true)
})

document.getElementById('config').addEventListener('click', () => {
	showConfig()
	ipc.send('load-config')
})

document.getElementById('getRecords').addEventListener('click', () => {
	document.getElementById('loading').style.display='block'
	document.getElementById('records').value = ''
	let shardId = document.getElementById('shardId').value
	const streamName = document.getElementById('streamName').value
	const time = document.getElementsByName('time')[0].value
	if (shardId.length <= 0) shardId = 'shardId-000000000000'
	const params = {
		shardId,
		streamName,
		time
	}
	ipc.send('getRecords', params)
})

document.getElementById('save').addEventListener('click', () => {
	const accessKeyId = document.getElementById('accessKeyId').value
	const secretAccessKey = document.getElementById('secretAccessKey').value
	const region = document.getElementById('region').value
	const params = {
		accessKeyId,
		secretAccessKey,
		region
	}
	ipc.send('save-config',params)
})

document.getElementById('exit').addEventListener('click', () => {
	let window = remote.getCurrentWindow()
	window.close()
})

ipc.on('recordsFetched',(e, records)=>{
	hideLoading()
	document.getElementById('records').value = records
})

ipc.on('disableLoading',(e)=>{
	hideLoading()
})

ipc.on('loaded',(e,params,firstLoad)=>{
	if(firstLoad && params){
		showResults()
	}else if(params){
		const {accessKeyId,secretAccessKey,region}= params
		document.getElementById('accessKeyId').value=accessKeyId
		document.getElementById('secretAccessKey').value=secretAccessKey
		document.getElementById('region').value=region
	}
})

ipc.on('configured',()=>{
	showResults()
})

function showConfig(){
	showPanel(configPanel)
	hidePanel(resultsPanel)
}

function showResults(){
	showPanel(resultsPanel)
	hidePanel(configPanel)
}

function showPanel(panelId){
	document.getElementById(panelId).style.display='block'
	if(panelId==configPanel){
		document.getElementById('accessKeyId').value=''
		document.getElementById('secretAccessKey').value=''
		document.getElementById('region').value=''
	}
}

function hidePanel(panelId){
	document.getElementById(panelId).style.display='none'
}

function hideLoading() {
	document.getElementById('loading').style.display='none'
}

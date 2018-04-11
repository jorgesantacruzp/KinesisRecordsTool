const {ipcRenderer: ipc, remote} = require('electron')

const configPanel= 'configPanel'
const resultsPanel = 'resultsPanel'

showConfig()

document.addEventListener('DOMContentLoaded', ()=>{
	document.getElementById('unitTimeDiv').style.display='none'
	document.getElementById('time').value = 1
	hideLoading()
	ipc.send('load-config',true)
})

document.getElementById('config').addEventListener('click', () => {
	showConfig()
	ipc.send('load-config')
})

document.getElementById('getRecords').addEventListener('click', () => {
	document.getElementById('loading').style.display='block'
	document.getElementById('results').innerHTML=''
	let shardId = document.getElementById('shardId').value
	const streamName = document.getElementById('streamName').value
	const time = document.getElementById('time').value
	const unitTime = document.getElementsByName('unitTime')[0].value
	const timestamp = getTimestamp(time, unitTime)
	if (shardId.length <= 0) shardId = 'shardId-000000000000'
	const params = {
		shardId,
		streamName,
		timestamp
	}
	ipc.send('getRecords', params)
})

document.getElementById('save').addEventListener('click', () => {
	const accessKeyId = document.getElementById('accessKeyId').value
	const secretAccessKey = document.getElementById('secretAccessKey').value
	const region = document.getElementById('region').value
	const streamName = document.getElementById('streamName').value
	const params = {
		accessKeyId,
		secretAccessKey,
		region,
		streamName
	}
	ipc.send('save-config',params)
})

document.getElementById('exit').addEventListener('click', () => {
	let window = remote.getCurrentWindow()
	window.close()
})

ipc.on('recordsFetched',(e, records)=>{
	hideLoading()
	let div = document.createElement('div')
	div.className = 'row'
	div.innerHTML = records
	document.getElementById('results').appendChild(div)
	if(records.indexOf("No records") > 0) {
		document.getElementById('noRecords').addEventListener('click', () => {
			document.getElementById('unitTimeDiv').style.display='block'
		})
	}
})

ipc.on('disableLoading',(e)=>{
	hideLoading()
})

ipc.on('loaded',(e,params,firstLoad)=>{
	if(firstLoad && params){
		showResults()
	}else if(params){
		const {accessKeyId,secretAccessKey,region,streamName}= params
		document.getElementById('accessKeyId').value=accessKeyId
		document.getElementById('secretAccessKey').value=secretAccessKey
		document.getElementById('region').value=region
		document.getElementById('streamName').value=streamName
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

function getTimestamp(clientTime, unitTime) {
	// 1 hour by default
	let time = clientTime ? clientTime : 1
	if (time > 30) {
		time = 30
		document.getElementById('time').value=30
	}
	let conversionNumber = 60*60*1000
	const currentTime = new Date().getTime()
	if (unitTime === "minutes") {
		conversionNumber = 60*1000
	} else if (unitTime === "hours") {
		conversionNumber = 60*60*1000
	}
	return (currentTime - (time * conversionNumber)) / 1000
}

const {
  app,
  dialog,
  BrowserWindow,
  ipcMain: ipc
} = require('electron')

const config = require('./config')
const kinesis = require('./kinesis')
let time = ''

let mainWindow
app.on('ready', () => {
	mainWindow = new BrowserWindow({
		webPreferences: {
			devTools: false
		},
		frame: false,
		resizable: true
	})
	mainWindow.loadURL(`file://${__dirname}/client.html`)

	mainWindow.on('closed', () => {
		mainWindow = null
	})

	mainWindow.maximize()
})

app.on('window-all-closed', () => {
	if (process.platform != 'darwin')
		app.quit()
})

ipc.on('load-config',(e,firstLoad)=>{
	config.read(configParams=>{
		if(configParams) kinesis.configure(configParams)
		else if (!firstLoad) showErrorMSG('Configuration parameters couldn\'t be loaded')
		mainWindow.webContents.send('loaded', configParams, firstLoad)
	})
})

ipc.on('save-config',(e,data)=>{
	kinesis.configure(data)
	config.save(data,(err)=>{
		if(err) showErrorMSG('There was an error when saving configuration')
	})
	mainWindow.webContents.send('configured')
})

ipc.on('getRecords',(e, params)=>{
	kinesis.getKinesisRecords(params.shardId, params.streamName, function(err, data) {
		if (err){
			showErrorMSG('Not able to get records, verify the credentials ', err.message)
		} else {
			time = params.time
			kinesis.getRecordsFromShard(data.ShardIterator, getRecordsCallback)
		}
	})
})

function getRecordsCallback(err, data) {
	if (err) {
		showErrorMSG('Not able to get records ', err.message)
	} else {
		let records = ''
		let partitionKey = ''
		if(data.Records.length > 0) {
			let isFirstTime = true
			for(let i=data.Records.length - 1; i >= 0 ; i--) {
				let decoded = bin2string(data.Records[i].Data)
				partitionKey = data.Records[i].PartitionKey

				if (time !== "ALL" && mustNotBeShown(partitionKey)) continue

				let date = new Date(Number(partitionKey))
				if(records.indexOf(partitionKey) < 0) {
					if (isFirstTime) {
						isFirstTime = false
						records += "<h4>" + date + "</h4>"
					} else {
						records += "<h4>" + date + "</h4>"
					}
				}
				records += "<p>" + decoded + "</p><br>"
			}
		}
		if(records === '') records += "<p> No records </p>"
		mainWindow.webContents.send('recordsFetched', records)
	}
}

function mustNotBeShown(partitionKey) {
	let miliseconds = 0
	const currentTime = new Date().getTime()
	if (time === "ONE") {
		miliseconds = 3600000
	} else if (time === "TWO") {
		miliseconds = 7200000
	} else if (time === "FIVE") {
		miliseconds = 18000000
	} else if (time === "TWELVE") {
		miliseconds = 43200000
	} else if (time === "DAY") {
		miliseconds = 86400000
	}
	return (currentTime - miliseconds) > partitionKey

}

function bin2string(array){
	var result = ""
	for(var i = 0; i < array.length; ++i){
		result+= (String.fromCharCode(array[i]))
	}
	return result
}

function showErrorMSG(msg){
	dialog.showMessageBox(mainWindow,{type:'error',buttons:[],title:'ERROR',message:msg})
	mainWindow.webContents.send('disableLoading')
}

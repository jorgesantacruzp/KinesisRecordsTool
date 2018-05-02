const {
  app,
  dialog,
  BrowserWindow,
  ipcMain: ipc
} = require('electron')

const config = require('./config')
const kinesis = require('./kinesis')

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
		let streamName = ''
		if(configParams) {
			streamName = configParams.streamName
			delete configParams.streamName
		}
		if(configParams) kinesis.configure(configParams)
		else if (!firstLoad) showErrorMSG('Configuration parameters couldn\'t be loaded')
		if(configParams) {
			configParams.streamName = streamName
		}
		mainWindow.webContents.send('loaded', configParams, firstLoad)
	})
})

ipc.on('save-config',(e,data)=>{
	config.save(data,(err)=>{
		if(err) showErrorMSG('There was an error when saving configuration')
	})
	delete data.streamName
	kinesis.configure(data)
	mainWindow.webContents.send('configured')
})

ipc.on('getRecords',(e, params)=>{
	kinesis.getKinesisRecords(params, function(err, data) {
		if (err){
			showErrorMSG('Not able to get records, verify the credentials ', err.message)
		} else {
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

				let date = new Date(Number(partitionKey))
				if(records.indexOf(date) < 0) {
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
		if(records === '') records += "<p id=\"noRecords\"> No records </p>"
		mainWindow.webContents.send('recordsFetched', records)
	}
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

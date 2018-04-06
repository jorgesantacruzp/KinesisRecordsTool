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
			devTools: true
		},
		frame: true,
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

ipc.on('getRecords',(e)=>{
	kinesis.getKinesisRecords('shardId-000000000000', 'Dev_Alerts_IDProtection',
	function(err, data) {
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
			for(let i=0; i < data.Records.length; i++) {
				let decoded = bin2string(data.Records[i].Data);
				partitionKey = data.Records[i].PartitionKey;

				let date = new Date(Number(partitionKey))
				if(records.indexOf(partitionKey) < 0) {
					if (i == 0) {
						records += date + "\n\n"
					} else {
						records += "\n\n" + date + "\n\n"
					}
				}
				records += decoded + "\n"
			}
		}
		mainWindow.webContents.send('recordsFetched', records)
	}
}

function bin2string(array){
	var result = "";
	for(var i = 0; i < array.length; ++i){
		result+= (String.fromCharCode(array[i]));
	}
	return result;
}

function showErrorMSG(msg){
	dialog.showMessageBox(mainWindow,{type:'error',buttons:[],title:'ERROR',message:msg})
}

const AWS = require('aws-sdk')
let kinesis

exports.configure = (params) => {
	kinesis = new AWS.Kinesis(params)
}

exports.getKinesisRecords = (clientParams, callback)=> {
	let params = {
		ShardId: clientParams.shardId,
		ShardIteratorType: 'AT_TIMESTAMP',
		StreamName: clientParams.streamName,
		Timestamp: clientParams.timestamp
	}
	kinesis.getShardIterator(params, callback)
}

exports.getRecordsFromShard = (shardIterator, callback) => {
	let params = {
		ShardIterator: shardIterator,
		Limit: 10000
	}
	kinesis.getRecords(params, callback)
}

exports.pushRecord = (clientParams, callback) => {
	let params = {
		Data: clientParams.recordToPush,
		PartitionKey: new Date().getTime().toString(),
		StreamName: clientParams.streamName
	};
	kinesis.putRecord(params, callback);
}
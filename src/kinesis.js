const AWS = require('aws-sdk')
let kinesis

exports.configure = (params) => {
	kinesis = new AWS.Kinesis(params)
}

exports.getKinesisRecords = (shardId, streamName, callback)=> {
	let params = {
		ShardId: shardId,
		ShardIteratorType: 'TRIM_HORIZON',
		StreamName: streamName,
		Timestamp: new Date
	}
	kinesis.getShardIterator(params, callback)
}

exports.getRecordsFromShard = (shardIterator, callback) => {
	let params = {
		ShardIterator: shardIterator,
		Limit: 20
	}
	kinesis.getRecords(params, callback)
}
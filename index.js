const fs = require('fs');
const path = require('path');

// third party dependencies
const mysql = require('mysql');
// end of third party dependencies

// intialize required command line arguments into process environment variables
initRequiredCommandLineArguments();

// intialize required parameters with default values
initDefaultValues();

// get database connection details 
const dbOptions = getDatabaseConnectionDetails();

// create myql pool
const pool = mysql.createPool(dbOptions);


(async () => {
	console.info('Fetching tables details ...');
	let results = await query('SHOW TABLES');
	const tableList = results.map( obj => obj[`Tables_in_${dbOptions.database}`]).sort(function (a, b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	}); 
	console.info(`total ${tableList.length} table found in ${dbOptions.database}`);
	//console.log('\n------------------------------Tables------------------------------------------------');
	//console.log(tableList.join(', '), '\n');
	results = await getTableComments(tableList);
	console.info('table comments fetched successfully');
	const tableObj = {};
	results.forEach( row => {
		tableObj[row[0].TABLE_NAME] = {
			comment: row[0].TABLE_COMMENT
		}
	});
	results = await getTableDescription(tableList);
	console.info('columns comments fetched successfully');
	results.forEach( tableRow => {
		tableObj[tableRow[0].TABLE_NAME]['columns'] = tableRow;
	});
	let contents = getContentsFormatter(tableList);
	contents += getTableFormatter(tableObj);
	const file = path.join(process.env['FILE_PATH'], process.env['FILE_NAME']);
	fs.writeFile(file, contents, (err) => console.log(err || `${file} created successfully.\n`)); 
	pool.end();
})();




function initRequiredCommandLineArguments() {
	process.argv.forEach((val, index) => {
		let possibleKey = val.toUpperCase();
		if(index>1 && (possibleKey.indexOf('DB') === 0 || possibleKey.indexOf('FILE') === 0)) {
			possibleKey = val.split(/=(.+)/);
			if(possibleKey.length>1) {
				process.env[possibleKey[0]] = possibleKey[1];
			}
		}
	});
}
function initDefaultValues() {
	if(process.env['DB_HOST'] === undefined) {
		process.env['DB_HOST'] = '127.0.0.1';
	}
	if(process.env['DB_PORT'] === undefined) {
		process.env['DB_PORT'] = 3306;
	}
	if(process.env['DB_DATABASE'] === undefined) {
		process.env['DB_DATABASE'] = 'test';
	}
	if(process.env['DB_USER'] === undefined) {
		process.env['DB_USER'] = 'root';
	}
	if(process.env['FILE_PATH'] === undefined) {
		process.env['FILE_PATH'] = './';
	}
	if(process.env['FILE_NAME'] === undefined) {
		process.env['FILE_NAME'] = `${process.env['DB_USER']}.md`;
	}
	console.log(process.env['DB_HOST'] + process.env['DB_PORT'] +process.env['DB_DATABASE'] + process.env['DB_USER'] + process.env['FILE_PATH'] + process.env['FILE_NAME']);
}

function getDatabaseConnectionDetails() {
	return {
		host: process.env['DB_HOST'],
		port: process.env['DB_PORT'],
		user: process.env['DB_USER'],
		password : process.env['DB_PASSWORD'],
		database : process.env['DB_DATABASE'],
		connectionLimit : 20
	}
}

function query(sql){
	return new Promise((resolve, reject) => {
		pool.getConnection(function(err, connection) {
			connection.query(sql, function (error, results) {
				connection.release();
				//if (error) return reject(error);
				if (error) {
					console.error('An error occurred while executing the query')
					throw error
				}
				return resolve(results);
			});
		});
	});
}
function getTableComments(tableList) {
	const sql = `SELECT TABLE_NAME, TABLE_COMMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='${dbOptions.database}' AND TABLE_NAME=?`;
	const tableListCommentPromise = tableList.map( tableName => query({sql, values:[tableName]}))
	return Promise.all(tableListCommentPromise);
}
function getTableDescription(tableList) {
	const sql = `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${dbOptions.database}' AND TABLE_NAME=? ORDER BY COLUMN_NAME`;
	const tableColumnListCommentPromise = tableList.map( tableName => query({sql, values:[tableName]}))
	return Promise.all(tableColumnListCommentPromise);
}

function getContentsFormatter(tableList) {
	let contents = '# Contents:\n';
	tableList.forEach( tableName => {
		contents += `- [${tableName}](#${tableName.toLowerCase()})\n`
	})
	contents += '\n# Tables:\n\n';
	return contents;
}
function getTableFormatter(tableObj) {
	let tableContents = ''
	for (let tableName in tableObj) {
		tableContents += `## ${tableName}\n${tableObj[tableName].comment}\n\n

| column_name | column_type | column_default | column_comment|
|:------------|:------------|:---------------|:--------------|\n`;
		tableObj[tableName].columns.forEach( columnObj => {
			tableContents += `| ${columnObj.COLUMN_NAME} | ${columnObj.COLUMN_TYPE} | ${columnObj.COLUMN_DEFAULT} | ${columnObj.COLUMN_COMMENT} |\n`
		} )
		tableContents += '\n[^Back to top^](#contents)'
		tableContents += '\n\n\n';
	}
	return tableContents;
}

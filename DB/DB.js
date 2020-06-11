const mysql = require("mysql")

let config={
    database: {
        DATABASE: 'freeswitch',
        USERNAME: 'root',
        PASSWORD: 'root',
        PORT: '3307',
        HOST: '192.168.101.174'
    },
}


var pool = mysql.createPool({
    host        : config.database.HOST,
    port        : config.database.PORT,
    user        : config.database.USERNAME,
    password    : config.database.PASSWORD,
    database    : config.database.DATABASE
});

let query = function( sql, values ) {
    return new Promise(( resolve, reject ) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                resolve( err )
            } else {
                connection.query(sql, values, ( err, rows) => {

                    if ( err ) {
                        reject( err )
                    } else {
                        resolve( rows )
                    }
                    connection.release()
                })
            }
        })
    })
}

let createTable = function( sql ) {
    return query( sql, [] )
}


let findDataById = function( table,  id ) {
    let _sql =  "SELECT * FROM ?? WHERE id = ? "

    return query( _sql, [ table, id, start, end ] )
}


/**
 *
 * @param table 表
 * @param keys 字段
 * @param phoneName 手机号
 * @param start 起始
 * @param end
 */
let findDataByPage_IVR = function( table, keys,phoneName,startTime_epoch,endTime_epoch,start, end ) {

    let _sql =  "SELECT ?? FROM ?? where caller_id_number=? and last_arg ='welcome.lua' and start_epoch between ? and ?  LIMIT ? , ?"
    if (phoneName == undefined ){

        _sql = _sql.replace("caller_id_number=?","1=1");
        return query( _sql, [keys,  table,startTime_epoch,endTime_epoch ,start, end ] )
    }else {

        return query( _sql, [keys,  table,phoneName,startTime_epoch,endTime_epoch,start, end ] )
    }



}

let findDataByPage = function( table, keys, start, end ) {


    let _sql =  "SELECT ?? FROM ??  LIMIT ? , ?"

    return query( _sql, [keys,  table, phoneName,start, end ] )

}


let insertData = function( table, values ) {
    let _sql = "INSERT INTO ?? SET ?"
    return query( _sql, [ table, values ] )
}


let updateData = function( table, values, id ) {
    let _sql = "UPDATE ?? SET ? WHERE id = ?"
    return query( _sql, [ table, values, id ] )
}


let deleteDataById = function( table, id ) {
    let _sql = "DELETE FROM ?? WHERE id = ?"
    return query( _sql, [ table, id ] )
}


let select = function( table, keys ) {
    let  _sql =  "SELECT ?? FROM ?? "
    return query( _sql, [ keys, table ] )
}

let count = function( table ) {
    let  _sql =  "SELECT COUNT(*) AS total_count FROM ?? "
    return query( _sql, [ table ] )
}

module.exports = {
    findDataByPage_IVR,
    query,
    createTable,
    findDataById,
    findDataByPage,
    deleteDataById,
    insertData,
    updateData,
    select,
    count,
}
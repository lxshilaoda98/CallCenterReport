const mysql = require("mysql")

let config={
    database: {
        DATABASE: 'freeswitch',
        USERNAME: 'root',
        PASSWORD: 'root',
        PORT: '3307',
        HOST: '127.0.0.1'
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


//ivr未接= IVR放弃明细
let findDataByPage_IVR = function(table, keys,phoneName,startTime_epoch,endTime_epoch,start, end ) {

    let _sql =  "SELECT ?? FROM ?? where caller_id_number=? and last_arg ='welcome.lua' and start_epoch between ? and ?  LIMIT ? , ?"
    if (phoneName == undefined ){
        _sql = _sql.replace("caller_id_number=?","1=1");
        return query( _sql, [keys,  table,startTime_epoch,endTime_epoch ,start, end ] )
    }else {

        return query( _sql, [keys,  table,phoneName,startTime_epoch,endTime_epoch,start, end ] )
    }

}

let AgentLoginDetailed = function(startTime_epoch,endTime_epoch,start, end ) {

   let _sql = "select tt.uuid ,tt.agentid as 话机,tt.登录时间,ttt.登出时间,TIMESTAMPDIFF(second,tt.登录时间,ttt.登出时间)as 签入时长 from " +
        "(select t1.uuid,t1.agentid,t1.createDataTime as 登录时间 from agent_statechange t1 where t1.LastStateName ='未登录状态' and t1.ChangeName not in ('未登录状态','异常签出') " +
        "and t1.CreateDataTime BETWEEN ? and ?) tt " +
        "LEFT JOIN( " +
        "select t2.uuid,t2.agentid,t2.createDataTime as 登出时间 from agent_statechange t2 where t2.LastStateName !='未登录状态' and t2.ChangeName in('未登录状态','异常签出')) ttt " +
        "ON tt.uuid = ttt.uuid  LIMIT ?,?"

        return query( _sql, [startTime_epoch,endTime_epoch,start, end ] )
}


let InboundDetailed= function(startTime_epoch,endTime_epoch,start, end ) {

    let _sql = "SELECT t1.accountcode as 账号,t1.start_stamp as 呼叫开始时间, t1.answer_stamp AS IVR应答时间,t1.caller_id_number AS 来电号码,t1.destination_number as 被叫号码,t1.duration as IVR持续时间," +
        "t1.progress_mediasec as 早起媒体时间,t2.start_stamp as 服务时间,t2.Billsec as 通话时间,t2.end_stamp as 通话结束时间,t1.sip_hangup_disposition as 挂机方 " +
        "from cdr_table_a_leg t1 " +
        "LEFT JOIN cdr_table_b_leg  t2 on t1.bleg_uuid = t2.uuid " +
        "where t1.last_app ='callcenter' AND t1.start_stamp BETWEEN ? and ? LIMIT ?,?"

    return query( _sql, [startTime_epoch,endTime_epoch,start, end ] )
}

let OutCallDetailed= function(startTime_epoch,endTime_epoch,start, end ) {

    let _sql = "SELECT t1.accountcode as 账号,t1.start_stamp as 呼叫开始时间, t1.answer_stamp AS 话机应答时间,t1.caller_id_number AS 主叫号码,t1.destination_number as 被叫号码," +
        "t2.answer_stamp AS 服务时间,t2.Billsec as 通话时间,t2.end_stamp as 通话结束时间,t1.sip_hangup_disposition as 挂机方,t1.duration as 总持续时间 " +
        "from cdr_table_a_leg t1 " +
        "LEFT JOIN cdr_table_b_leg  t2 on t1.bleg_uuid = t2.uuid " +
        "where t1.last_app ='bridge' and t1.bleg_uuid is not null  " +
        "AND t1.start_stamp BETWEEN ? and ? LIMIT ?,?"

    return query( _sql, [startTime_epoch,endTime_epoch,start, end ] )
}

let AutomaticOutCallStatis = function(startTime_epoch,endTime_epoch,start, end ) {

    let _sql = "select t1.name as 任务批次,t1.CallStopNumber AS 总录入的次数,count(t2.CallNumber) as 已经呼叫的次数," +
        "SUM(CASE WHEN t3.AutoHangu ='MANAGER_REQUEST'  THEN 1 else 0 END) as 主动挂断," +
        "SUM(CASE WHEN t3.AutoHangu in('NO_USER_RESPONSE','NORMAL_UNSPECIFIED')  THEN 1 else 0 END) as 未接通挂断," +
        "SUM(CASE WHEN t3.AutoHangu ='SUCCESS'  THEN 1 else 0 END) as 接通挂断," +
        "SUM(CASE WHEN t3.AutoHangu ='NO_ANSWER'  THEN 1 else 0 END) as 未应答 " +
        "from auto_task as t2 " +
        "LEFT JOIN auto_importaction as t1 ON t1.Oid = t2.Importaction " +
        "left JOIN auto_calllog as t3 on t3.Task = t2.Oid " +
        "where t1.name is not NULL and t1.CreateTime BETWEEN ? and ? group BY t1.Name LIMIT ?,?"

    return query( _sql, [startTime_epoch,endTime_epoch,start, end ] )
}

let GatewayUse = function(start, end ) {


    let _sql = "select *  from (select t1.`memo` as 名称,t1.`concurrent` as 总共数量," +
        "t1.`concurrent`- case when tt.`运行中的数量` is null then 0 else tt.`运行中的数量` end AS 剩余数量," +
        "case when tt.`运行中的数量` is null then 0 else tt.`运行中的数量` end as 运行中的数量 from gateway t1 " +
        "LEFT JOIN (select gateWay as wayID,count(*) 运行中的数量 from auto_importaction t1 where `Status` = '进行中' " +
        "GROUP BY GateWay) tt  on t1.oid = tt.wayID  ) ttt  LIMIT ?,?";

    return query( _sql, [start, end] )
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
    GatewayUse,
    AutomaticOutCallStatis,
    OutCallDetailed,
    InboundDetailed,
    findDataByPage_IVR,
    AgentLoginDetailed,
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
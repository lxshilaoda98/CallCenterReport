const mysql = require("mysql")
var moment = require('moment');

const config = require('../config/config.js').getConfig('database');


var pool = mysql.createPool({
    host: config.HOST,
    port: config.PORT,
    user: config.USERNAME,
    password: config.PASSWORD,
    database: config.DATABASE
});

let query = function (sql, values) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                resolve(err)
            } else {
                connection.query(sql, values, (err, rows) => {

                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    connection.release()
                })
            }
        })
    })
}

let createTable = function (sql) {
    return query(sql, [])
}


let findDataById = function (table, id) {
    let _sql = "SELECT * FROM ?? WHERE id = ? "

    return query(_sql, [table, id, start, end])
}


//ivr未接= IVR放弃明细
let findDataByPage_IVR = function (table, keys, phoneName, startTime_epoch, endTime_epoch, start, end) {

    let _sql = "SELECT ?? FROM ?? where caller_id_number=? and last_arg ='welcome.lua' and start_epoch between ? and ?  LIMIT ? , ?"
    if (phoneName == undefined) {
        _sql = _sql.replace("caller_id_number=?", "1=1");
        return query(_sql, [keys, table, startTime_epoch, endTime_epoch, start, end])
    } else {

        return query(_sql, [keys, table, phoneName, startTime_epoch, endTime_epoch, start, end])
    }

}

let AgentLoginDetailed = function (startTime_epoch, endTime_epoch, start, end) {

    let _sql = "select tt.uuid ,tt.agentid as 话机,tt.登录时间,ttt.登出时间,TIMESTAMPDIFF(second,tt.登录时间,ttt.登出时间)as 签入时长 from " +
        "(select t1.uuid,t1.agentid,t1.createDataTime as 登录时间 from agent_statechange t1 where t1.LastStateName ='未登录状态' and t1.ChangeName not in ('未登录状态','异常签出') " +
        "and t1.CreateDataTime BETWEEN ? and ?) tt " +
        "LEFT JOIN( " +
        "select t2.uuid,t2.agentid,t2.createDataTime as 登出时间 from agent_statechange t2 where t2.LastStateName !='未登录状态' and t2.ChangeName in('未登录状态','异常签出')) ttt " +
        "ON tt.uuid = ttt.uuid  LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}


let InboundDetailed = function (startTime_epoch, endTime_epoch, start, end) {

    let _sql = "SELECT t1.accountcode as 账号,t1.start_stamp as 呼叫开始时间, t1.answer_stamp AS IVR应答时间,t1.caller_id_number AS 来电号码,t1.destination_number as 被叫号码,t1.duration as IVR持续时间," +
        "t1.progress_mediasec as 早起媒体时间,t2.start_stamp as 服务时间,t2.Billsec as 通话时间,t2.end_stamp as 通话结束时间,t1.sip_hangup_disposition as 挂机方 " +
        "from cdr_table_a_leg t1 " +
        "LEFT JOIN cdr_table_b_leg  t2 on t1.bleg_uuid = t2.uuid " +
        "where t1.last_app ='callcenter' AND t1.start_stamp BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let OutCallDetailed = function (startTime_epoch, endTime_epoch, start, end) {

    let _sql = "SELECT t1.accountcode as 账号,t1.start_stamp as 呼叫开始时间, t1.answer_stamp AS 话机应答时间,t1.caller_id_number AS 主叫号码,t1.destination_number as 被叫号码," +
        "t2.answer_stamp AS 服务时间,t2.Billsec as 通话时间,t2.end_stamp as 通话结束时间,t1.sip_hangup_disposition as 挂机方,t1.duration as 总持续时间 " +
        "from cdr_table_a_leg t1 " +
        "LEFT JOIN cdr_table_b_leg  t2 on t1.bleg_uuid = t2.uuid " +
        "where t1.last_app ='bridge' and t1.bleg_uuid is not null  " +
        "AND t1.start_stamp BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let AutomaticOutCallStatis = function (startTime_epoch, endTime_epoch, start, end) {

    let _sql = "select t1.name as 任务批次,t1.CallStopNumber AS 总录入的次数,count(t2.CallNumber) as 已经呼叫的次数," +
        "SUM(CASE WHEN t3.AutoHangu ='MANAGER_REQUEST'  THEN 1 else 0 END) as 主动挂断," +
        "SUM(CASE WHEN t3.AutoHangu in('NO_USER_RESPONSE','NORMAL_UNSPECIFIED')  THEN 1 else 0 END) as 未接通挂断," +
        "SUM(CASE WHEN t3.AutoHangu ='SUCCESS'  THEN 1 else 0 END) as 接通挂断," +
        "SUM(CASE WHEN t3.AutoHangu ='NO_ANSWER'  THEN 1 else 0 END) as 未应答, " +
        "SUM(CASE WHEN t3.AutoHangu ='USER_BUSY' THEN 1 else 0 END) as 用户忙, " +
        "SUM(CASE WHEN t3.AutoHangu in('SUBSCRIBER_ABSENT','NORMAL_TEMPORARY_FAILURE','DESTINATION_OUT_OF_ORDER')  THEN 1 else 0 END) as 异常未知 " +
        "from auto_task as t2 " +
        "LEFT JOIN auto_importaction as t1 ON t1.Oid = t2.Importaction " +
        "left JOIN auto_calllog as t3 on t3.Task = t2.Oid " +
        "where t1.name is not NULL and t1.CreateTime BETWEEN ? and ? group BY t1.Name LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let GatewayUse = function (start, end) {
    let _sql = "select *  from (select t1.`memo` as 名称,t1.`concurrent` as 总共数量," +
        "t1.`concurrent`- case when tt.`运行中的数量` is null then 0 else tt.`运行中的数量` end AS 剩余数量," +
        "case when tt.`运行中的数量` is null then 0 else tt.`运行中的数量` end as 运行中的数量 from gateway t1 " +
        "LEFT JOIN (select gateWay as wayID,count(*) 运行中的数量 from auto_importaction t1 where `Status` = '进行中' " +
        "GROUP BY GateWay) tt  on t1.oid = tt.wayID  ) ttt  LIMIT ?,?";

    return query(_sql, [start, end])
}


let WaitingTask = function (start, end) {
    let _sql = "select t1.Oid as 批次ID,t2.Oid as 任务ID,t2.ExtraPhone1 as 号码,t3.memo as 网关名称,t1.CallStopNumber as 总呼叫次数," +
        "t2.CallNumber as 已经呼叫次数," +
        "case when t1.isAutoCall = true THEN '开启' else '未开启' END as 是否开启," +
        "t2.AutoHangu AS 挂机状态,t2.CusName as 部门 " +
        "from auto_importaction t1 " +
        "LEFT JOIN auto_task t2 on t1.Oid=t2.Importaction " +
        "left join gateway t3 on t1.GateWay = t3.Oid " +
        "where t1.`Status` ='进行中' and t2.`Status` ='正常' LIMIT ?,?";
    return query(_sql, [start, end])
}

let AcdQueueDetailed = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT org AS 技能组, CCAgent AS 坐席,CallerANI AS 主机号码,QueueStartTime AS 排队开始时间,QueueEndTime AS 排队结束时间," +
        "CCOfferingTime AS 转到坐席时间,CCAgentCalledTime AS 振铃开始时间,CCAgentAnsweredTime AS 通话开始时间," +
        "CCHangupCauseTime AS 放弃开始时间,CCBridgeTerminatedTime AS 挂机时间," +
        "CallerDestinationNumber AS 被叫号码,TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime) 振铃时长," +
        "(CASE WHEN CCAgentAnsweredTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) " +
        "WHEN CCOfferingTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,QueueStartTime,CCHangupCauseTime) " +
        "WHEN CCOfferingTime IS NULL THEN TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)ELSE 0 END) AS 等待时长," +
        "CCHangupCause AS 挂断原因,CCancelReasonName AS 挂断方 FROM callstart " +
        "WHERE QueueStartTime IS NOT NULL and QueueStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}


let CallHanguDetailed = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT org AS 技能组, CCAgent AS 坐席,CallerANI AS 主机号码,QueueStartTime AS 排队开始时间,QueueEndTime AS 排队结束时间," +
        "CCOfferingTime AS 转到坐席时间,CCAgentCalledTime AS 振铃开始时间,CCAgentAnsweredTime AS 通话开始时间," +
        "CCHangupCauseTime AS 放弃开始时间,CCBridgeTerminatedTime AS 挂机时间," +
        "CallerDestinationNumber AS 被叫号码,TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime) 振铃时长," +
        "(CASE WHEN CCAgentAnsweredTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) " +
        "WHEN CCOfferingTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,QueueStartTime,CCHangupCauseTime) " +
        "WHEN CCOfferingTime IS NULL THEN TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)ELSE 0 END) AS 等待时长," +
        "CCHangupCause AS 挂断原因,CCancelReasonName AS 挂断方 FROM callstart " +
        "WHERE CCBridgeTerminatedTime IS NULL and QueueStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_login = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_login where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_acw = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_acw where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_aux = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_aux where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_hold = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,inAni as 来电号码,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_hold where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let findDataByPage = function (table, keys, start, end) {


    let _sql = "SELECT ?? FROM ??  LIMIT ? , ?"

    return query(_sql, [keys, table, phoneName, start, end])

}


let insertData = function (table, values) {
    let _sql = "INSERT INTO ?? SET ?"
    return query(_sql, [table, values])
}


let updateData = function (table, values, id) {
    let _sql = "UPDATE ?? SET ? WHERE id = ?"
    return query(_sql, [table, values, id])
}


let deleteDataById = function (table, id) {
    let _sql = "DELETE FROM ?? WHERE id = ?"
    return query(_sql, [table, id])
}


let select = function (table, keys) {
    let _sql = "SELECT ?? FROM ?? "
    return query(_sql, [keys, table])
}

let count = function (table) {
    let _sql = "SELECT COUNT(*) AS total_count FROM ?? "
    return query(_sql, [table])
}


//统计报表

/**
 * IVR统计报表
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @constructor
 */
let Ivr_Statis = function (startTime_epoch, endTime_epoch, start, end, SelectType) {
    try {
        console.log('asdasdasd')
        let _sql = "select DATE_FORMAT(IvrStartTime, '%m/%d') as 日,count(*) as 个数,sum(TIMESTAMPDIFF(SECOND,IvrStartTime,CallEndTime)) as 总时长 " +
            " from callstart where IvrStartTime BETWEEN ? and ? " +
            "group by CONVERT(IvrStartTime, DATE) LIMIT ?,?"; //默认日
        switch (SelectType) {
            case '日':
                _sql = "select DATE_FORMAT(IvrStartTime, '%m/%d') as 日,count(*) as 个数,sum(TIMESTAMPDIFF(SECOND,IvrStartTime,CallEndTime)) as 总时长 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by CONVERT(IvrStartTime, DATE) LIMIT ?,?";
                break;
            case '月':
                _sql = "select DATE_FORMAT( IvrStartTime, '%m' ) as 月,count(*) as 个数,sum(TIMESTAMPDIFF(SECOND,IvrStartTime,CallEndTime)) as 总时长 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by DATE_FORMAT( IvrStartTime, '%m' ) LIMIT ?,?";
                break;
            case '年':
                _sql = "select DATE_FORMAT( IvrStartTime, '%Y' ) as 年,count(*) as 个数,sum(TIMESTAMPDIFF(SECOND,IvrStartTime,CallEndTime)) as 总时长 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by DATE_FORMAT( IvrStartTime, '%Y' ) LIMIT ?,?";
                break;
            case '时':
                _sql = "select DATE_FORMAT(IvrStartTime, '%H') as 小时,count(*) as 个数,sum(TIMESTAMPDIFF(SECOND,IvrStartTime,CallEndTime)) as 总时长 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by DATE_FORMAT(IvrStartTime, '%H') LIMIT ?,?";
                break;
        }
        return query(_sql, [startTime_epoch, endTime_epoch, start, end])
    } catch (e) {
        return e.message;
    }

}


/**
 * 坐席呼叫量统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let Agent_CallStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {
    try {
        let _sql = "select agents.name as 坐席名称," +
            "sum(org is not null) as 排队数," +
            "sum(CCAgentAnsweredTime is not null) as 应答数," +
            "sum(CCancelReason = 'BREAK_OUT') as 放弃数 " +
            "from agents left JOIN callstart on agents.name = callstart.CallerANI " +
            "where callstart.IvrStartTime BETWEEN ? and ? " +
            "group by agents.name LIMIT ?,?";
        console.log('startTime_epoch..>' + startTime_epoch + "..>endTime_epoch..>" + endTime_epoch);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            //通过坐席的名字再去查找关联数据..
            let _sql = "select case when (CASE WHEN callstart.CCAgent is not NULL then 1 else 0 end) !=0 THEN " +
                "concat(round(((CASE WHEN callstart.CCAgent is not NULL and callstart.CCAgentAnsweredTime is not null then 1 else 0 end) / (CASE WHEN callstart.CCAgent is not NULL then 1 else 0 end) ) * 100,2),'%') else concat(0,'%')  end " +
                "as 接通率,agents.`name` AS 坐席名称 from agents " +
                "LEFT JOIN callstart on callstart.CallerANI = agents.`name` " +
                `where callstart.IvrStartTime BETWEEN ? and ? AND CCAgent = '${arr[i]["坐席名称"]}' ` +
                "group BY callstart.ccagent";
            let newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].接通率 = newarr["0"]["接通率"];
            } else {
                arr[i].接通率 = '0.00%';
            }
            //通过坐席的名字再去查找关联的 <外呼数据>
            _sql = "select " +
                "sum(1) as 外呼总量," +
                "sum(case WHEN Billsec >0 THEN 1 else 0 end ) AS 外呼成功量," +
                "sum(case WHEN Billsec =0 THEN 1 else 0 end ) AS 外呼失败量," +
                "sum(case WHEN sip_hangup_disposition ='send_bye' THEN 1 else 0 end ) AS 客户挂机," +
                "sum(case WHEN sip_hangup_disposition ='recv_bye' THEN 1 else 0 end ) AS 坐席挂机 from cdr_table_a_leg " +
                `where last_app='bridge' and accountcode ='${arr[i]["坐席名称"]}'`;
            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].外呼总量 = newarr["0"]["外呼总量"];
                arr[i].外呼成功量 = newarr["0"]["外呼成功量"];
                arr[i].外呼失败量 = newarr["0"]["外呼失败量"];
                arr[i].客户挂机 = newarr["0"]["客户挂机"];
                arr[i].坐席挂机 = newarr["0"]["坐席挂机"];
            }

        }

        return arr;

    } catch (e) {
        return e.message;
    }

}


/**
 * 综合呼叫统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let CallCountStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {
    var groupByStr = await convertStr(SelectType, 'IvrStartTime');
    try {
        let _sql = "select :convert as 日期,count(*) as 呼入量," +
            "sum(QueueStartTime is not null) as 进入排队量," +
            "sum(QueueStartTime is null) as 未转坐席放弃量," +
            "sum(CCAgentAnsweredTime is not NULL) as 坐席应答量," +
            "sum(CCAgentAnsweredTime is NULL and CCAgent is not null) as 转坐席未答量," +
            "sum(CCancelReason ='BREAK_OUT' and TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)>3) AS 3秒放弃数," +
            "concat(round((sum(CCancelReason ='BREAK_OUT' and TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)>3) / sum(QueueStartTime is not null))*100,2),'%') AS 3秒放弃率," +
            "concat(round((sum(CCAgentAnsweredTime is not NULL) / sum(QueueStartTime is not null))*100,2),'%') AS 排队接通率," +
            "sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) as 通话时长（秒）," +
            "round(sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) / sum(CCAgentAnsweredTime is not NULL),0) as 平均通话时长（秒） " +
            "from callstart where IvrStartTime BETWEEN ? and ? " +
            "GROUP BY :convert LIMIT ?,?";

        _sql = _sql.replace(/:convert/g, groupByStr)


        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            let newarr;
            //通过日期找关联的 <外呼数据>
            _sql = "select " +
                "sum(1) as 外呼总量," +
                "sum(case WHEN Billsec >0 THEN 1 else 0 end ) AS 外呼成功量," +
                "sum(case WHEN Billsec =0 THEN 1 else 0 end ) AS 外呼失败量," +
                "sum(case WHEN sip_hangup_disposition ='send_bye' THEN 1 else 0 end ) AS 客户挂机," +
                "sum(case WHEN sip_hangup_disposition ='recv_bye' THEN 1 else 0 end ) AS 坐席挂机," +
                "sum(Billsec) AS 通话时长," +
                "round( (sum(Billsec) / sum(case WHEN Billsec >0 THEN 1 else 0 end) )) as 平均通话时长" +
                " from cdr_table_a_leg " +
                `where last_app='bridge' and start_stamp BETWEEN ? and ? AND CONVERT(start_stamp, DATE) ='${moment(arr[i]["日期"]).format('YYYY-MM-DD')}'`;
            var groupByStr = await convertStr(SelectType, 'start_stamp');
            _sql = _sql.replace(/:convert/g, groupByStr);
            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].外呼总量 = newarr["0"]["外呼总量"] == null ? 0 : newarr["0"]["外呼总量"];
                arr[i].外呼成功量 = newarr["0"]["外呼成功量"] == null ? 0 : newarr["0"]["外呼成功量"];
                arr[i].外呼失败量 = newarr["0"]["外呼失败量"] == null ? 0 : newarr["0"]["外呼失败量"];
                arr[i].客户挂机 = newarr["0"]["客户挂机"] == null ? 0 : newarr["0"]["客户挂机"];
                arr[i].坐席挂机 = newarr["0"]["坐席挂机"] == null ? 0 : newarr["0"]["坐席挂机"];
                arr[i].通话时长 = newarr["0"]["通话时长"] == null ? 0 : newarr["0"]["通话时长"];
                arr[i].平均通话时长 = newarr["0"]["平均通话时长"] == null ? 0 : newarr["0"]["平均通话时长"];

            }

        }

        return arr;

    } catch (e) {
        return e.message;
    }

}

/**
 * 针对查询类型 分组
 * @param SelectType
 * @returns {string}
 */
function convertStr(SelectType, name) {
    var str = `CONVERT(${name}, DATE)`;

    switch (SelectType) {
        case '日':
            str = `DATE_FORMAT(${name}, '%m/%d')`;
            break;
        case '月':
            str = `DATE_FORMAT( ${name}, '%m' )`;
            break;
        case '年':
            str = `DATE_FORMAT( ${name}, '%Y' )`;
            break;
        case '时':
            str = `DATE_FORMAT(${name}, '%H')`;
            break;
    }
    return str;
}


module.exports = {
    Ivr_Statis, Agent_CallStatis, CallCountStatis,


    agent_login, agent_aux, agent_acw, agent_hold,
    CallHanguDetailed,
    AcdQueueDetailed,
    WaitingTask,
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
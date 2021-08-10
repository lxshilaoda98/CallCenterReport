const mysql = require("mysql")
let moment = require('moment');
let log = require("../controller/log4j/logger_Api");
const config = require('../config/config.js').getConfig('database');
let Helper = require("../controller/CCHelper");

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

let CallInfo =async function (keys){
    let _sql = `select t1.application,t1.uuid,t1.cid_num,t1.dest,t1.created,t1.created_epoch,t1.callstate,t3.agentname,t4.svcname
                 from channels t1
                LEFT JOIN members t2 ON t1.uuid=t2.session_uuid
                left join call_agent t3 ON t2.serving_agent=t3.AgentId
                LEFT JOIN call_ivrsvc t4 ON t2.queue = t4.SvcCode
                where t1.uuid=?`
    let table = await query(_sql, [keys])
    if (table.length > 0) {
        let dest = table[0]["dest"];
        if (table[0]["application"] == "callcenter") {
            dest = table[0]["cid_num"];
            if (dest != "") {
                let AttriName = await Helper.GetAttribution(dest);
                table[0].province = AttriName[0]["province"];
                table[0].city = AttriName[0]["city"];
            }
        }
    }
    return table
}

//ivr未接= IVR放弃明细
let findDataByPage_IVR = function (table, keys, phoneName, startTime_epoch, endTime_epoch, start, end) {

    let _sql = "SELECT * FROM ?? where caller_id_number=? and last_arg ='GOWelcome.lua' and start_epoch between ? and ?  LIMIT ? , ?"
    console.log("sql==>" + _sql)
    console.log([keys, table, startTime_epoch, endTime_epoch, start, end])
    if (phoneName == undefined) {
        _sql = _sql.replace("caller_id_number=?", "1=1");
        return query(_sql, [table, startTime_epoch, endTime_epoch, start, end])
    } else {
        return query(_sql, [table, phoneName, startTime_epoch, endTime_epoch, start, end])
    }

}
let findDataByPage_IVRCount = function (table, keys, phoneName, startTime_epoch, endTime_epoch, start, end) {

    let _sql = "SELECT count(*) as count FROM ?? where caller_id_number=? and last_arg ='GOWelcome.lua' and start_epoch between ? and ? "
    if (phoneName == undefined) {
        console.log("运行语句1")
        _sql = _sql.replace("caller_id_number=?", "1=1");
        return query(_sql, ["cdr_table_a_leg", startTime_epoch, endTime_epoch, start, end])
    } else {
        console.log("运行语句2")
        return query(_sql, ["cdr_table_a_leg", phoneName, startTime_epoch, endTime_epoch])
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
let AgentLoginDetailedCount = function (startTime_epoch, endTime_epoch, start, end) {

    let _sql = "select count(*) as count from " +
        "(select t1.uuid,t1.agentid,t1.createDataTime as 登录时间 from agent_statechange t1 where t1.LastStateName ='未登录状态' and t1.ChangeName not in ('未登录状态','异常签出') " +
        "and t1.CreateDataTime BETWEEN ? and ?) tt " +
        "LEFT JOIN( " +
        "select t2.uuid,t2.agentid,t2.createDataTime as 登出时间 from agent_statechange t2 where t2.LastStateName !='未登录状态' and t2.ChangeName in('未登录状态','异常签出')) ttt " +
        "ON tt.uuid = ttt.uuid "

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}


let InboundDetailed = async function (startTime_epoch, endTime_epoch, start, end,keys) {

    let params=[startTime_epoch, endTime_epoch, start, end];
    let _sql = `SELECT t1.uuid,t6.AgentName as agentname,t7.SvcName as svcname,t1.caller_id_number,t1.destination_number,t1.start_stamp,t1.answer_stamp,t1.end_stamp,
                t1.billsec,t3.answer_stamp as calleering_stamp,
                case t1.last_app when 'bridge' THEN '呼出' WHEN 'callcenter' THEN '呼入' ELSE t1.last_app END as call_type,
                case when t1.answer_epoch =0 THEN '未接听' else '接听' END as answer_status,
                case  t1.sip_hangup_disposition WHEN 'send_bye' THEN '被叫挂机'  
                WHEN 'recv_cancel' then '接受取消' 
                WHEN 'send_refuse' then '呼叫拒绝'
                when 'recv_bye' THEN '主叫挂机'
                when 'send_cancel' THEN '呼叫取消'
                else t1.sip_hangup_disposition END as hangup_case,
                t5.CCAgent as ccagent,t5.IvrStartTime as ivrstarttime,t5.QueueStartTime as queuestarttime, t5.QueueEndTime as queueendtime,t5.CCOfferingTime as ccofferringtime,
                t5.CCAgentCalledTime as ccagentcalledtime,t5.CCAgentAnsweredTime as ccagentansweredtime,t5.CCHangupCauseTime as cchangupcausetime,t5.CCBridgeTerminatedTime as ccbridgeterminatedtime,
                TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.QueueEndTime) queue_times,
                TIMESTAMPDIFF(SECOND,t5.CCAgentCalledTime,t5.CCAgentAnsweredTime) ring_times,
                (CASE WHEN t5.CCAgentAnsweredTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.CCAgentAnsweredTime)
                WHEN t5.CCOfferingTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.CCHangupCauseTime)
                WHEN t5.CCOfferingTime IS NULL THEN TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.QueueEndTime)ELSE 0 END) AS wait_times, 
                case t2.nLevel WHEN t2.nLevel is not NULL THEN t2.nLevelName else '未评价' END as nlevelname,t4.ringnum,t4.file
                FROM cdr_table_a_leg as t1 
                LEFT JOIN agentservicelevel as t2 ON t1.uuid=t2.uuid
                left join cdr_table_b_leg t3 on t1.bleg_uuid=t3.uuid
                left JOIN recordlog t4 on t1.uuid =t4.uuid
                left JOIN callstart t5 on t5.ChannelCallUUID = t1.uuid
                left JOIN call_agent t6 on t5.CCAgent=t6.AgentId
                left JOIN call_ivrsvc t7 on t5.Org =t7.SvcCode
                where t1.bleg_uuid is not null #jdAgent #OrgId #callerNumber #calleeNumber #answerStatus #callType 
                 AND t1.start_stamp BETWEEN ? and ? order by t1.answer_stamp desc LIMIT ?,?`
    if (keys["jdAgent"]!="" && keys["jdAgent"]!=undefined){
        params=[keys["jdAgent"],startTime_epoch, endTime_epoch, start, end]
        _sql=_sql.replace("#jdAgent",'and t5.CCAgent in (?)');
    }else{
        _sql=_sql.replace("#jdAgent","");
    }
    if (keys["OrgId"] != "" && keys["OrgId"] != undefined) {
        params=[keys["OrgId"],startTime_epoch, endTime_epoch, start, end]
        _sql = _sql.replace("#OrgId", 'and t5.Org in (?)');
    } else {
        _sql = _sql.replace("#OrgId", "");
    }
    if ((keys["jdAgent"]!="" && keys["jdAgent"]!=undefined) && (keys["OrgId"]!="" && keys["OrgId"]!=undefined)){
        params=[keys["jdAgent"],keys["OrgId"],startTime_epoch, endTime_epoch, start, end]
    }

    if (keys["callerNumber"] != "" && keys["callerNumber"] != undefined) {
        _sql = _sql.replace("#callerNumber", `and  t1.caller_id_number = '${keys["callerNumber"]}'`);
    } else {
        _sql = _sql.replace("#callerNumber", "");
    }
    if (keys["calleeNumber"] != "" && keys["calleeNumber"] != undefined) {
        _sql = _sql.replace("#calleeNumber", `and  t1.destination_number = '${keys["calleeNumber"]}'`);
    } else {
        _sql = _sql.replace("#calleeNumber", "");
    }
    if (keys["answerStatus"] != "" && keys["answerStatus"] != undefined) {
        if (keys["answerStatus"] == "接听") {
            _sql = _sql.replace("#answerStatus", `and t1.answer_epoch !=0`);
        } else if (keys["answerStatus"] == "未接听") {
            _sql = _sql.replace("#answerStatus", `and t1.answer_epoch =0`);
        } else {
            _sql = _sql.replace("#answerStatus", "");
        }
    } else {
        _sql = _sql.replace("#answerStatus", "");
    }
    if (keys["callType"] != "" && keys["callType"] != undefined) {
        if (keys["callType"] == "呼入") {
            _sql = _sql.replace("#callType", `and t1.last_app = 'callcenter'`);
        } else if (keys["callType"] == "呼出") {
            _sql = _sql.replace("#callType", `and t1.last_app = 'bridge'`);
        } else {
            _sql = _sql.replace("#callType", "");
        }
    } else {
        _sql = _sql.replace("#callType", "");
    }
    let table = await query(_sql, params)

    //添加元素
    //如果是呼入电话的话，计算必要元素

    for (let i = 0; i < table.length; i++) {
        let uuid = table[i]["uuid"];
        if (uuid != "") {
            let hold = await query("select count(*) as count from agent_hold where uuid=?", [table[i]["uuid"]])
            table[i].holdNumber = hold[0]["count"];
        } else {
            table[i].holdNumber = 0;
        }
    }

    return table
}
let InboundDetailedCount = function (startTime_epoch, endTime_epoch, start, end,keys) {
    let params=[startTime_epoch, endTime_epoch]
    let _sql = "SELECT count(*) as count from cdr_table_a_leg t1 left JOIN callstart t5 on t5.ChannelCallUUID = t1.uuid " +
        "where bleg_uuid is not null #jdAgent #OrgId  #callerNumber #calleeNumber #answerStatus #callType and start_stamp BETWEEN ? and ? "

    if (keys["jdAgent"]!="" && keys["jdAgent"]!=undefined){
        params=[keys["jdAgent"],startTime_epoch, endTime_epoch]
        _sql=_sql.replace("#jdAgent",'and t5.CCAgent in (?)');
    }else{
        _sql=_sql.replace("#jdAgent","");
    }
    if (keys["OrgId"]!="" && keys["OrgId"]!=undefined){
        params=[keys["OrgId"],startTime_epoch, endTime_epoch]
        _sql=_sql.replace("#OrgId",'and t5.Org in (?)');
    }else {
        _sql=_sql.replace("#OrgId","");
    }
    if ((keys["jdAgent"]!="" && keys["jdAgent"]!=undefined) && (keys["OrgId"]!="" && keys["OrgId"]!=undefined)){
        params=[keys["jdAgent"],keys["OrgId"],startTime_epoch, endTime_epoch]
    }

    if (keys["callerNumber"] != "" && keys["callerNumber"] != undefined) {
        _sql = _sql.replace("#callerNumber", `and  t1.caller_id_number = '${keys["callerNumber"]}'`);
    } else {
        _sql = _sql.replace("#callerNumber", "");
    }
    if (keys["calleeNumber"] != "" && keys["calleeNumber"] != undefined) {
        _sql = _sql.replace("#calleeNumber", `and  t1.destination_number = '${keys["calleeNumber"]}'`);
    } else {
        _sql = _sql.replace("#calleeNumber", "");
    }
    if (keys["answerStatus"] != "" && keys["answerStatus"] != undefined) {
        if (keys["answerStatus"] == "接听") {
            _sql = _sql.replace("#answerStatus", `and t1.answer_epoch !=0`);
        } else if (keys["answerStatus"] == "未接听") {
            _sql = _sql.replace("#answerStatus", `and t1.answer_epoch =0`);
        } else {
            _sql = _sql.replace("#answerStatus", "");
        }
    } else {
        _sql = _sql.replace("#answerStatus", "");
    }
    if (keys["callType"] != "" && keys["callType"] != undefined) {
        if (keys["callType"] == "呼入") {
            _sql = _sql.replace("#callType", `and t1.last_app = 'callcenter'`);
        } else if (keys["callType"] == "呼出") {
            _sql = _sql.replace("#callType", `and t1.last_app = 'bridge'`);
        } else {
            _sql = _sql.replace("#callType", "");
        }
    } else {
        _sql = _sql.replace("#callType", "");
    }

    return query(_sql, params)
}


let InboundDetailedCountForUUid=function (keys){
    let _sql = "SELECT count(*) as count from cdr_table_a_leg t1 left JOIN callstart t5 on t5.ChannelCallUUID = t1.uuid " +
        "where bleg_uuid is not null #CallUid "

    if (keys["CallUid"]!=""&& keys["CallUid"]!=undefined){
        _sql=_sql.replace("#CallUid",`and  t1.uuid = '${keys["CallUid"]}'`);
    }else{
        _sql=_sql.replace("#CallUid","");
    }
    return query(_sql, [])
}
let InboundDetailedForUUid= async function (keys) {

    let _sql = `SELECT t1.uuid,t6.AgentName as agentname,t7.SvcName as svcname,t1.caller_id_number,t1.destination_number,t1.start_stamp,t1.answer_stamp,t1.end_stamp,
                t1.billsec,t3.answer_stamp as calleering_stamp,
                case t1.last_app when 'bridge' THEN '呼出' WHEN 'callcenter' THEN '呼入' ELSE t1.last_app END as call_type,
                case when t1.answer_epoch =0 THEN '未接听' else '接听' END as answer_status,
                case  t1.sip_hangup_disposition WHEN 'send_bye' THEN '被叫挂机'  
                WHEN 'recv_cancel' then '接受取消' 
                WHEN 'send_refuse' then '呼叫拒绝'
                when 'recv_bye' THEN '主叫挂机'
                when 'send_cancel' THEN '呼叫取消'
                else t1.sip_hangup_disposition END as hangup_case,
                t5.CCAgent as ccagent,t5.IvrStartTime as ivrstarttime,t5.QueueStartTime as queuestarttime, t5.QueueEndTime as queueendtime,t5.CCOfferingTime as ccofferringtime,
                t5.CCAgentCalledTime as ccagentcalledtime,t5.CCAgentAnsweredTime as ccagentansweredtime,t5.CCHangupCauseTime as cchangupcausetime,t5.CCBridgeTerminatedTime as ccbridgeterminatedtime,
                TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.QueueEndTime) queue_times,
                TIMESTAMPDIFF(SECOND,t5.CCAgentCalledTime,t5.CCAgentAnsweredTime) ring_times,
                (CASE WHEN t5.CCAgentAnsweredTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.CCAgentAnsweredTime)
                WHEN t5.CCOfferingTime IS NOT NULL THEN TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.CCHangupCauseTime)
                WHEN t5.CCOfferingTime IS NULL THEN TIMESTAMPDIFF(SECOND,t5.QueueStartTime,t5.QueueEndTime)ELSE 0 END) AS wait_times, 
                case t2.nLevel WHEN t2.nLevel is not NULL THEN t2.nLevelName else '未评价' END as nlevelname,t4.ringnum,t4.file
                FROM cdr_table_a_leg as t1 
                LEFT JOIN agentservicelevel as t2 ON t1.uuid=t2.uuid
                left join cdr_table_b_leg t3 on t1.bleg_uuid=t3.uuid
                left JOIN recordlog t4 on t1.uuid =t4.uuid
                left JOIN callstart t5 on t5.ChannelCallUUID = t1.uuid
                left JOIN call_agent t6 on t5.CCAgent=t6.AgentId
                left JOIN call_ivrsvc t7 on t5.Org =t7.SvcCode
                where t1.bleg_uuid is not null #CallUid `

    if (keys["CallUid"]!=""&& keys["CallUid"]!=undefined){
        _sql=_sql.replace("#CallUid",`and  t1.uuid = '${keys["CallUid"]}'`);
    }else{
        _sql=_sql.replace("#CallUid","");
    }
    let table = await query(_sql, [])

    //添加元素
    //如果是呼入电话的话，计算必要元素

    for (let i = 0; i < table.length; i++) {
        let uuid = table[i]["uuid"];
        if (uuid != "") {
            let hold = await query("select count(*) as count from agent_hold where uuid=?", [table[i]["uuid"]])
            table[i].holdNumber = hold[0]["count"];
        } else {
            table[i].holdNumber = 0;
        }
    }

    return table
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
let OutCallDetailedCount = function (startTime_epoch, endTime_epoch, start, end) {

    let _sql = "SELECT count(*) as count from cdr_table_a_leg t1 " +
        "where t1.last_app ='bridge' and t1.bleg_uuid is not null  " +
        "AND t1.start_stamp BETWEEN ? and ? "

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
let AutomaticOutCallStatisCount = function (startTime_epoch, endTime_epoch, start, end) {

    let _sql = "select count(*) as count " +
        " from auto_task as t2 " +
        "LEFT JOIN auto_importaction as t1 ON t1.Oid = t2.Importaction " +

        "where t1.name is not NULL and  t1.CreateTime BETWEEN ? and ? "

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
let GatewayUseCount = function (start, end) {
    let _sql = "select  count(*) as count from gateway";

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
let WaitingTaskCount = function (start, end) {
    let _sql = "select count(*) as count " +
        "from auto_importaction t1 " +
        "LEFT JOIN auto_task t2 on t1.Oid=t2.Importaction " +

        "where t1.`Status` ='进行中' and t2.`Status` ='正常' ";
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
let AcdQueueDetailedCount = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT count(*) as count FROM callstart " +
        "WHERE QueueStartTime IS NOT NULL and QueueStartTime BETWEEN ? and ? "

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
let CallHanguDetailedCount = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT count(*) as count FROM callstart " +
        "WHERE CCBridgeTerminatedTime IS NULL and QueueStartTime BETWEEN ? and ? "

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_login = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_login where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}
let agent_loginCount = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT count(*) as count " +
        "from agent_login where CreateStartTime BETWEEN ? and ? "

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_acw = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_acw where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}
let agent_acwCount = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT count(*) as count " +
        "from agent_acw where CreateStartTime BETWEEN ? and ? "

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_aux = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_aux where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}
let agent_auxCount = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT count(*) as count " +
        "from agent_aux where CreateStartTime BETWEEN ? and ? "

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}

let agent_hold = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT uuid,inAni as 来电号码,CreateStartTime as 开始时间,CreateEndTime as 结束时间,AgentId as 坐席工号,TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime) as 持续时间 " +
        "from agent_hold where CreateStartTime BETWEEN ? and ? LIMIT ?,?"

    return query(_sql, [startTime_epoch, endTime_epoch, start, end])
}
let agent_holdCount = function (startTime_epoch, endTime_epoch, start, end) {
    let _sql = "SELECT count(*) as count " +
        "from agent_hold where CreateStartTime BETWEEN ? and ? "

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
let Ivr_StatisCount = function (startTime_epoch, endTime_epoch, start, end, SelectType) {
    try {

        let _sql = "select count(*) as count from (select DATE_FORMAT(IvrStartTime, '%m/%d') as 日 " +
            " from callstart where IvrStartTime BETWEEN ? and ? " +
            "group by CONVERT(IvrStartTime, DATE)) as t1 "; //默认日
        switch (SelectType) {
            case '日':
                _sql = "select count(*) as count from (select DATE_FORMAT(IvrStartTime, '%m/%d') as 日 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by CONVERT(IvrStartTime, DATE)) as t1 ";
                break;
            case '月':
                _sql = "select count(*) as count from (select DATE_FORMAT( IvrStartTime, '%m' ) as 月 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by DATE_FORMAT( IvrStartTime, '%m' )) as t1 ";
                break;
            case '年':
                _sql = "select count(*) as count from (select DATE_FORMAT( IvrStartTime, '%Y' ) as 年 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by DATE_FORMAT( IvrStartTime, '%Y' )) as t1 ";
                break;
            case '时':
                _sql = "select count(*) as count from (select DATE_FORMAT(IvrStartTime, '%H') as 小时 " +
                    " from callstart where IvrStartTime BETWEEN ? and ? " +
                    "group by DATE_FORMAT(IvrStartTime, '%H')) as t1 ";
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
let Agent_CallStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType,keys) {
    try {
        let _sql = "select call_agent.AgentName as 坐席名称," +
            "sum(org is not null) as 排队数," +
            "sum(CCAgentAnsweredTime is not null) as 应答数," +
            "sum(CCancelReason = 'BREAK_OUT') as 放弃数 " +
            "from agents left JOIN callstart on agents.name = callstart.CallerANI " +
            "left join call_agent on agents.name = call_agent.AgentId where callstart.IvrStartTime BETWEEN ? and ? " +
            "group by agents.name LIMIT ?,?";
        if (keys!="" && keys!=undefined){
            _sql = "select call_agent.AgentName as 坐席名称," +
                "sum(org is not null) as 排队数," +
                "sum(CCAgentAnsweredTime is not null) as 应答数," +
                "sum(CCancelReason = 'BREAK_OUT') as 放弃数 " +
                "from agents left JOIN callstart on agents.name = callstart.CallerANI " +
                `left join call_agent on agents.name = call_agent.AgentId where agents.name = '${keys}' and callstart.IvrStartTime  BETWEEN ? and ? ` +
                "group by agents.name LIMIT ?,?";
        }

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
let Agent_CallStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType,keys) {

    try {
        let _sql = "select count(*) as count from(select agents.name as 坐席名称 " +
            "from agents left JOIN callstart on agents.name = callstart.CallerANI " +
            "where callstart.IvrStartTime BETWEEN ? and ? " +
            "group by agents.name ) t1";
        if (keys!="" && keys!=undefined){
            _sql = "select count(*) as count from(select agents.name as 坐席名称 " +
                "from agents left JOIN callstart on agents.name = callstart.CallerANI " +
                "where callstart.IvrStartTime BETWEEN ? and ? and agents.name = ? " +
                "group by agents.name ) t1";
        }
        let arr = await query(_sql, [startTime_epoch, endTime_epoch, keys]);

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
        let _sql = "select :convert as Time,count(*) as CallInNumber," +
            "sum(QueueStartTime is not null) as QueueNumber," +
            "sum(QueueStartTime is null) as NoTransferAgentNumber," +
            "sum(CCAgentAnsweredTime is not NULL) as AgentAnsweredNumber," +
            "sum(CCAgentAnsweredTime is NULL and CCAgent is not null) as TransferNoAnswer," +
            "sum(CCancelReason ='BREAK_OUT' and TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)>3) AS GiveUpIn3s," +
            "concat(round((sum(CCancelReason ='BREAK_OUT' and TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)>3) / sum(QueueStartTime is not null))*100,2),'%') AS GiveUpIn3p," +
            "concat(round((sum(CCAgentAnsweredTime is not NULL) / sum(QueueStartTime is not null))*100,2),'%') AS QueueAnswerP," +
            "sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) as TalkTime," +
            "round(sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) / sum(CCAgentAnsweredTime is not NULL),0) as AvgCallTime " +
            "from callstart where IvrStartTime BETWEEN ? and ? " +
            "GROUP BY :convert LIMIT ?,?";

        _sql = _sql.replace(/:convert/g, groupByStr)


        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        let forCount = arr.length;


        for (var i = 0; i < forCount; i++) {
            let newarr;
            //通过日期找关联的 <外呼数据>
            _sql = "select " +
                "sum(1) as MakeCallNumber," +
                "sum(case WHEN Billsec >0 THEN 1 else 0 end ) AS SuccessMakeCallNumber," +
                "sum(case WHEN Billsec =0 THEN 1 else 0 end ) AS ErrMakeCallNumber," +
                "sum(case WHEN sip_hangup_disposition ='send_bye' THEN 1 else 0 end ) AS CusHangUp," +
                "sum(case WHEN sip_hangup_disposition ='recv_bye' THEN 1 else 0 end ) AS AgentHangup," +
                "sum(Billsec) AS MakeCallBillsec," +
                "round( (sum(Billsec) / sum(case WHEN Billsec >0 THEN 1 else 0 end) )) as MakeAvgCallTime" +
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
let CallCountStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {
    var groupByStr = await convertStr(SelectType, 'IvrStartTime');
    try {
        let _sql = "select count(*) as count from(select :convert as 日期 " +
            "from callstart where IvrStartTime BETWEEN ? and ? " +
            "GROUP BY :convert) as t1 ";

        _sql = _sql.replace(/:convert/g, groupByStr)


        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        return arr;

    } catch (e) {
        return e.message;
    }

}
/**
 * 坐席综合统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let AgentCountStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType,keys) {

    try {
        let _sql = "SELECT t1.AgentId as 坐席工号,t2.AgentName,:convert as time,sum(TIMESTAMPDIFF(SECOND,t1.CreateStartTime,t1.CreateEndTime)) as 登录总时长 " +
            `from agent_login as t1 
             LEFT JOIN call_agent  as t2 ON t2.AgentId=t1.AgentId 
             where t1.CreateStartTime BETWEEN ? and ? #agentId group by t1.AgentId,:convert LIMIT ?,?`;

        let groupByStrOne = await convertStr(SelectType, 't1.CreateStartTime');
        _sql = _sql.replace(/:convert/g, groupByStrOne);
        let arr;
        if(keys["agentId"]!=""){
            _sql = _sql.replace('#agentId', 'and t1.AgentId = ?');
            arr= await query(_sql, [startTime_epoch, endTime_epoch,keys["agentId"], start, end]);
        }else{
            _sql = _sql.replace('#agentId', '');
            arr= await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        }
        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            arr[i].日期 = arr[i]["time"] == null ? 0 : moment(arr[i]["time"]).format('YYYY-MM-DD');
            let newarr;

            //通过坐席工号，来计算 空闲时长
            _sql = "SELECT AgentId as 坐席工号,:convert,sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) as 空闲时长 " +
                `from agent_ide where CreateStartTime BETWEEN ? and ?  
                and agentid = '${arr[i]["坐席工号"]}' and :convert = '${arr[i]["日期"]}'
                 group by AgentId,:convert `;
            var groupByStr = await convertStr(SelectType, 'CreateStartTime');

            _sql = _sql.replace(/:convert/g, groupByStr);


            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].空闲时长 = newarr["0"]["空闲时长"] == null ? 0 : newarr["0"]["空闲时长"];
            }

            //通过坐席工号，来计算 后处理时长
            _sql = "SELECT AgentId as 坐席工号,:convert,sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) as 后处理时长 " +
                `from agent_aux where CreateStartTime BETWEEN ? and ?  
                and agentid = '${arr[i]["坐席工号"]}' and :convert = '${arr[i]["日期"]}'
                 group by AgentId,:convert `;
            var groupByStr = await convertStr(SelectType, 'CreateStartTime');

            _sql = _sql.replace(/:convert/g, groupByStr);
            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].后处理时长 = newarr["0"]["后处理时长"] == null ? 0 : newarr["0"]["后处理时长"];

            }

            //通过坐席工号，来计算 小休时长
            _sql = "SELECT AgentId as 坐席工号,:convert,sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) as 小休时长 " +
                `from agent_acw where CreateStartTime BETWEEN ? and ? 
                 and agentid = '${arr[i]["坐席工号"]}' and :convert = '${arr[i]["日期"]}' 
                 group by AgentId,:convert `;
            var groupByStr = await convertStr(SelectType, 'CreateStartTime');

            _sql = _sql.replace(/:convert/g, groupByStr);
            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].小休时长 = newarr["0"]["小休时长"] == null ? 0 : newarr["0"]["小休时长"];
            }

            //通过坐席工号，来计算 保持相关数据
            _sql = "SELECT AgentId as 坐席工号,:convert,count(*) as 保持次数,sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) as 保持时长, " +
                "round(sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) / count(*) ,0) as 平均保持时长 " +
                "from agent_hold " +
                `where CreateStartTime BETWEEN ? and ? and agentid = '${arr[i]["坐席工号"]}' and :convert = '${arr[i]["日期"]}'` +
                " group by AgentId,:convert";
            var groupByStr = await convertStr(SelectType, 'CreateStartTime');

            _sql = _sql.replace(/:convert/g, groupByStr);
            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].保持次数 = newarr["0"]["保持次数"] == null ? 0 : newarr["0"]["保持次数"];
                arr[i].保持时长 = newarr["0"]["保持时长"] == null ? 0 : newarr["0"]["保持时长"];
                arr[i].平均保持时长 = newarr["0"]["平均保持时长"] == null ? 0 : newarr["0"]["平均保持时长"];
            }

            //通过坐席工号，来计算 呼入相关数据
            _sql = "select CCAgent 坐席工号,:convert,count(*) as 呼入量,sum(QueueStartTime is not null) as 进入排队量," +
                "sum(QueueStartTime is null) as 未转坐席放弃量,sum(CCAgentAnsweredTime is not NULL) as 坐席应答量," +
                "sum(CCAgentAnsweredTime is NULL and CCAgent is not null) as 转坐席未答量," +
                "sum(CCancelReason ='BREAK_OUT' and TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)>3) AS 3秒放弃数," +
                "concat(round((sum(CCancelReason ='BREAK_OUT' and TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)>3) / sum(QueueStartTime is not null))*100,2),'%') AS 3秒放弃率," +
                "concat(round((sum(CCAgentAnsweredTime is not NULL) / sum(QueueStartTime is not null))*100,2),'%') AS 排队接通率," +
                "sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) as 呼入通话时长," +
                "round(sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) / sum(CCAgentAnsweredTime is not NULL),0) as 平均呼入通话时长 " +
                "from callstart " +
                `where IvrStartTime BETWEEN ? and ? and CCAgent = '${arr[i]["坐席工号"]}' and :convert = '${arr[i]["日期"]}' ` +
                "GROUP BY CCAgent,:convert";

            var groupByStr = await convertStr(SelectType, 'IvrStartTime');

            _sql = _sql.replace(/:convert/g, groupByStr);

            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].呼入量 = newarr["0"]["呼入量"] == null ? 0 : newarr["0"]["呼入量"];
                arr[i].进入排队量 = newarr["0"]["进入排队量"] == null ? 0 : newarr["0"]["进入排队量"];
                arr[i].未转坐席放弃量 = newarr["0"]["未转坐席放弃量"] == null ? 0 : newarr["0"]["未转坐席放弃量"];
                arr[i].坐席应答量 = newarr["0"]["坐席应答量"] == null ? 0 : newarr["0"]["坐席应答量"];
                arr[i].转坐席未答量 = newarr["0"]["转坐席未答量"] == null ? 0 : newarr["0"]["转坐席未答量"];
                arr[i].三秒放弃数 = newarr["0"]["3秒放弃数"] == null ? 0 : newarr["0"]["3秒放弃数"];
                arr[i].三秒放弃率 = newarr["0"]["3秒放弃率"] == null ? 0 : newarr["0"]["3秒放弃率"];
                arr[i].排队接通率 = newarr["0"]["排队接通率"] == null ? 0 : newarr["0"]["排队接通率"];
                arr[i].呼入通话时长 = newarr["0"]["呼入通话时长"] == null ? 0 : newarr["0"]["呼入通话时长"];
                arr[i].平均呼入通话时长 = newarr["0"]["平均呼入通话时长"] == null ? 0 : newarr["0"]["平均呼入通话时长"];
            }

            //通过坐席工号，来计算 呼出相关数据
            _sql = "select accountcode AS 坐席工号,:convert, sum(1) as 外呼总量," +
                "sum(case WHEN Billsec >0  THEN 1 else 0 end ) AS 外呼成功量," +
                "sum(case WHEN Billsec =0 THEN 1 else 0 end ) AS 外呼失败量," +
                "sum(case WHEN sip_hangup_disposition ='send_bye' THEN 1 else 0 end ) AS 客户挂机," +
                "sum(case WHEN sip_hangup_disposition ='recv_bye' THEN 1 else 0 end ) AS 坐席挂机," +
                "sum(Billsec) AS 呼出通话时长,round( (sum(Billsec) / sum(case WHEN Billsec >0 THEN 1 else 0 end) )) as 平均呼出通话时长 " +
                "from cdr_table_a_leg " +
                `where start_stamp BETWEEN ? and ?  and accountcode = '${arr[i]["坐席工号"]}' and :convert = '${arr[i]["日期"]}'` +
                " and last_app='bridge' GROUP BY accountcode,:convert";

            var groupByStr = await convertStr(SelectType, 'start_stamp');

            _sql = _sql.replace(/:convert/g, groupByStr);

            newarr = await query(_sql, [startTime_epoch, endTime_epoch]);

            if (newarr.length > 0) {
                arr[i].外呼总量 = newarr["0"]["外呼总量"] == null ? 0 : newarr["0"]["外呼总量"];
                arr[i].外呼成功量 = newarr["0"]["外呼成功量"] == null ? 0 : newarr["0"]["外呼成功量"];
                arr[i].外呼失败量 = newarr["0"]["外呼失败量"] == null ? 0 : newarr["0"]["外呼失败量"];
                arr[i].呼出通话时长 = newarr["0"]["呼出通话时长"] == null ? 0 : newarr["0"]["呼出通话时长"];
                arr[i].平均呼出通话时长 = newarr["0"]["平均呼出通话时长"] == null ? 0 : newarr["0"]["平均呼出通话时长"];
            }

            let outNumber = arr[i]["外呼总量"] == undefined ? 0 : arr[i]["外呼总量"];
            let inNumber = arr[i]["呼入量"] == undefined ? 0 : arr[i]["呼入量"];
            let zPhone = (outNumber + inNumber);

            arr[i].平均后处理时长 = arr[i]["后处理时长"] == null ? 0 :
                Math.round(arr[i]["后处理时长"] / zPhone);

            arr[i].后处理率 = arr[i]["后处理时长"] == null ? 0 :
                Math.round((arr[i]["后处理时长"] / arr[i]["登录总时长"]) * 100) + '%';

            arr[i].呼出占比 = arr[i]["呼出通话时长"] == null ? 0 :
                Math.round((arr[i]["呼出通话时长"] / arr[i]["登录总时长"]) * 100) + '%';

            arr[i].呼入占比 = arr[i]["呼入通话时长"] == null ? 0 :
                Math.round((arr[i]["呼入通话时长"] / arr[i]["登录总时长"]) * 100) + '%';

            arr[i].空闲率 = arr[i]["空闲时长"] == null ? 0 :
                Math.round((arr[i]["空闲时长"] / arr[i]["登录总时长"]) * 100) + '%';

            arr[i].小休率 = arr[i]["小休时长"] == null ? 0 :
                Math.round((arr[i]["小休时长"] / arr[i]["登录总时长"]) * 100) + '%';

            arr[i].非工作率 = Math.round(((arr[i]["小休时长"] + arr[i]["后处理时长"]) / arr[i]["登录总时长"]) * 100) + '%';

            arr[i].工作率 = Math.round(((arr[i]["呼入通话时长"] + arr[i]["呼出通话时长"] + arr[i]["后处理时长"]) / arr[i]["登录总时长"]) * 100) + '%';
        }

        return arr;

    } catch (e) {
        return e.message;
    }
}
let AgentCountStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType,keys) {

    try {
        let _sql = "select count(*) as count from (SELECT AgentId as 坐席工号,:convert as time " +
            `from agent_login where CreateStartTime BETWEEN ? and ? #agentId group by AgentId,:convert) as t1`;

        let groupByStr = await convertStr(SelectType, 'CreateStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);
        let arr;
        if(keys["agentId"]!=""){
            _sql = _sql.replace('#agentId', 'and AgentId = ?');
            arr= await query(_sql, [startTime_epoch, endTime_epoch,keys["agentId"], start, end]);
        }else{
            _sql = _sql.replace('#agentId', '');
            arr= await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        }
        return arr;

    } catch (e) {
        return e.message;
    }
}

/**
 * 技能组综合统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let OrgCountStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType, keys) {

    try {
        let _sql = "select Org as 技能组Id,call_ivrsvc.SvcName as 技能组名称,:convert as time,count(*) as 呼入电话数," +
            "sum(TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)) as 等待时长, " +
            "round(sum(TIMESTAMPDIFF(SECOND,QueueStartTime,QueueEndTime)) / sum(QueueStartTime is not null),0) as 平均等待时长," +
            "sum(QueueStartTime is null) as 未转坐席放弃量,sum(CCAgentAnsweredTime is not NULL) as 通话数量," +
            "round(sum(TIMESTAMPDIFF(SECOND,CCAgentAnsweredTime,CallEndTime)) / sum(CCAgentAnsweredTime is not NULL),0) as 平均通话时长," +
            "round(sum(TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime)) / sum(CCAgentAnsweredTime is not NULL),0) as 平均应答速度," +
            "sum(CCAgentAnsweredTime is NULL and CCAgent is not null) as 放弃电话数量," +
            "CONcat(round(sum(CCAgentAnsweredTime is NULL and CCAgent is not null) /count(*) * 100 ,0),'%') as 放弃率," +
            "round(sum(TIMESTAMPDIFF(SECOND,ccagentcalledtime,CCAgentAnsweredTime)) / sum(CCAgentAnsweredTime is NULL and CCAgent is not null),0) as 平均放弃时长," +
            "sum(CASE when TIMESTAMPDIFF(SECOND,ccagentcalledtime,CCAgentAnsweredTime) < 20 then 1 else 0 END) as 等待小于20秒的个数," +
            "sum(CASE when TIMESTAMPDIFF(SECOND,ccagentcalledtime,CCAgentAnsweredTime) BETWEEN 20 and 40 then 1 else 0 END) as 等待20到40秒的个数, " +
            "sum(CASE when TIMESTAMPDIFF(SECOND,ccagentcalledtime,CCAgentAnsweredTime) BETWEEN 40 and 60 then 1 else 0 END) as 等待40到60秒的个数," +
            "sum(CASE when TIMESTAMPDIFF(SECOND,ccagentcalledtime,CCAgentAnsweredTime) > 60 then 1 else 0 END) as 等待大于60秒的个数 " +
            "from callstart LEFT JOIN call_ivrsvc ON callstart.Org=call_ivrsvc.SvcCode " +
            "where Org is not null and QueueStartTime is not null " +
            "and IvrStartTime BETWEEN ? and ? :orgOid " +
            "GROUP BY Org,:convert LIMIT ?,?";

        let arr;
        let groupByStr = await convertStr(SelectType, 'IvrStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);

        if (keys["org"] != "") {
            _sql = _sql.replace(/:orgOid/g, 'and Org in (?)');
            arr = await query(_sql, [startTime_epoch, endTime_epoch, keys["org"], start, end]);
        } else {
            _sql = _sql.replace(/:orgOid/g, '');
            arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        }


        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            //由于时间格式问题，所以新增一个字段
            arr[i].日期 = arr[i]["time"] == null ? 0 : moment(arr[i]["time"]).format('YYYY-MM-DD');
        }
        return arr;

    } catch (e) {
        return e.message;
    }
}
let OrgCountStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType, keys) {

    try {
        let _sql = "select count(*) as count from (select Org as 技能组,:convert as time " +
            "from callstart " +
            "where Org is not null and QueueStartTime is not null " +
            "and IvrStartTime BETWEEN ? and ? :orgOid" +
            "GROUP BY Org,:convert ) as t1";
        let groupByStr = await convertStr(SelectType, 'IvrStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);
        if (keys["org"] != "") {
            _sql = _sql.replace(/:orgOid/g, 'and Org in (?)');
        } else {
            _sql = _sql.replace(/:orgOid/g, '');
        }

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, keys["org"]]);


        return arr;

    } catch (e) {
        return e.message;
    }
}

/**
 * 呼出电话统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let OutCallStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select accountcode,sum(1) as 外呼总量, :convert as time," +
            "sum(case WHEN Billsec >0 THEN 1 else 0 end ) AS 外呼成功量," +
            "sum(case WHEN Billsec =0 THEN 1 else 0 end ) AS 外呼失败量," +
            "sum(Billsec) as 总通话时长," +
            "round(sum(Billsec) / sum(case WHEN Billsec >0 THEN 1 else 0 end ),0) as 平均通话时长," +
            "sum(TIMESTAMPDIFF(SECOND,start_stamp,answer_stamp)) as 总振铃时长," +
            "round(sum(TIMESTAMPDIFF(SECOND,start_stamp,answer_stamp)) / sum(case WHEN Billsec >0 THEN 1 else 0 end ),0) AS 平均振铃时长 " +
            "from cdr_table_a_leg  " +
            "where last_app='bridge' and start_stamp BETWEEN ? and ? " +
            "GROUP BY accountcode,:convert LIMIT ?,?";

        var groupByStr = await convertStr(SelectType, 'start_stamp');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            //由于时间格式问题，所以新增一个字段
            arr[i].日期 = arr[i]["time"] == null ? 0 : moment(arr[i]["time"]).format('YYYY-MM-DD');
        }

        return arr;

    } catch (e) {
        return e.message;
    }
}
let OutCallStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select count(*) as count from(select accountcode " +
            "from cdr_table_a_leg  " +
            "where last_app='bridge' and start_stamp BETWEEN ? and ? " +
            "GROUP BY accountcode,:convert ) as t1";

        var groupByStr = await convertStr(SelectType, 'start_stamp');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);


        return arr;

    } catch (e) {
        return e.message;
    }
}

/**
 * 坐席休息时间统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let AgentACWStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "SELECT AgentId as 坐席,:convert as time," +
            "sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) as 时长,count(1) as 次数," +
            "round(sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) / count(1),0) AS 平均时长 from agent_acw " +
            "where CreateStartTime BETWEEN ? and ? " +
            "GROUP BY AgentId ,:convert LIMIT ?,?";

        var groupByStr = await convertStr(SelectType, 'CreateStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            //由于时间格式问题，所以新增一个字段
            arr[i].日期 = arr[i]["time"] == null ? 0 : moment(arr[i]["time"]).format('YYYY-MM-DD');
        }

        return arr;

    } catch (e) {
        return e.message;
    }
}
let AgentACWStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select count(*) as count from(SELECT AgentId as 坐席,:convert as time from agent_acw " +
            "where CreateStartTime BETWEEN ? and ? " +
            "GROUP BY AgentId ,:convert ) as t1 ";

        var groupByStr = await convertStr(SelectType, 'CreateStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);


        return arr;

    } catch (e) {
        return e.message;
    }
}

/**
 * 坐席服务水平统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let AgentServiceStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select :convert as time,CCAgent," +
            "sum(QueueStartTime is not null) as 呼叫振铃数," +
            "sum(CCAgentAnsweredTime is not NULL) as 通话数," +
            "sum(case when TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) < 15 THEN 1 else 0 END ) as 15秒内摘机电话数," +
            "CONcat(round( sum(case when TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) < 15 THEN 1 else 0 END ) / sum(CCAgentAnsweredTime is not NULL) *100,0),'%') as 15秒服务水平," +
            "sum(case when TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) < 20 THEN 1 else 0 END ) as 20秒内摘机电话数," +
            "CONcat(round( sum(case when TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) < 20 THEN 1 else 0 END ) / sum(CCAgentAnsweredTime is not NULL) *100,0),'%') as 20秒服务水平," +
            "sum(case when TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) < 25 THEN 1 else 0 END ) as 25秒内摘机电话数," +
            "CONcat(round( sum(case when TIMESTAMPDIFF(SECOND,QueueStartTime,CCAgentAnsweredTime) < 25 THEN 1 else 0 END ) / sum(CCAgentAnsweredTime is not NULL) *100,0),'%') as 25秒服务水平," +
            "sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) as 通话时长," +
            "round(sum(TIMESTAMPDIFF(SECOND,CCAgentCalledTime,CCAgentAnsweredTime)) / sum(CCAgentAnsweredTime is not NULL),0) as 平均通话时长 " +
            "from callstart " +
            "where CCAgent is not null AND IvrStartTime BETWEEN ? and ? " +
            "GROUP BY :convert,CCAgent LIMIT ?,?";

        var groupByStr = await convertStr(SelectType, 'IvrStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            //由于时间格式问题，所以新增一个字段
            arr[i].日期 = arr[i]["time"] == null ? 0 : moment(arr[i]["time"]).format('YYYY-MM-DD');
        }

        return arr;

    } catch (e) {
        return e.message;
    }
}
let AgentServiceStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select count(*) as count from( select :convert as time,CCAgent from callstart " +
            "where CCAgent is not null AND IvrStartTime BETWEEN ? and ? " +
            "GROUP BY :convert,CCAgent ) as t1";

        var groupByStr = await convertStr(SelectType, 'IvrStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        return arr;

    } catch (e) {
        return e.message;
    }
}

/**
 * 坐席登录统计
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let AgentLoginStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "SELECT AgentId as 坐席,:convert as time," +
            "sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) as 时长,count(1) as 次数," +
            "round(sum(TIMESTAMPDIFF(SECOND,CreateStartTime,CreateEndTime)) / count(1),0) AS 登录时长 from agent_login " +
            "where CreateStartTime BETWEEN ? and ? " +
            "GROUP BY AgentId ,:convert LIMIT ?,?";

        var groupByStr = await convertStr(SelectType, 'CreateStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            //由于时间格式问题，所以新增一个字段
            arr[i].日期 = arr[i]["time"] == null ? 0 : moment(arr[i]["time"]).format('YYYY-MM-DD');
        }

        return arr;

    } catch (e) {
        return e.message;
    }
}
let AgentLoginStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select count(*) as count from (SELECT AgentId as 坐席,:convert as time from agent_login " +
            "where CreateStartTime BETWEEN ? and ? " +
            "GROUP BY AgentId ,:convert ) as t1";

        var groupByStr = await convertStr(SelectType, 'CreateStartTime');
        _sql = _sql.replace(/:convert/g, groupByStr);

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        return arr;

    } catch (e) {
        return e.message;
    }
}
/**
 * 坐席满意度评价
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let AgentlevelStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select AgentId as 坐席,ani as 电话号码,PjCreateTime as time,nLevelName as 评定等级,CallDirection as 呼叫方向 from agentservicelevel " +
            "where PjCreateTime BETWEEN ? and ? LIMIT ?,?";

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);
        let forCount = arr.length;

        for (var i = 0; i < forCount; i++) {
            //由于时间格式问题，所以新增一个字段
            arr[i].日期 = arr[i]["time"] == null ? 0 : moment(arr[i]["time"]).format('YYYY-MM-DD HH:mm:ss');
        }

        return arr;

    } catch (e) {
        return e.message;
    }
}
let AgentlevelStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select count(*) as count from agentservicelevel " +
            "where PjCreateTime BETWEEN ? and ? ";

        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        return arr;

    } catch (e) {
        return e.message;
    }
}

/**
 * 坐席满意度评价比例
 * @param startTime_epoch
 * @param endTime_epoch
 * @param start
 * @param end
 * @param SelectType
 * @returns {Promise.<*>}
 * @constructor
 */
let AgentlevelPropStatis = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select AgentId as 坐席," +
            "sum( CASE WHEN nLevel ='1' THEN 1 ELSE 0 END) AS 非常满意数," +
            "sum( CASE WHEN nLevel ='2' THEN 1 ELSE 0 END) AS 满意数," +
            "sum( CASE WHEN nLevel ='3' THEN 1 ELSE 0 END) AS 不满意数," +
            "sum( CASE WHEN nLevel !='' THEN 1 ELSE 0 END) AS 参评数," +
            "concat(ROUND(sum( CASE WHEN nLevel ='1' THEN 1 ELSE 0 END) /sum( CASE WHEN nLevel !='' THEN 1 ELSE 0 END) *100,0),'%') AS 非常满意度比例," +
            "concat(ROUND(sum( CASE WHEN nLevel ='2' THEN 1 ELSE 0 END) /sum( CASE WHEN nLevel !='' THEN 1 ELSE 0 END) *100,0),'%')AS 满意度比例," +
            "concat(ROUND(sum( CASE WHEN nLevel ='3' THEN 1 ELSE 0 END) /sum( CASE WHEN nLevel !='' THEN 1 ELSE 0 END) *100,0),'%')AS 不满意度比例," +
            "concat(ROUND(sum( CASE WHEN nLevel !='' THEN 1 ELSE 0 END) / count(*) * 100,0),'%') AS 参评比例, " +
            "concat(ROUND(sum( CASE WHEN CallDirection ='in' THEN 1 ELSE 0 END) / count(*) * 100,0),'%') AS 呼入占比, " +
            "concat(ROUND(sum( CASE WHEN CallDirection ='out' THEN 1 ELSE 0 END) / count(*) * 100,0),'%') AS 呼出占比 " +
            " from agentservicelevel  where PjCreateTime BETWEEN ? and ? group BY AgentId LIMIT ?,? ";


        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

        return arr;

    } catch (e) {
        return e.message;
    }
}
let AgentlevelPropStatisCount = async function (startTime_epoch, endTime_epoch, start, end, SelectType) {

    try {
        let _sql = "select count(*) as count from (select AgentId as 坐席 from agentservicelevel  where PjCreateTime BETWEEN ? and ? group BY AgentId) as t1";
        let arr = await query(_sql, [startTime_epoch, endTime_epoch, start, end]);

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
    Ivr_Statis,
    Agent_CallStatis,
    CallCountStatis,
    AgentCountStatis,
    OrgCountStatis,
    OutCallStatis,
    AgentACWStatis,
    AgentServiceStatis,
    AgentLoginStatis,
    AgentlevelStatis,
    AgentlevelPropStatis,

    GatewayUseCount,
    AutomaticOutCallStatisCount,
    findDataByPage_IVRCount,
    AgentLoginDetailedCount,
    InboundDetailedCount,
    OutCallDetailedCount,
    WaitingTaskCount,
    AcdQueueDetailedCount,
    CallHanguDetailedCount,
    agent_loginCount,
    agent_acwCount,
    agent_auxCount,
    agent_holdCount,

    Ivr_StatisCount,
    Agent_CallStatisCount,
    CallCountStatisCount,
    AgentCountStatisCount,
    OrgCountStatisCount,
    OutCallStatisCount,
    AgentACWStatisCount,
    AgentServiceStatisCount,
    AgentLoginStatisCount,
    AgentlevelStatisCount,
    AgentlevelPropStatisCount,


    agent_login,
    agent_aux,
    agent_acw,
    agent_hold,
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
    CallInfo,
    InboundDetailedCountForUUid,InboundDetailedForUUid
}

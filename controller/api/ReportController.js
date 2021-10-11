var db = require("../../DB/DB"); //引入数据库封装模块
var log = require("../log4j/logger_Api");
let moment = require('moment');
//时间戳转换成日期
function timestampToTime(timestamp) {
    let start = moment(parseInt(timestamp)).format('YYYY-MM-DD HH:mm:ss');
    console.log("==>",start)
    return start;

}

function CallInfo(table,keys){

}
/**
 *
 * @param table 表
 * @param keys 字段
 * @param start  0
 * @param end 1   《第一条数据》
 * @returns {Promise}
 */
function selectTable(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end) {

    return new Promise((resolve, reject) => {
        try {
            log.info("[CCReport].>调用了..>" + table + `..>参数.>keys=${keys}phoneName=${phoneName}
            startTime_epoch=${startTime_epoch}endTime_epoch=${endTime_epoch}start=${start}end=${end}`)
            console.log("[CCReport].>调用了..>" + table + `..>参数.>keys=${keys}phoneName=${phoneName}
            startTime_epoch=${startTime_epoch}endTime_epoch=${endTime_epoch}start=${start}end=${end}`)
            switch (table) {
                case 'CallInfo':
                    resolve(db.CallInfo(keys));
                    break;
                case 'cdr_table_a_leg' :
                    resolve(db.findDataByPage_IVR(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'AgentLoginDetailed' :
                    resolve(db.AgentLoginDetailed(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'InboundDetailed':
                    resolve(db.InboundDetailed(startTime_epoch, endTime_epoch, start, end,keys));
                    break;
                case 'InboundDetailedForUUid':
                    resolve(db.InboundDetailedForUUid(keys));
                    break;
                case 'OutCallDetailed':
                    resolve(db.OutCallDetailed(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'AutomaticOutCallStatis':
                    resolve(db.AutomaticOutCallStatis(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'GatewayUse':
                    resolve(db.GatewayUse(start, end));
                    break;
                case 'WaitingTask':
                    resolve(db.WaitingTask(start, end));
                    break;
                case 'AcdQueueDetailed':
                    resolve(db.AcdQueueDetailed(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'CallHanguDetailed':
                    resolve(db.CallHanguDetailed(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_login':
                    resolve(db.agent_login(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_acw':
                    resolve(db.agent_acw(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_aux':
                    resolve(db.agent_aux(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_hold':
                    resolve(db.agent_hold(startTime_epoch, endTime_epoch, start, end));
                    break;


                default :
                    resolve('未知参数');
            }

        } catch (e) {
            reject(e.message);
        }

    });
}

function selectTableCount(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end) {

    return new Promise((resolve, reject) => {
        try {
            log.info("[CCReportCount].>调用了..>" + table + `..>参数.>keys=${keys}phoneName=${phoneName}
            startTime_epoch=${startTime_epoch}endTime_epoch=${endTime_epoch}start=${start}end=${end}`)

            switch (table) {
                case 'cdr_table_a_legCount' :
                    resolve(db.findDataByPage_IVRCount(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'AgentLoginDetailedCount' :
                    resolve(db.AgentLoginDetailedCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'InboundDetailedCount':
                    resolve(db.InboundDetailedCount(startTime_epoch, endTime_epoch, start, end,keys));
                    break;
                case 'InboundDetailedCountForUUid':
                    resolve(db.InboundDetailedCountForUUid(keys));
                    break;
                case 'OutCallDetailedCount':
                    resolve(db.OutCallDetailedCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'AutomaticOutCallStatisCount':
                    resolve(db.AutomaticOutCallStatisCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'GatewayUseCount':
                    resolve(db.GatewayUseCount(start, end), 9);
                    break;
                case 'WaitingTaskCount':
                    resolve(db.WaitingTaskCount(start, end));
                    break;
                case 'AcdQueueDetailedCount':
                    resolve(db.AcdQueueDetailedCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'CallHanguDetailedCount':
                    resolve(db.CallHanguDetailedCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_loginCount':
                    resolve(db.agent_loginCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_acwCount':
                    resolve(db.agent_acwCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_auxCount':
                    resolve(db.agent_auxCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'agent_holdCount':
                    resolve(db.agent_holdCount(startTime_epoch, endTime_epoch, start, end));
                    break;
                default :
                    resolve('未知参数');
            }

        } catch (e) {
            reject(e.message);
        }

    });
}


class ReportController {


    /**
     * IVR呼叫明细
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async IVRDetailed(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let phoneName = ctx.request.query.phoneName;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let keys = '*';
            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示



            if (startTime_epoch == undefined || endTime_epoch == undefined || startTime_epoch == "" || endTime_epoch == "") {
                body = {
                    'code': 1,
                    'message': '必须传入时间',
                }
            } else {
                let count = await selectTableCount('cdr_table_a_legCount', '', phoneName, startTime_epoch, endTime_epoch, start, end);
                console.log(count);
                let cs = await selectTable('cdr_table_a_leg', keys, phoneName, startTime_epoch, endTime_epoch, start, end);

                body = {
                    'total': count["0"].count,
                    'code': 0,
                    'message': '成功',
                    'page': page,
                    'pagesize': pagesize,
                    'data': cs
                }
            }
        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 坐席登录明细
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AgentLoginDetailed(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch)
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AgentLoginDetailedCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('AgentLoginDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }


    /**
     * 全程通话明细
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async InboundDetailed(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;
            let jdAgent = ctx.request.query.agentId;
            let OrgId = ctx.request.query.orgId;
            let CallUid = ctx.request.query.callId;
            let gg1;
            if (jdAgent != "" && jdAgent != undefined) {
                gg1 = jdAgent.split(',');
            }
            let gg2;
            if (OrgId != "" && OrgId != undefined) {
                gg2 = OrgId.split(',');
            }
            let gg3;
            if (CallUid != "" && CallUid != undefined) {
                gg3 = CallUid.split(',');
            }


            let ani = ctx.request.query.callerNumber;
            let dst = ctx.request.query.calleeNumber;
            let answer_status = ctx.request.query.answerStatus;
            let call_type = ctx.request.query.callType;

            let keys = {
                "jdAgent": gg1,
                "OrgId": gg2,
                "CallUid": gg3,
                "callerNumber": ani,
                "calleeNumber": dst,
                "answerStatus": answer_status,
                "callType": call_type,
            }
            let count;
            let cs;
            if (CallUid!=undefined && CallUid!=""){
                cs = await selectTable('InboundDetailedForUUid', keys);
                if (cs.length > 0) {
                    count = [{"count": 1}];
                } else {
                    count = [{"count": 0}];
                }
            }else{
                startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
                endTime_epoch = timestampToTime(endTime_epoch)
                let start = (page - 1) * pagesize; //当前页
                let end = pagesize * 1; //每页显示

                count = await selectTableCount('InboundDetailedCount', keys, '', startTime_epoch, endTime_epoch, start, end);

                cs = await selectTable('InboundDetailed', keys, '', startTime_epoch, endTime_epoch, start, end);
            }


            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    async CallInfo(ctx) {
        let body;
        try {
            let CallUid =ctx.request.query.callid;
            let cs = await selectTable('CallInfo',CallUid);
            body = {
                'code': 0,
                'message': '成功',
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 外呼明细
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async OutCallDetailed(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('OutCallDetailedCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('OutCallDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 自动外呼统计报表
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AutomaticOutCallStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示


            let count = await selectTableCount('AutomaticOutCallStatisCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('AutomaticOutCallStatis', '', '', startTime_epoch, endTime_epoch, start, end);

            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 外线使用报表
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async GatewayUse(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await  selectTableCount('GatewayUseCount', '', '', '', '', start, end);
            let cs = await selectTable('GatewayUse', '', '', '', '', start, end);


            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 正在执行的外呼数据任务
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async WaitingTask(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('WaitingTaskCount', '', '', '', '', start, end);
            let cs = await selectTable('WaitingTask', '', '', '', '', start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }


    /**
     * 呼叫排队明细
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AcdQueueDetailed(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AcdQueueDetailedCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('AcdQueueDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 呼叫放弃明细
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async CallHanguDetailed(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('CallHanguDetailedCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('CallHanguDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }


    /**
     * 坐席登陆明细
     * @param ctx
     * @returns {Promise.<void>}
     */
    async agent_login(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('agent_loginCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('agent_login', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 坐席小休明细
     * @param ctx
     * @returns {Promise.<void>}
     */
    async agent_acw(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('agent_acwCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('agent_acw', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }

    /**
     * 坐席话后明细
     * @param ctx
     * @returns {Promise.<void>}
     */
    async agent_aux(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('agent_auxCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('agent_aux', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }


    /**
     * 坐席保持明细
     * @param ctx
     * @returns {Promise.<void>}
     */
    async agent_hold(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('agent_holdCount', '', '', startTime_epoch, endTime_epoch, start, end);
            let cs = await selectTable('agent_hold', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
                'total': count["0"].count,
                'code': 0,
                'message': '成功',
                'page': page,
                'pagesize': pagesize,
                'data': cs
            }

        } catch (e) {
            body = {
                'code': 1,
                'message': e.message,
            }
        }
        ctx.body = body;
    }


}


module.exports = new ReportController();

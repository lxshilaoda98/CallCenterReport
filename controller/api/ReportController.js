var db = require("../../DB/DB"); //引入数据库封装模块
var log = require("../log4j/logger_Api");

//时间戳转换成日期
function timestampToTime(timestamp) {
    var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = date.getDate() + ' ';
    var h = date.getHours() + ':';
    var m = date.getMinutes() + ':';
    var s = date.getSeconds();
    return Y + M + D + h + m + s;
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
            switch (table) {
                case 'cdr_table_a_leg' :
                    resolve(db.findDataByPage_IVR(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'AgentLoginDetailed' :
                    resolve(db.AgentLoginDetailed(startTime_epoch, endTime_epoch, start, end));
                    break;
                case 'InboundDetailed':
                    resolve(db.InboundDetailed(startTime_epoch, endTime_epoch, start, end));
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

            let keys = ['*'];
            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            if (startTime_epoch == undefined || endTime_epoch == undefined || startTime_epoch == "" || endTime_epoch == "") {
                body = {
                    'code': 1,
                    'message': '必须传入时间',
                }
            } else {
                let cs = await selectTable('cdr_table_a_leg', keys, phoneName, startTime_epoch, endTime_epoch, start, end);
                body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('AgentLoginDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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

            startTime_epoch = timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = timestampToTime(endTime_epoch)


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('InboundDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('OutCallDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('AutomaticOutCallStatis', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示

            console.log('page.>' + page + '..>pagesize.>' + pagesize)

            let cs = await selectTable('GatewayUse', '', '', '', '', start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示

            console.log('page.>' + page + '..>pagesize.>' + pagesize)

            let cs = await selectTable('WaitingTask', '', '', '', '', start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('AcdQueueDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('CallHanguDetailed', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('agent_login', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('agent_acw', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('agent_aux', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('agent_hold', '', '', startTime_epoch, endTime_epoch, start, end);
            body = {
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

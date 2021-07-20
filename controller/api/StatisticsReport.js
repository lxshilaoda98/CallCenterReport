/**
 * Created by Administrator on 2020/7/23.
 * 统计表报
 */
const ModHelper = require('../ModHelper')
var log = require("../log4j/logger_Api");
var db = require("../../DB/DB"); //引入数据库封装模块

function selectTable(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end, SelectType) {
    return new Promise((resolve, reject) => {
        try {
            log.info("[StatisReport].>调用了..>" + table + `..>参数.>keys=${keys}phoneName=${phoneName}
            startTime_epoch=${startTime_epoch}endTime_epoch=${endTime_epoch}start=${start}end=${end}`)
            switch (table) {
                case 'Ivr_Statis' :
                    resolve(db.Ivr_Statis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'Agent_CallStatis' :
                    resolve(db.Agent_CallStatis(startTime_epoch, endTime_epoch, start, end, SelectType,keys));
                    break;
                case 'CallCountStatis' :
                    resolve(db.CallCountStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentCountStatis' :
                    resolve(db.AgentCountStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'OrgCountStatis' :
                    resolve(db.OrgCountStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'OutCallStatis' :
                    resolve(db.OutCallStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentACWStatis' :
                    resolve(db.AgentACWStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentServiceStatis' :
                    resolve(db.AgentServiceStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentLoginStatis' :
                    resolve(db.AgentLoginStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentlevelStatis' :
                    resolve(db.AgentlevelStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentlevelPropStatis' :
                    resolve(db.AgentlevelPropStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;



                default :
                    resolve('未知参数');
            }
        } catch (e) {
            reject(e.message);
        }
    });
}

function selectTableCount(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end, SelectType) {
    return new Promise((resolve, reject) => {
        try {
            log.info("[StatisReportCount].>调用了..>" + table + `..>参数.>keys=${keys}phoneName=${phoneName}
            startTime_epoch=${startTime_epoch}endTime_epoch=${endTime_epoch}start=${start}end=${end}`)
            switch (table) {
                case 'Ivr_StatisCount' :
                    resolve(db.Ivr_StatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'Agent_CallStatisCount' :
                    resolve(db.Agent_CallStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType,keys));
                    break;
                case 'CallCountStatisCount' :
                    resolve(db.CallCountStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentCountStatisCount' :
                    resolve(db.AgentCountStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'OrgCountStatisCount' :
                    resolve(db.OrgCountStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'OutCallStatisCount' :
                    resolve(db.OutCallStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentACWStatisCount' :
                    resolve(db.AgentACWStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentServiceStatisCount' :
                    resolve(db.AgentServiceStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentLoginStatisCount' :
                    resolve(db.AgentLoginStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentlevelStatisCount' :
                    resolve(db.AgentlevelStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'AgentlevelPropStatisCount' :
                    resolve(db.AgentlevelPropStatisCount(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;



                default :
                    resolve('未知参数');
            }
        } catch (e) {
            reject(e.message);
        }
    });
}

class StatisticsReport {
    /**
     * IVR 呼叫统计
     * @param ctx
     * @returns {Promise.<void>}
     */
    async Ivr_Statis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示


            let count = await selectTableCount('Ivr_StatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('Ivr_Statis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 坐席呼叫量统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async Agent_CallStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;
            let SelectType = ctx.request.query.type;
            let agentId = ctx.request.query.agentId;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('Agent_CallStatisCount', agentId, '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('Agent_CallStatis', agentId, '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 综合呼叫量统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async CallCountStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('CallCountStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('CallCountStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 坐席综合统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AgentCountStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AgentCountStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('AgentCountStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 技能组综合统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async OrgCountStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('OrgCountStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('OrgCountStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 呼出电话统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async OutCallStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('OutCallStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('OutCallStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 坐席休息时间统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AgentACWStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AgentACWStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('AgentACWStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 坐席服务水平统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AgentServiceStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AgentServiceStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('AgentServiceStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 坐席登录统计
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AgentLoginStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AgentLoginStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('AgentLoginStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 客户对客服满意度评价
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AgentlevelStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AgentlevelStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('AgentlevelStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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
     * 客户对客服满意度评价比例
     * @param ctx
     * @returns {Promise.<void>}
     * @constructor
     */
    async AgentlevelPropStatis(ctx) {
        let body;
        try {
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let SelectType = ctx.request.query.type;

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * pagesize; //当前页
            let end = pagesize * 1; //每页显示

            let count = await selectTableCount('AgentlevelPropStatisCount', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
            let cs = await selectTable('AgentlevelPropStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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


module.exports = new StatisticsReport();



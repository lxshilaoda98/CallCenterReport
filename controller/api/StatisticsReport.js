/**
 * Created by Administrator on 2020/7/23.
 * 统计表报
 */
const ModHelper = require('../ModHelper')
var db = require("../../DB/DB"); //引入数据库封装模块

function selectTable(table, keys, phoneName, startTime_epoch, endTime_epoch, start, end, SelectType) {
    return new Promise((resolve, reject) => {
        try {
            console.log("[StatisReport].>调用了..>" + table + `..>参数.>keys=${keys}phoneName=${phoneName}
            startTime_epoch=${startTime_epoch}endTime_epoch=${endTime_epoch}start=${start}end=${end}`)
            switch (table) {
                case 'Ivr_Statis' :
                    resolve(db.Ivr_Statis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'Agent_CallStatis' :
                    resolve(db.Agent_CallStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
                    break;
                case 'CallCountStatis' :
                    resolve(db.CallCountStatis(startTime_epoch, endTime_epoch, start, end, SelectType));
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('Ivr_Statis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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

            startTime_epoch = ModHelper.timestampToTime(startTime_epoch) //时间戳转换成 yyyy-mm-dd hh:mm:ss
            endTime_epoch = ModHelper.timestampToTime(endTime_epoch)


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('Agent_CallStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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


            let start = (page - 1) * 5; //当前页
            let end = pagesize * 1; //每页显示


            let cs = await selectTable('CallCountStatis', '', '', startTime_epoch, endTime_epoch, start, end, SelectType);
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


module.exports = new StatisticsReport();



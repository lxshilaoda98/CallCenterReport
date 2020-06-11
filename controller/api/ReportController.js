var db = require("../../DB/DB"); //引入数据库封装模块


/**
 *
 * @param table 表
 * @param keys 字段
 * @param start  0
 * @param end 1   《第一条数据》
 * @returns {Promise}
 */
function selectTable(table, keys,phoneName,startTime_epoch, endTime_epoch,start, end) {
    return new Promise((resolve, reject) => {
        try {
            resolve(db.findDataByPage_IVR(table, keys,phoneName,startTime_epoch,endTime_epoch, start, end));
        } catch (e) {
            reject(e.message);
        }

    });
}


class ReportController {


    async IVRDetailed(ctx) {
        let body;
        try{
            let page = ctx.request.query.page;
            let pagesize = ctx.request.query.pagesize;
            let phoneName = ctx.request.query.phoneName;
            let startTime_epoch = ctx.request.query.sTime_epoch;
            let endTime_epoch = ctx.request.query.eTime_epoch;

            let keys =['*'];
            let start = (page-1)*5; //当前页
            let end   = pagesize*1; //每页显示


            if(startTime_epoch == undefined || endTime_epoch ==undefined || startTime_epoch =="" || endTime_epoch==""){
                body ={
                    'code':1,
                    'message':'必须传入时间',
                }
            }else{
                let cs = await selectTable('cdr_table_a_leg',keys,phoneName,startTime_epoch,endTime_epoch,start,end);
                body = {
                    'code':0,
                    'message':'成功',
                    'page':page,
                    'pagesize':pagesize,
                    'data':cs
                }
            }
        }catch (e){
           body ={
               'code':1,
               'message':e.message,
           }
        }
        ctx.body = body;
    }
}


module.exports = new ReportController();

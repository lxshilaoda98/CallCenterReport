const router = require('koa-router')();


const Detailed = require('../controller/api/ReportController');

const Statistic = require('../controller/api/StatisticsReport');

router

    .get('/detailed/IVRDetailed', Detailed.IVRDetailed)
    .get('/detailed/AgentLoginDetailed', Detailed.AgentLoginDetailed)
    .get('/detailed/InboundDetailed', Detailed.InboundDetailed)
    .get('/detailed/CallInfo',Detailed.CallInfo)

    .get('/detailed/OutCallDetailed', Detailed.OutCallDetailed)
    .get('/detailed/AcdQueueDetailed', Detailed.AcdQueueDetailed)
    .get('/detailed/CallHanguDetailed', Detailed.CallHanguDetailed)
    .get('/detailed/agent_login', Detailed.agent_login)
    .get('/detailed/agent_acw', Detailed.agent_acw)
    .get('/detailed/agent_aux', Detailed.agent_aux)
    .get('/detailed/agent_hold', Detailed.agent_hold)


    .get('/Statistic/Ivr_Statis', Statistic.Ivr_Statis)
    .get('/Statistic/Agent_CallStatis', Statistic.Agent_CallStatis)
    .get('/Statistic/CallCountStatis', Statistic.CallCountStatis)
    .get('/Statistic/AgentCountStatis', Statistic.AgentCountStatis)
    .get('/Statistic/AgentStatusStatis', Statistic.AgentStatusStatis)

    .get('/Statistic/OrgCountStatis', Statistic.OrgCountStatis)
    .get('/Statistic/OutCallStatis', Statistic.OutCallStatis)
    .get('/Statistic/AgentACWStatis', Statistic.AgentACWStatis)
    .get('/Statistic/AgentServiceStatis', Statistic.AgentServiceStatis)
    .get('/Statistic/AgentLoginStatis', Statistic.AgentLoginStatis)
    .get('/Statistic/AgentlevelStatis', Statistic.AgentlevelStatis)
    .get('/Statistic/AgentlevelPropStatis', Statistic.AgentlevelPropStatis)






    .get('/autoTask/AutomaticOutCall', Detailed.AutomaticOutCallStatis)
    .get('/autoTask/GatewayUse', Detailed.GatewayUse)
    .get('/autoTask/WaitingTask', Detailed.WaitingTask)




module.exports = router;



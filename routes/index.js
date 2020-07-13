const router = require('koa-router')();


const Detailed = require('../controller/api/ReportController');

router

    .get('/detailed/IVRDetailed', Detailed.IVRDetailed)
    .get('/detailed/AgentLoginDetailed', Detailed.AgentLoginDetailed)
    .get('/detailed/InboundDetailed', Detailed.InboundDetailed)
    .get('/detailed/OutCallDetailed', Detailed.OutCallDetailed)

    .get('/autoTask/AutomaticOutCall', Detailed.AutomaticOutCallStatis)
    .get('/autoTask/GatewayUse', Detailed.GatewayUse)
    .get('/autoTask/WaitingTask', Detailed.WaitingTask)


module.exports = router;



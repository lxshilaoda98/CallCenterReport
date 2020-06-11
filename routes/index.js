const router = require('koa-router')();


const Detailed = require('../controller/api/ReportController');

router

    .get('/detailed/IVRDetailed', Detailed.IVRDetailed);


module.exports = router;



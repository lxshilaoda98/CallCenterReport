// app.js
// 加载依赖
const fs = require('fs');
const koa = require('koa');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');
const apiRouter = require('./routes');



const app = new koa();




// 首页
const index = router.get('/', ctx => {
    ctx.type = 'text/html';
    ctx.body = fs.createReadStream('./SipXml.html');

}).routes();

app.use(index);
app.use(bodyParser());
app.use(apiRouter.routes());

app.listen(3322);
console.log('开启成功!')




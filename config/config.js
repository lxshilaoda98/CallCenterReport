/**
 * Created by Administrator on 2019/10/18.
 */
const configParams = {
    freeswitch : {
        ip:'192.168.101.205',
        port:8021,
        password :'ClueCon',
        APIkey:'FreeSWITCH', //获取API接口用到的key
        RecordWav : '/home/RecordWav',//录音路径
        RecordWavFTPIp : '192.168.101.193',
        WebSocketLocalhost:'localhost',
        WebSocketPort : '5555'//
    },
};
const getConfig = module=>(configParams[module]!==undefined)?configParams[module]:{};
exports.getConfig = getConfig;
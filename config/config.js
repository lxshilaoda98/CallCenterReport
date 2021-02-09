/**
 * Created by Administrator on 2019/10/18.
 */
const configParams = {
    AppConfig:{
        port:3322,
    },
    database: {
        DATABASE: 'freeswitch',
        USERNAME: 'root',
        PASSWORD: 'root',
        PORT: '3307',
        HOST: '127.0.0.1'
    }
};
const getConfig = module=>(configParams[module]!==undefined)?configParams[module]:{};
exports.getConfig = getConfig;
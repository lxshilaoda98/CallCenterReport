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
        PASSWORD: '2krUCTwtENQCJDaL',
        PORT: '3300',
        HOST: '39.97.233.230'
    }
};
const getConfig = module=>(configParams[module]!==undefined)?configParams[module]:{};
exports.getConfig = getConfig;

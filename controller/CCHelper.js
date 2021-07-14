let mysql = require("mysql")
let config = require('../config/config.js').getConfig('database');
let pool = mysql.createPool({
    host: config.HOST,
    port: config.PORT,
    user: config.USERNAME,
    password: config.PASSWORD,
    database: config.DATABASE
});

let query = function (sql, values) {
    console.log("运行sql..>" + sql)
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                resolve(err)
            } else {
                connection.query(sql, values, (err, rows) => {
                    if (err) {
                        reject(err)
                    } else {

                        resolve(rows)
                    }
                    connection.release()
                })
            }
        })
    })
}


async function GetAttribution(Phone){
    let AttrName;
    let table;
    if (Phone.substr(0,1)==0 && Phone.length>=11){
        let NewPhone =Phone.substr(0,1);
        if (NewPhone.substr(0,1)==1 && NewPhone.length==11){
            let q7=NewPhone.substr(0,7)
            //外地手机
            table =await query("select province,city from phoneterritory where Number =? ",[q7])
        }else if ((NewPhone.substr(0,1)==1 || NewPhone.substr(0,1)==2) && NewPhone.length <11){
            //10或者20固话
            let q2=NewPhone.substr(0,2)
            table =await query("select province,city from phoneterritory where AreaNumber =? ",[q2])
        }else{
            let q3=NewPhone.substr(0,3)
            table =await query("select province,city from phoneterritory where AreaNumber =? ",[q3])
        }
        AttrName=table;

    }else if(Phone.length ==11){

        let q7=Phone.substr(0,7);

        table =await query("select province,city from phoneterritory where Number =? ",[q7])

        AttrName=table;

    }else{
        console.log("未知："+Phone)
        AttrName=[{"province":"未知","city":"未知"}]
    }
    return AttrName
}

module.exports = {
    GetAttribution
}

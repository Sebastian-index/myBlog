/*
 mongodb vs mysql(sql:structured query language)
 mysql(sql server)：每一条记录的结构完全一样；
    举例：淘宝（12306）中的“用户”与“地址”的关系是1：n，多表设计。
        user
            username
            password
            birthday
            avatar
            email
            telephone
            address:address1;address2;

 mongodb：（nosql===not only sql）可以存储“数组”结构的数据
    举例：淘宝（12306）中的“用户”与“地址”的关系是1：n，单表设计。
        user
            username
            password
            birthday
            avatar
            email
            telephone
            address[]:
                address1;
                address2;
    默认端口是：27017
        建议开启新端口：
    D:\Program Files\MongoDB\Server\4.0\bin>mongod --dbpath E:\WebstormProjects\19-D
MT-1-CMS\db --port 27018

    "mongoose": "^6.0.12",版本较新，需要升级node.js（node-v12.16.2-x64）或者降低mongoose自身版本

 */
//时间戳：创建时间、修改时间、登录时间
//5w1h原则：who（外键）/when（时间戳）/where（IP）


const mongoose=require('mongoose');

const schema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        default:"Anonymous"
    },
    email: {
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    //分类角色 管理员 模块信息员 用户
    // isAdmin:
    //     {
    //       type:Boolean,
    //         default:false,
    //     },
    avatar:
        {
            type:String,

        }
    ,
    role:
   {
       type:String,
       required:true,
       default:"common"
   }
},{timestamps:true})

module.exports=schema;
const express = require('express')
const config=require('./config')
const app = express()
const port = config.port_app
const swig=require('swig')
const mongoose=require('mongoose');
const Cookies=require('cookies')
const User = require('./models/User')//引入数据库信息

//just for cookies
app.use(function (req,res,next) {
    const cookies = new Cookies(req, res)
    //console.log(cookies.get("userInfo"));
    if(cookies.get("userInfo")){
        let userInfo =JSON.parse(cookies.get("userInfo"))
        req.user = userInfo;
        User.findOne({"_id":userInfo._id.toString()}).then(function (user)
        {
            //console.log(user);
            req.user.role =user.role;
            req.user.avatar = user.avatar;
            next();
        })

    }
    else
    {
        next();
    }
})

//发布时，开启缓存
swig.setDefaults({cache:false})

//静态文件托管设置
app.use('/public',express.static(__dirname+'/public'))
app.use('/uploads',express.static(__dirname+'/uploads'))
//提取form的post方式提交的数据，并解析到body对象中，挂载到req对象中。
app.use(express.urlencoded({extended:true}))

//配置路由（tips：可以按照“功能模块”组织路由模块，比如account.js）
//为了性能考虑：以下配置，建议排序按照“特殊→一般”
app.use('/admin',require('./routers/admin'));
app.use('/account',require('./routers/account'));
app.use('/',require('./routers/main'));
app.use('/upload',require('./routers/upload'));

//参数1：模板引擎的名称，也是模板文件的后缀；参数2：处理模板的方法
app.engine('html',swig.renderFile);
//参数1：对views做设置；参数2：模板文件存放的路径；
app.set('views', './views') // specify the views directory
//参数1：对view engine做设置；参数2：模板引擎的名称；
app.set('view engine', 'html') // register the template engine


mongoose.connect(`mongodb://localhost:${config.port_database}/cms`,function (err) {
    if(err){
        console.log('数据库启动失败！');
    }else{
        app.listen(port, () => {
            console.log(`数据库启动成功，打开应用： http://localhost:${port}`)
        })
    }

});








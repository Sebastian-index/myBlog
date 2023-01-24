//跟“账号”相关的API，所有用户均可访问。
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cookies = require('cookies');
const bcrypjs = require('bcryptjs');
const nodemailer = require('nodemailer');
//练习：登录功能（1）HTML（2）服务器端get和post处理器实现

let userInfo = {};
let responseJson;
router.use(function (req, res, next) {
    responseJson =
        {
            code: 0,
            message: "",
        }
    next();
})


//首次配置管理员账号
router.get('/set',(req,res) =>
{
    User.findOne({role:'admin'}).then(function (user) {

        //console.log(user);
        if(user)
        {
            res.render('success',{msg:"无权使用该页面"});
        }
        else
        {
            res.render('init');
        }
    })
});
//todo:bcrypjs插件用来使得密码散列化
router.post('/set',async (req,res) =>
{
    const email = req.body.email;
    const password = await bcrypjs.hash(req.body.password,8);
    const passwordAgain = await bcrypjs.compare(req.body.passwordAgain,password);
    if(passwordAgain ===true)
    {
        const admin = new User({
            email:email,
            password:password,
            role:"admin"
        })
        admin.save().then(()=>
        {
            res.render('success',{msg:"恭喜你，配置管理员成功！"});
        })
    }

})


router.get('/register', (req, res) => {
    res.render('register', {user: req.user})
})


//注册
router.post('/register', async (req, res) => {
    console.log(req.body);
    const email = req.body.email;
    const password =await bcrypjs.hash(req.body.password,8);
    const passwordAgain =await bcrypjs.compare(req.body.passwordAgain,password);
    //const isMatch = await bcrypjs.compare(password,passwordAgain);
    //console.log(isMatch);
    //console.log(password,passwordAgain);
    //todo：数据校验（复杂度、email校验）
    if (email === "" || password === "" || passwordAgain === "") {
        responseJson.code = -2;
        responseJson.message = "邮箱或密码不能为空!";
        res.json(responseJson);
        //res.render('error', {'msg': "邮箱或密码不能为空！"})
        return;
    }
    if (passwordAgain === false) {
        responseJson.code = -3;
        responseJson.message = "两次密码不一致!";
        res.json(responseJson);
        //res.render('error', {'msg': "两次密码不一致！"})
        return;
    }
    const user = await User.findOne({email: email})
    if (user) {
        responseJson.code = -4;
        responseJson.message = "邮箱已被注册!";
        res.json(responseJson);
        //console.log("exist");
        //res.render('error', {'msg': "邮箱已被注册！"})
        return;
    }

    //todo:写入数据库
    const account = new User({
        email: email,
        password: password,
    });
    account.save().then(() => {
        //console.log('registered successfully');
        responseJson.code = 2;
        responseJson.message = "注册成功!";
        res.json(responseJson);
        //res.render('admin/success',{user:req.user,msg:"恭喜你，注册成功！",url:"/admin/account/list"})
    });
})

//登录
router.get('/login', (req, res) => {
    res.render('login', {user: req.user})
})
router.post('/login', (req, res) => {
    //console.log(req.body);
    const email = req.body.email;
    User.findOne({email: email}).then(async function (user) {
        if(user)
        {
            const password = await bcrypjs.compare(req.body.password,user.password)//哈希算法加密
            //console.log(password)
            //const isMatch = await bcrypjs.compare(password,req.query.password);
            if (password === true) {
                userInfo._id = user._id.toString();
                userInfo.email = user.email;
                //userInfo.avatar = user.avatar;
                //todo：写cookie到客户端
                const cookies = new Cookies(req, res);
                cookies.set("userInfo", JSON.stringify(userInfo));
                responseJson.code = 1;
                responseJson.message = "登录成功!";
                res.json(responseJson);
                //res.render('admin/success', {'msg': "登录成功", user: userInfo, users: req.user, url: "/new"})
            } else {
                responseJson.code = -1; // 401邮箱验证失败 402密码验证失败 403账号冻结
                responseJson.message = "登录失败，密码错误";
                res.json(responseJson);
                //res.render('error', {'msg': "登录失败，请确认邮箱或密码是否有误！"})
            }
        }
        else
            {
                responseJson.code = -6; // 401邮箱验证失败 402密码验证失败 403账号冻结
                responseJson.message = "登录失败，账号错误";
                res.json(responseJson);
            }

    })
});


//修改更新
router.get('/update', (req, res) => {
    const userId = req.query.userId;
    User.findOne({_id: userId}).then(function (userFromDb) {
        if (!userFromDb) {
            res.render('admin/error', {msg: "修改失败"})
        }
        else {
            res.render('admin/account_update', {user: userFromDb})
        }
    })
})
router.post('/update',async (req, res) => {
    const email = req.body.email;
    const password = await bcrypjs.hash(req.body.password,8);
    const userId = req.body.userId;
    //console.log(email,password,userId);
    User.findOne({_id: userId}).then(async function (userFromDb) {
        if (!userFromDb) {
            res.render('admin/error', {msg: "修改失败"})
        }
        if (password === userFromDb.password && email === userFromDb.email) {
            res.render('admin/success', {msg: "没有任何修改"})
        }
        else {
            await User.updateOne({_id: userId},
                {
                    email: email,
                    password: password
                })
            res.render('admin/success', {msg: "修改成功", url: "/admin/account/list"})
        }
        // res.render('admin/account_update',{user:userFromDb})
    })

})


//忘记密码 todo:忘记密码的找回功能 能从邮箱获取到重置的密码
router.get('/forget',(req,res)=>
{
   res.render('admin/forgetPassword');
});

router.post('/forget',(req,res)=>
{
   const email = req.body.email;

  User.find({email:email}).then(async function (user) {
      if(user)
      {
          const password = Math.random().toString(36).substr(2);
          console.log(password);
          const passAgain = await bcrypjs.hash(password,8);
          let transporter = nodemailer.createTransport({
              host:'smtp.qq.com',
              secureConnection:true,
              port:465,
              secure:true,
              auth:
                  {
                      user:'1390303319@qq.com',
                      pass:'brkftjebyqjibagj',
                  }
          })

          await User.updateOne({email:email},
              {
                password: passAgain
              })
          let mailOption = {
              from:'1390303319@qq.com',
              to:email,
              subject:'查收密码',
              text:'当前密码是:'+ password
          }
          transporter.sendMail(mailOption,(err,info)=>
          {
              if(err)
              {
                  console.log(err);
              }
              else
              {
                  console.log('账号密码查收'+info.response);
              }
          })
      }
      else
          {
              res.render('admin/success', {msg: "无此账户", url: "/"})
          }
  })
    res.render('admin/success', {msg: "发送成功", url: "/"})
})

module.exports = router;
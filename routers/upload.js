
//todo:上传头像 并且可以修改头像
const express = require('express');
const router = express.Router();
const multer  = require('multer');
const User = require('../models/User');
const Cookies = require('cookies');
const sharp = require('sharp');
const upload = multer({
    //dest: 'uploads/',
    limit:1000000,
    fileFilter(req,file,cb)
    {
         if(!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/))
         {
             cb(new Error('Please upload an image'))
         }
       // cb(null,false);
        cb(null,true);
    }

})



router.get('/avatar',(req,res,next)=>
{
    const userId = req.query.userId;
    User.findOne({_id:userId}).then(function (user) {

        res.render('admin/avatar_upload',{user:user});
    })

})

router.post('/avatar',upload.single('avatar'),async (req,res,next)=>{
    let filename = Date.now();
    const userId = req.body.userId;
    let avatarPath = "uploads/"+filename+".png";
    console.log(req.file);
    await sharp(req.file.buffer).resize(140,140).toFile(avatarPath);
    await User.updateOne({_id:userId},
        {
            avatar:filename+'.png'
        })
    res.render('admin/success', {user:req.user,msg: "修改头像成功",url:'/'});
})


module.exports = router;
//公开的的处理器
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Blog = require('../models/Blog');
const Cookies = require('cookies');
const Link = require('../models/Link');
const Filter = require('bad-words');
/*router.get('/', (req, res) => {
    //res.send('Hello World!')
    res.render('index',{user:req.user})
})*/
let userInfo = {};
let responseJson;

router.use(function (req, res, next) {
    responseJson =
        {
            code: 0,
            message: "",
            data: req.blog,
        }
    next();
})


//首页加载
router.get('/', (req, res) => {
    let data =
        {
            user: req.user,
            _categoryId: req.query._categoryId,
            page: Number(req.query.page || 1),
            limit: 4,
            categories: [],
            pages: 0,
            count: 0
        }

    let where = {};
    if (data._categoryId) {
        where._categoryId = data._categoryId;//筛选 where函数
    }

    Category.find().sort({order: -1}).then(function (category) {

        data.categories = category;

        return Blog.where(where).count();

    }).then(function (count) {

        data.count = count;
        //console.log(count);
        //计算总页数
        data.pages = Math.ceil(data.count / data.limit);
        //取值不超过总数
        data.page = Math.min(data.page, data.pages);
        //取值不小于1
        data.page = Math.max(data.page, 1);

        let skip = (data.page - 1) * data.limit;

        return Blog.where(where).find({status: true}).sort({
            order: -1,
            createdAt: -1
        }).limit(data.limit).skip(skip).populate(['_categoryId', '_userId'])
    }).then(function (blog) {
        data.blogs = blog;
        //console.log(req.user.avatar);
        Link.find().sort({order: -1}).then(function (link) {
            data.link = link;
            res.render('User/index', data);
        })

    })


})

//注销
router.get('/logout', (req, res) => {
    const cookies = new Cookies(req, res)
    cookies.set("userInfo", null)
    //res.json(responseJson);
    let data =
        {
            user: req.user,
            _categoryId: req.query._categoryId,
            page: Number(req.query.page || 1),
            limit: 4,
            categories: [],
            pages: 0,
            count: 0
        }

    let where = {};
    if (data._categoryId) {
        where._categoryId = data._categoryId;//筛选 where函数
    }

    Category.find().sort({order: -1}).then(function (category) {

        data.categories = category;

        return Blog.where(where).count();

    }).then(function (count) {

        data.count = count;
        //console.log(count);
        //计算总页数
        data.pages = Math.ceil(data.count / data.limit);
        //取值不超过总数
        data.page = Math.min(data.page, data.pages);
        //取值不小于1
        data.page = Math.max(data.page, 1);

        let skip = (data.page - 1) * data.limit;

        return Blog.where(where).find({status: true}).sort({_id: -1}).limit(data.limit).skip(skip).populate(['_categoryId', '_userId'])
    }).then(function (blog) {
        data.blogs = blog;
        Link.find().sort({order: -1}).then(function (link) {
            data.link = link;
            // res.redirect(302,'http://localhost:8080');
            res.render('User/index', data);
        })
    })
})

//查看博文内容
router.get('/view/:id', async (req, res) => {
    let id = req.params.id;
    let blog = await Blog.findOne({_id: id}).populate({
        path: '_categoryId',
        select: 'username'
    }).populate({path: '_userId', select: 'email'});
    blog.pv++;
    blog.save();

    await Category.find().sort({order: -1}).then(function (category) {
        Link.find().sort({order: -1}).then(function (link) {
            res.render('User/view', {user: req.user, blog: blog, link: link, categories: category});
        })
    });
});
/*博客留言系统制作*/
//留言
router.post('/comment/submit', (req, res) => {
    const filter = new Filter({placeHolder: '#*'});
    filter.addWords('some', 'bad', 'word');//todo:敏感词过滤some bad word
    let blogId = req.body.blogId;
    let postData =
        {
            email: req.body.email,
            postTime: new Date().toJSON(),
            comment: filter.clean(req.body.comment),
            pass: false,
        }
    /*if (postData.email === " " || postData.comment === " ") {
        responseJson.code = 22;
        responseJson.message = "未输入邮箱或评论";
        responseJson.data = req.blog;
        res.json(responseJson);

    }*/
        Blog.findOne({_id: blogId}).then(function (blog) {
            blog.comment.push(postData);
            return blog.save();
        }).then(function (newblog) {

            responseJson.message = "评论成功待审核";
            responseJson.code = 4;
            responseJson.data = newblog;
            res.json(responseJson);
        })

    // if(postData.comment.count('#') < 1){
    //}
    //else
    /*    {
            responseJson.message = "评论失败敏感词过多";
            responseJson.code = 10;
            res.json(responseJson);
        }
*/
})
//评论加载
router.get('/comment', (req, res, next) => {
    let blogId = req.query.blogId;
    Blog.findOne({_id: blogId}).then(function (blog) {
        //console.log(blog.comment);
        responseJson.message = "加载评论成功";
        responseJson.code = 5;
        responseJson.data = blog.comment;
        res.json(responseJson);

    })

})


/*博客留言系统制作*/
module.exports = router;
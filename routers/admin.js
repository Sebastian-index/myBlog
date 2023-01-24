//管理员可访问的处理器
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cookies = require('cookies');
const Category = require('../models/Category');
const Blog = require('../models/Blog');
const Link = require('../models/Link');
const multer=require('multer');
let fs = require('fs');
let path = require('path');
const sharp = require('sharp');
const appendix = multer({
    dest: 'public/appendixes',
    limit:10000000,//10mb
    fileFilter(req,file,cb)
    {
        if(!file.originalname.match(/\.(doc|docx|pdf|zip|rar|)$/))
        {
            cb(new Error('Please upload an correct file'))
        }
        // cb(null,false);
        cb(null,true);
    }

})
let userInfo = {};

router.use(function (req, res, next) {
    if (req.user.role === undefined) {
        res.send("未登录")
        return;
    }
    else {
        if (req.user.role !== "admin") {
            res.send("无权访问")
            return;
        }
        next();
    }
})
//管理员首页
router.get('/', (req, res) => {
    res.render('admin/index', {user: req.user})
})


/*栏目增删改查制作环节*/

//查看所有栏目
router.get('/category/list', (req, res) => {
    let page = Number(req.query.page || 1);
    let limit = 5;
    Category.count().then(function (count) {
        //console.log(count);
        //计算总页数
        pages = Math.ceil(count / limit);
        //取值不超过总数
        page = Math.min(page, pages);
        //取值不小于1
        page = Math.max(page, 1);


        let skip = (page - 1) * limit;


        Category.find().sort({createdAt: -1}).limit(limit).skip(skip).populate({
            path: '_userId',
            select: 'email'
        }).then(function (category) {
            //console.log(category);
            res.render('admin/category_list', {
                user: req.user,
                categories: category,
                page: page,
                count: count,
                limit: limit,
                pages: pages
            })
        })
    })
})
//新增栏目
router.get('/category/create', (req, res) => {
    res.render('admin/category_create', {user: req.user})
})
router.post('/category/create', async (req, res) => {
    let categoryName = req.body.categoryName;
    let order = req.body.order;
    //todo:验证
    await new Category({
        username: categoryName,
        _userId: req.user._id,
        order: order
    }).save();
    res.render('admin/success', {user: req.user, msg: "添加栏目成功", url: "/admin/category/list"});
})
//删除栏目
router.get('/category/delete', (req, res) => {
    const categoryId = req.query.categoryId;
    Category.deleteOne({_id: categoryId}).then(function (err) {
        if (err) {
            console.log(err)
        }
        res.render('admin/success', {user: req.user, msg: "删除栏目成功", url: "/admin/category/list"})
    })
})

//修改栏目
router.get('/category/update', (req, res, next) => {
    const categoryId = req.query.categoryId;
    Category.findOne({_id: categoryId}).then(function (category) {
        if (!category) {
            res.render('admin/error', {msg: "修改失败"})
        }
        else {
            res.render('admin/category_update', {user: req.user, categories: category})
        }
    })
})
router.post('/category/update', (req, res, next) => {
    const categoryId = req.body.categoryId;
    const categoryName = req.body.categoryName;
    const order = req.body.order;
    Category.findOne({_id: categoryId}).then(async function (category) {
        if (!category) {
            res.render('admin/error', {msg: "修改失败"})
        }
        if (categoryName === category.username && order === category.order) {
            res.render('admin/success', {user: req.user, msg: "修改成功", url: "/admin/category/list"})
        }
        await Category.updateOne({
            _id: categoryId
        }, {
            username: categoryName,
            order: order
        });
        res.render('admin/success', {user: req.user, msg: "修改成功", url: "/admin/category/list"})
    })
})


//查询
router.post('/category/search', async (req, res) => {
    const username = req.body.username;
    //console.log(username);
    if (username === "") {
        res.render('admin/error', {'msg': "该内容不能为空！"})
        return;
    }
    const username1 = await Category.find({username: username}).populate({path: '_userId', select: 'email'});
    //console.log(username1);
    if (username1) {
        res.render('admin/category_list', {user: req.user, username1});
    }
})

/*栏目增删改查制作环节*/


/*博文系统*/
//创建博文界面
router.get('/blog/create', (req, res, next) => {
    Category.find().sort({order: 1}).then(function (category) {
        res.render('admin/blog_create', {user: req.user, categories: category})
    })

})
//提交博文方法 todo:(传输附件)
router.post('/blog/create',appendix.single('appendix'),async (req, res, next) => {
    let order = req.body.order;
    let title = req.body.title;
    let abstract = req.body.abstract;
    let content = req.body.content;
    //let filename = req.file.originalname;
    //console.log(filename);
    console.log(req.file);
    if(req.file!==undefined)
    {
        let oldname = req.file.path ||' ';
        let newname = req.file.path + path.parse(req.file.originalname).ext||' ';
        fs.renameSync(oldname, newname);
        console.log(oldname,newname);
        await new Blog(
            {
                _userId: req.user._id,
                _categoryId: req.body.categoryName,
                title: title,
                abstract: abstract,
                content: content,
                order: order,
                appendix:newname
            }).save();
    }
    else
    {
        await new Blog(
            {
                _userId: req.user._id,
                _categoryId: req.body.categoryName,
                title: title,
                abstract: abstract,
                content: content,
                order: order,
            }).save();
    }


    res.render('admin/success', {user: req.user, msg: "发布成功", url: "/admin/blog/list"});
})

//删除博文
router.get('/blog/delete', (req, res) => {
    const blogId = req.query.blogId;
    Blog.deleteOne({_id: blogId}).then(function (err) {
        if (err) {
            console.log(err)
        }
        res.render('admin/success', {user: req.user, msg: "删除博文成功", url: "/admin/blog/list"})
    })
})


//查询单条博文
router.post('/blog/search', async (req, res) => {
    const title = req.body.title;
    console.log(title);
    if (title === "") {
        res.render('admin/error', {'msg': "该内容不能为空！"})
        return;
    }
    const title1 = await Blog.find({title: title}).populate(['_categoryId', '_userId']);
    console.log(title1);
    if (title1) {
        res.render('admin/blog_list', {title1});
    }
})


//各个文章的评论数查看
router.get('/comment/list', (req, res) => {
    let page = Number(req.query.page || 1);
    let limit = 5;
    Blog.count().then(function (count) {
       // console.log(count);
        //计算总页数
        pages = Math.ceil(count / limit);
        //取值不超过总数
        page = Math.min(page, pages);
        //取值不小于1
        page = Math.max(page, 1);


        let skip = (page - 1) * limit;
        Blog.find().limit(limit).skip(skip).populate(['_categoryId', '_userId']).sort({createdAt: -1}).then(function (blog) {
            res.render('admin/comment_list', {
                user: req.user,
                blog: blog,
                page: page,
                limit: limit,
                pages: pages,
                count: count
            })
        })
    })
})
//查询该博文的全部评论
router.get('/comment/detail', (req, res) => {
    const blogId = req.query.blogId;

    Blog.findOne({_id: blogId}).then(function (blog) {
        /*   let page = Number(req.query.page || 1);
           let limit = 5;
           //计算总页数
           pages = Math.ceil(blog.comment.length / limit);
           //取值不超过总数
           page = Math.min(page, pages);
           //取值不小于1
           page = Math.max(page, 1);
           let skip = (page - 1) * limit;
           //console.log(blog.comment);
          Blog.findOne({},{comment:blog.comment}).limit(limit).skip(skip);*/
        res.render('admin/comment_detail', {
            user: req.user,
            blog: blog,
            comment: blog.comment,
            /* limit:limit,
             page:page,
             pages:pages*/
        })
    })
})

//删除评论
router.get('/comment/delete', (req, res) => {
    const blogId = req.query.blogId;
    const postTime = req.query.comment;
    Blog.findOne({_id: blogId}).then(function (blog) {
       // console.log(blog.comment);
        for (let i = 0; i < blog.comment.length; i++) {
            if (postTime === blog.comment[i].postTime) {
                Blog.update({_id: blogId}, {$pull: {comment: blog.comment[i]}}, function (err) {
                    if (err) {
                        console.log(err)
                    }
                });
            }
        }

    })
    res.render('admin/success', {user: req.user, msg: "删除评论成功", url: "/admin/comment/list"})


})
//通过审核
router.get('/comment/pass', (req, res) => {
    const blogId = req.query.blogId;
    const postTime = req.query.comment;
    //console.log(postTime);
    Blog.findOne({_id: blogId}).then(function (blog) {
        // console.log(blog.comment.length);
        for (let i = 0; i < blog.comment.length; i++) {
            //console.log(postTime);
            //console.log(blog.comment[i].postTime);
            if (postTime === blog.comment[i].postTime) {
                blog.comment[i].pass = true;
                //console.log(blog.comment[i].pass);
                blog.markModified('comment');
                return blog.save();
            }
        }
    })
    res.render('admin/success', {user: req.user, msg: "审核通过！", url: "/admin/comment/list"})

})


//修改博文
router.get('/blog/update', (req, res, next) => {
    const blogId = req.query.blogId;

    Category.find().sort({order: 1}).then(function (category) {

        Blog.findOne({_id: blogId}).populate({path: '_categoryId', select: 'username'}).then(function (blog) {
            if (!blog) {
                res.render('admin/error', {user: req.user, msg: "查询失败", url: "/admin/blog/list"})
            }
            else {
                res.render('admin/blog_update', {user: req.user, blog: blog, categories: category})
            }
        })
    })
})

router.post('/blog/update', (req, res) => {
    let blogId = req.body.blogId;
    let order = req.body.order;
    let title = req.body.title;
    let abstract = req.body.abstract;
    let content = req.body.content;
    //console.log(email,password,userId);
    Blog.findOne({_id: blogId}).then(async function (blog) {
        if (!blog) {
            res.render('admin/error', {user: req.user, msg: "修改失败", url: "/admin/blog/list"})
        }
        if (order === blog.order && title === blog.title && abstract === blog.abstract && content === blog.content) {
            res.render('admin/success', {user: req.user, msg: "没有任何修改", url: "/admin/blog/list"})
        }
        else {
            await Blog.updateOne({_id: blogId},
                {
                    _userId: req.user._id,
                    _categoryId: req.body.categoryName,
                    title: title,
                    abstract: abstract,
                    content: content,
                    order: order,
                })
            res.render('admin/success', {user: req.user, msg: "修改博文成功", url: "/admin/blog/list"})
        }
        // res.render('admin/account_update',{user:userFromDb})
    })

})


//查看全部博文
router.get('/blog/list', (req, res, next) => {
    let page = Number(req.query.page || 1);
    let limit = 5;
    Blog.count().then(function (count) {
        console.log(count);
        //计算总页数
        pages = Math.ceil(count / limit);
        //取值不超过总数
        page = Math.min(page, pages);
        //取值不小于1
        page = Math.max(page, 1);


        let skip = (page - 1) * limit;
        Blog.find().limit(limit).skip(skip).populate(['_categoryId', '_userId']).sort({createdAt: -1}).then(function (blog) {
            res.render('admin/blog_list', {
                user: req.user,
                blog: blog,
                page: page,
                limit: limit,
                pages: pages,
                count: count
            })
        })
    })
})


//隐藏博文
router.get('/blog/conceal', (req, res, next) => {
    let blogId = req.query.blogId;

    Blog.findOne({_id: blogId}).then(function (blog) {

        blog.status = false;
        return blog.save();
    })
    res.render('admin/success', {user: req.user, msg: "隐藏成功", url: "/admin/blog/list"})
})
//显示博文
router.get('/blog/show', (req, res, next) => {
    let blogId = req.query.blogId;

    Blog.findOne({_id: blogId}).then(function (blog) {

        blog.status = true;
        return blog.save();
    })
    res.render('admin/success', {user: req.user, msg: "显示成功", url: "/admin/blog/list"})
})
//博文置顶
router.get('/blog/top',(req,res)=>
{
    let blogId = req.query.blogId;
    Blog.findOne({_id:blogId}).then(function (blog) {
        blog.order = 999;
        return blog.save();
    })
    res.render('admin/success', {user: req.user, msg: "置顶成功", url: "/admin/blog/list"})
})

router.get('/blog/canceltop',(req,res)=>
{
    let blogId = req.query.blogId;
    Blog.findOne({_id:blogId}).then(function (blog) {
        blog.order = 0;
        return blog.save();
    })
    res.render('admin/success', {user: req.user, msg: "取消置顶成功", url: "/admin/blog/list"})
})







/*博文系统*/


/*后台用户查看详细信息等操作*/
//用户查看
router.get('/account/list', (req, res) => {
    let page = Number(req.query.page || 1);
    let limit = 4;
    User.count().then(function (count) {
        //console.log(count);
        //计算总页数
        pages = Math.ceil(count / limit);
        //取值不超过总数
        page = Math.min(page, pages);
        //取值不小于1
        page = Math.max(page, 1);


        let skip = (page - 1) * limit;


        User.find().sort({_id: -1}).limit(limit).skip(skip).then(function (users) {
            res.render('admin/account_list', {
                user: req.user,
                users: users,
                count: count,
                pages: pages,
                limit: limit,
                page: page
            })
        })
    })

})

//删除
router.get('/account/delete', (req, res) => {
    const userId = req.query.userId;
    User.deleteOne({_id: userId}).then(function (err) {
        if (err) {
            console.log(err)
        }
        res.render('admin/success', {user: req.user, msg: "删除用户成功", url: "/admin/account/list"})
    })

})
//查询
router.post('/account/search', async (req, res) => {
    const email = req.body.email;
    console.log(email);
    if (email === "") {
        res.render('admin/error', {'msg': "该内容不能为空！"})
        return;
    }
    const email1 = await User.find({email: email}).sort({createdAt: -1});
    console.log(email1);
    if (email1) {
        res.render('admin/account_list', {user: req.user, email1});
    }
})
/*后台用户查看详细信息等操作*/


/*友情链接管理*/
//查看链接
router.get('/link/list', (req, res, next) => {
    let page = Number(req.query.page || 1);
    let limit = 5;
    Link.count().then(function (count) {
       // console.log(count);
        //计算总页数
        pages = Math.ceil(count / limit);
        //取值不超过总数
        page = Math.min(page, pages);
        //取值不小于1
        page = Math.max(page, 1);


        let skip = (page - 1) * limit;


        Link.find().sort({createdAt: -1}).limit(limit).skip(skip).populate({
            path: '_userId',
            select: 'email'
        }).then(function (link) {
           // console.log(link);
            res.render('admin/link_list', {
                user: req.user,
                link: link,
                page: page,
                count: count,
                limit: limit,
                pages: pages
            })
        })
    })
})
//创建链接
router.get('/link/create', (req, res, next) => {
    res.render('admin/link_create', {user: req.user});
})

router.post('/link/create', async (req, res, next) => {
    const linkName = req.body.linkName;
    const address = req.body.address;
    const order = req.body.order;
    await new Link(
        {
            linkName: linkName,
            address: address,
            order: order,
            _userId: req.user._id,
        }).save();
    res.render('admin/success', {user: req.user, msg: "添加栏目成功", url: "/admin/link/list"});

})

//查询链接
router.post('/link/search', async (req, res, next) => {
    const linkName = req.body.linkName;
    //console.log(linkName);
    if (linkName === "") {
        res.render('admin/error', {'msg': "该内容不能为空！"})
        return;
    }
    const linkdata = await Link.find({linkName: linkName}).populate({
        path: '_userId',
        select: 'email'
    });
    if (linkdata) {
        res.render('admin/link_list', {user: req.user, linkdata})
    }

})
//删除链接
router.get('/link/delete', (req, res, next) => {
    const linkId = req.query.linkId;
    Link.deleteOne({_id: linkId}).then(function (err) {
        if (err) {
            console.log(err)
        }
        res.render('admin/success', {user: req.user, msg: "删除链接成功", url: "/admin/link/list"})
    })
})
//修改链接
router.get('/link/update', (req, res, next) => {
    const linkId = req.query.linkId;

    Link.findOne({_id: linkId}).populate({path: '_userId', select: 'email'}).then(function (link) {
        if (!link) {
            res.render('admin/error', {user: req.user, msg: "查询失败", url: "/admin/blog/list"})
        }
        else {
            res.render('admin/link_update', {user: req.user, link: link})
        }
    })
})
router.post('/link/update', (req, res, next) => {
    const linkId = req.body.linkId;
    const linkName = req.body.linkName;
    const address = req.body.address;
    const order = req.body.order;

    Link.findOne({_id: linkId}).then(async function (link) {
        if (!link) {
            res.render('admin/error', {user: req.user, msg: "修改失败", url: "/admin/link/list"})
        }
        if (order === link.order && linkName === link.linkName && address === link.address) {
            res.render('admin/success', {user: req.user, msg: "没有任何修改", url: "/admin/link/list"})
        }
        else {
            await Link.updateOne({_id: linkId},
                {
                    _userId: req.user._id,
                    linkName: linkName,
                    address: address,
                    order: order,
                })
            res.render('admin/success', {user: req.user, msg: "修改链接成功", url: "/admin/link/list"})
        }
    })
})
/*友情链接管理*/
module.exports = router;
const mongoose=require('mongoose');

const schema = new mongoose.Schema({
    //标题
    title:{
        type:String,
        maxlength:50,
        minlength:5,
        required:true
    },
    //简介
    abstract:{
        type:String,

    },
    //内容
    content:
        {
          type:String,
            minlength: 5,
            required:true
        },
    //浏览量
    pv:
        {
            type:Number,
            default: 0
        },
    //评论
    comment:
        {
          type:Array,
          default:[]
        },
    //内容公开性
    status:
        {
            type:Boolean,
            default:true
        },

     //类别
    _categoryId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:true
    },
    //创建者
    _userId:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
    //排序
    order:
        {
            type:Number,
            default:0
        },
    appendix:
        {
            type:String,

        }
},{timestamps:true})

module.exports=schema;
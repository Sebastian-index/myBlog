const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    linkName:{
        type:String,
        required:true
    },
    _userId:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
    address:
        {
            type:String,
            required:true
        },
    //sort 多级分类
    /* _parentId:
         {
             type:mongoose.Schema.Types.ObjectId,
             ref:'Category',
             required:true
         }*/
    order:
        {
            type:Number,
            default:0
        }
},{timestamps:true})

module.exports=schema;
const mongoose=require('mongoose');
const schema=require('../schemas/blogs')

//User（首字母大写单数→集合小写复数） users
module.exports=mongoose.model('Blog', schema);
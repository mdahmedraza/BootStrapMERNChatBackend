const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL,{
// mongoose.connect("mongodb+srv://ahmedalfateh:jdFbeEY7boPNU7uK@cluster0.h3j6yyv.mongodb.net/bootstrap-chats",{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log("db connected....")
}).catch((err)=>{
    console.log("not connected....")
})
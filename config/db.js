if(process.env.NODE_ENV == "production"){
    module.exports = {
        mongoURI: "mongodb+srv://rildofrancisco2008:<RildoOGostoso10000_>@cluster0.fkorobc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    }
}else{
    module.exports = {
        mongoURI: "mongodb://localhost/blogApp"
    }
}
//Heroku plataforma para deploit

//Loading modules
    process.traceDeprecation = true;
    const Express = require('express');
    const express = Express();
    const { engine } = require('express-handlebars');
    const bodyParser = require('body-parser');
    const admin = require('./routes/admin.js');
    const user = require('./routes/user.js')
    const path = require('path');
    const session = require('express-session');
    const flash = require('connect-flash');//flash tipo de sessão que só aparece uma vez. Biblioteca utiliza métodos obsuletos
    const { default: mongoose } = require('mongoose'); //const mongoose = require('mongoose')
    require('./models/Post.js');
    const Post = mongoose.model("postagens");
    require('./models/Category.js')
    const Category = mongoose.model("categorias");
    const passport = require("passport");
    require("./config/auth")(passport)
    const db = require("./config/db.js")

//Configurations
    //tudo que tem express.use() é um middleware

    //Sessões
        express.use(session({
            secret: "node", //chave para gerar uma sessão, valor à escolha
            resave: true, 
            saveUninitialized: true

        }))

        express.use(passport.initialize());
        express.use(passport.session());

    //Middleware
        express.use((req,res,next)=>{
            //res.locals.nomeDaVariavel serve para criar variáveis globais
            //criação de métodos flash manuais
            res.locals.success_msg = req.session.success_msg 
            res.locals.error_msg = req.session.error_msg
            res.locals.error = req.session.error
            res.locals.user =  req.user || null;
            res.locals.post = req.post || null;
            req.session.success_msg = null;
            req.session.error_msg = null;
            next();
        })
    //Body parser
        express.use(bodyParser.urlencoded({extended:true}))
        express.use(bodyParser.json());
    //Handlebars
        express.engine('handlebars',engine({defaultLayout: 'main'}))
        express.set('view engine', 'handlebars');
    //Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect(db.mongoURI).then(()=>{
            console.log("MongoDB connected")
        }).catch((error)=>{
            console.log("Something went wrong: "+error)
        })
    //Public
        //para dizer que os nossos arquivos estáticos estão na pasta public
        //path.join(__dirname,'public') pega o caminho absoluto da pasta 'public'
        express.use(Express.static(path.join(__dirname,"public"))) 

        //Middlewares são programas que rodam entre o destino e a origem
        /*express.use((req,res,next)=>{
            console.log("I'm a middleware");
            next();//é a funçaõ que permite prosseguir com a execução do projecto, sem ela o projteo fica parado
        
        })*/
        
//Rotas
    //para adicionar as routas do admin. Primeiro um prefixo qualquer, segundo a variável que import as rotas

    express.use('/admin',admin);
    express.use('/user',user)

    express.get('/category',(req,res)=>{
        Category.find().lean().then((categorys)=>{
            res.render("category/index",{categorys: categorys})
        }).catch((error)=>{
            req.session.error_msg="Houve um erro interno";
            console.log("Houve um erro interno: "+error);
            res.redirect("/");
        })
    })
    express.get('/category/:slug',(req,res)=>{
        Category.findOne({slug: req.params.slug}).lean().then((category)=>{
            if(category){
                Post.find({category: category._id}).lean().then((posts)=>{
                    res.render("category/posts",{posts: posts, category: category})
                }).catch((error)=>{
                    req.session.error_msg="Houve um erro ao listar os posts"
                    console.log("Houve um erro ao listar os posts");
                    res.redirect("/")
                })
            }
            else{
                req.session.error_msg="Esta categoria não existe";
                res.redirect("/");
            }
        }).catch((error)=>{
            req.session.error_msg="Houve um erro interno ao encontrar a categoria"
            console.log("Houve um erro interno ao encontrar a categoria: "+error)
            res.redirect("/");
        })
    })
    express.get('/post/:slug',(req,res)=>{
        Post.findOne({slug: req.params.slug}).lean().then((post)=>{
            if(post){
                res.render("post/index",{post: post})
            }else{
                req.session.error_msg="Este postagem não existe";
                res.redirect("/");
            }
        }).catch((error)=>{
            req.session.error_msg="Houve um erro interno";
            console.log("Houve um erro interno: "+error);
            res.redirect("/");

        })

    })
    express.get('/',(req,res)=>{
        Post.find().lean().populate("category").sort({date:"desc"}).then((posts)=>{
            res.render("index",{posts: posts});
        }).catch((error)=>{
            req.session.error_msg="Houve um erro ao listar postagem em HOME"
            console.log("Houve um erro ao listar postagem em HOME: "+error)
            res.redirect("/404");
        })
        
    })
    express.get('/404',(req,res)=>{
        res.send("Erro 404")
    })
//Outros
    const PORT = process.env.PORT || 8081;
    express.listen(PORT,()=>{
        console.log("Servidor a rodar");
    })
